import { v4 as uuid } from 'uuid';
import { getDb } from './db';
import { generateContent } from './claude';
import { publishToPayload } from './payload';
import type { BatchJob, TopicalMapContext } from './types';

const globalForJobs = globalThis as unknown as { __batchJobs?: Map<string, BatchJob> };
if (!globalForJobs.__batchJobs) {
  globalForJobs.__batchJobs = new Map<string, BatchJob>();
}
const jobs = globalForJobs.__batchJobs;

let writeLock = Promise.resolve();

function serializedWrite(fn: () => Promise<void>): Promise<void> {
  writeLock = writeLock.then(fn, fn);
  return writeLock;
}

async function buildTopicalMapContext(topicIds: string[], blogConfigId?: string): Promise<TopicalMapContext | undefined> {
  const db = await getDb();
  const topics = db.data.topics.filter((t) => topicIds.includes(t.id));
  const pillar = topics.find((t) => t.role === 'pillar');
  if (!pillar) return undefined;

  const clusters = topics.filter((t) => t.role === 'cluster');

  // Determine baseUrl from blog config's blogUrl, or empty string
  let baseUrl = '';
  if (blogConfigId) {
    const config = db.data.blogConfigs.find((c) => c.id === blogConfigId);
    if (config?.blogUrl) {
      baseUrl = config.blogUrl.replace(/\/$/, '');
    }
  }

  return {
    pillar: { id: pillar.id, title: pillar.title, slug: pillar.slug },
    clusters: clusters.map((c) => ({ id: c.id, title: c.title, slug: c.slug })),
    baseUrl,
  };
}

async function processJob(jobId: string, blogConfigId?: string) {
  const job = jobs.get(jobId)!;
  if (!job) return;

  // Build topical map context before starting workers
  const topicalMapContext = await buildTopicalMapContext(job.topicIds, blogConfigId);

  const queue = [...job.topicIds];

  async function worker() {
    while (queue.length > 0) {
      if (job.status === 'cancelled') return;
      const topicId = queue.shift();
      if (!topicId) return;

      try {
        const db = await getDb();
        const topic = db.data.topics.find((t) => t.id === topicId);
        if (!topic) {
          job.failed++;
          job.errors.push({ topicId, error: 'Topic not found' });
          continue;
        }

        const config = blogConfigId
          ? db.data.blogConfigs.find((c) => c.id === blogConfigId)
          : undefined;

        const { content, metaTitle, metaDescription, excerpt } = await generateContent(
          topic.title,
          topic.outline,
          topic.contentPrompt,
          config?.websiteContext,
          {
            role: topic.role,
            topicalMapContext,
            currentTopicId: topic.id,
          }
        );

        const now = new Date().toISOString();
        const draft = {
          id: uuid(),
          topicId: topic.id,
          title: topic.title,
          slug: topic.slug,
          content,
          metaTitle,
          metaDescription,
          excerpt,
          status: 'draft' as const,
          createdAt: now,
          updatedAt: now,
        };

        await serializedWrite(async () => {
          const db = await getDb();
          db.data.drafts.push(draft);
          const t = db.data.topics.find((t) => t.id === topicId);
          if (t) t.status = 'generated';
          await db.write();
        });

        job.completed++;
      } catch (e) {
        job.failed++;
        job.errors.push({ topicId, error: (e as Error).message });
      }
    }
  }

  const workers = Array.from({ length: 3 }, () => worker());
  await Promise.all(workers);

  // Auto-publish phase
  if (job.autoPublish && blogConfigId && (job.status as string) !== 'cancelled') {
    job.publishedCount = 0;
    job.publishErrors = [];

    const db = await getDb();
    const config = db.data.blogConfigs.find((c) => c.id === blogConfigId);

    if (config) {
      // Find all drafts generated in this job
      const generatedDrafts = db.data.drafts.filter(
        (d) => job.topicIds.includes(d.topicId) && d.status === 'draft'
      );

      for (const draft of generatedDrafts) {
        if (job.status === 'cancelled') break;
        try {
          await publishToPayload(draft, config);
          await serializedWrite(async () => {
            const db = await getDb();
            const d = db.data.drafts.find((dd) => dd.id === draft.id);
            if (d) {
              d.status = 'published';
              d.publishedTo = blogConfigId;
              d.publishedAt = new Date().toISOString();
              d.updatedAt = new Date().toISOString();
            }
            await db.write();
          });
          job.publishedCount!++;
        } catch (e) {
          job.publishErrors!.push({ topicId: draft.topicId, error: (e as Error).message });
        }
      }
    }
  }

  if (job.status !== 'cancelled') {
    job.status = 'completed';
  }
}

export function startBatch(topicIds: string[], blogConfigId?: string, autoPublish?: boolean): string {
  const id = uuid();
  const job: BatchJob = {
    id,
    topicIds,
    completed: 0,
    failed: 0,
    total: topicIds.length,
    status: 'running',
    errors: [],
    blogConfigId,
    autoPublish,
    publishedCount: 0,
    publishErrors: [],
  };
  jobs.set(id, job);
  processJob(id, blogConfigId);
  return id;
}

export function getJob(jobId: string): BatchJob | undefined {
  return jobs.get(jobId);
}

export function cancelJob(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job || job.status !== 'running') return false;
  job.status = 'cancelled';
  return true;
}
