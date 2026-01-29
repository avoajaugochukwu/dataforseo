import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateTopicalMapTopics } from '@/lib/claude';
import { v4 as uuid } from 'uuid';
import type { TopicalMap, Topic } from '@/lib/types';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data.topicalMaps ?? []);
}

export async function POST(req: Request) {
  const { pillarKeyword, description, clusterCount, blogConfigId } = await req.json();
  if (!pillarKeyword) {
    return NextResponse.json({ error: 'pillarKeyword required' }, { status: 400 });
  }

  const db = await getDb();
  const config = blogConfigId ? db.data.blogConfigs.find((c) => c.id === blogConfigId) : undefined;

  const mapId = uuid();
  const count = clusterCount || 10;

  try {
    const result = await generateTopicalMapTopics(pillarKeyword, description || '', count, config?.websiteContext);

    const now = new Date().toISOString();
    const pillarTopicId = uuid();

    const pillarTopic: Topic = {
      id: pillarTopicId,
      title: result.pillar.title,
      slug: result.pillar.slug,
      outline: result.pillar.outline,
      contentPrompt: result.pillar.contentPrompt,
      keywordIds: [],
      status: 'draft',
      createdAt: now,
      topicalMapId: mapId,
      role: 'pillar',
      relatedTopicIds: [],
    };

    const clusterTopics: Topic[] = result.clusters.map((c) => ({
      id: uuid(),
      title: c.title,
      slug: c.slug,
      outline: c.outline,
      contentPrompt: c.contentPrompt,
      keywordIds: [],
      status: 'draft',
      createdAt: now,
      topicalMapId: mapId,
      role: 'cluster',
      pillarTopicId,
      relatedTopicIds: [],
    }));

    pillarTopic.relatedTopicIds = clusterTopics.map((t) => t.id);

    const map: TopicalMap = {
      id: mapId,
      pillarTitle: result.pillar.title,
      pillarKeyword,
      description: description || '',
      clusterCount: clusterTopics.length,
      status: 'draft',
      createdAt: now,
    };

    db.data.topicalMaps.push(map);
    db.data.topics.push(pillarTopic, ...clusterTopics);
    await db.write();

    return NextResponse.json({ map, pillar: pillarTopic, clusters: clusterTopics }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
