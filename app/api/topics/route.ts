import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { Topic } from '@/lib/types';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data.topics);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await getDb();

  const items: Topic[] = (Array.isArray(body) ? body : [body]).map((t: Record<string, unknown>) => ({
    id: uuid(),
    title: t.title as string,
    slug: t.slug as string,
    outline: t.outline as string[],
    contentPrompt: t.contentPrompt as string,
    keywordIds: (t.keywordIds ?? []) as string[],
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
  }));

  db.data.topics.push(...items);
  await db.write();
  return NextResponse.json(items, { status: 201 });
}
