import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const map = db.data.topicalMaps.find((m) => m.id === id);
  if (!map) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const topics = db.data.topics.filter((t) => t.topicalMapId === id);
  for (const topic of topics) {
    if (topic.status === 'draft') {
      topic.status = 'approved';
    }
  }
  map.status = 'approved';
  await db.write();

  return NextResponse.json({ success: true, approvedCount: topics.length });
}
