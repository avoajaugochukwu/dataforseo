import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const map = db.data.topicalMaps.find((m) => m.id === id);
  if (!map) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const topics = db.data.topics.filter((t) => t.topicalMapId === id);
  const pillar = topics.find((t) => t.role === 'pillar');
  const clusters = topics.filter((t) => t.role === 'cluster');

  return NextResponse.json({ map, pillar, clusters });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  db.data.topicalMaps = db.data.topicalMaps.filter((m) => m.id !== id);
  db.data.topics = db.data.topics.filter((t) => t.topicalMapId !== id);
  await db.write();
  return NextResponse.json({ success: true });
}
