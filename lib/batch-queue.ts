import { v4 as uuid } from 'uuid';
import { getDb } from './db';
import { generateContent } from './claude';
import type { BatchJob } from './types';

const jobs = new Map<string, BatchJob>();

let writeLock = Promise.resolve();

function serializedWrite(fn: () => Promise<void>): Promise<void> {
  writeLock = writeLock.then(fn, fn);
  return writeLock;
}

async function processJob(jobId: string, blogConfigId?: string) {
  const job = jobs.get(jobId)!;
  if (!job) return;

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
          config?.websiteContext
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

  if (job.status !== 'cancelled') {
    job.status = 'completed';
  }
}

export function startBatch(topicIds: string[], blogConfigId?: string): string {
  const id = uuid();
  const job: BatchJob = {
    id,
    topicIds,
    completed: 0,
    failed: 0,
    total: topicIds.length,
    status: 'running',
    errors: [],
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
