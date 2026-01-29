import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateContent } from '@/lib/claude';
import { v4 as uuid } from 'uuid';

export async function POST(req: Request) {
  const { topicId } = await req.json();
  if (!topicId) {
    return NextResponse.json({ error: 'topicId required' }, { status: 400 });
  }

  const db = await getDb();
  const topic = db.data.topics.find((t) => t.id === topicId);
  if (!topic) {
    return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
  }

  try {
    const { content, metaTitle, metaDescription, excerpt } = await generateContent(topic.title, topic.outline, topic.contentPrompt);
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

    db.data.drafts.push(draft);
    topic.status = 'generated';
    await db.write();

    return NextResponse.json(draft, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
