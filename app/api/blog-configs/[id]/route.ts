import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  const idx = db.data.blogConfigs.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.data.blogConfigs[idx] = { ...db.data.blogConfigs[idx], ...body, id };
  await db.write();
  return NextResponse.json(db.data.blogConfigs[idx]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  db.data.blogConfigs = db.data.blogConfigs.filter((c) => c.id !== id);
  await db.write();
  return NextResponse.json({ success: true });
}
