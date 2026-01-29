import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  const idx = db.data.topics.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.data.topics[idx] = { ...db.data.topics[idx], ...body, id };
  await db.write();
  return NextResponse.json(db.data.topics[idx]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  db.data.topics = db.data.topics.filter((t) => t.id !== id);
  await db.write();
  return NextResponse.json({ success: true });
}
