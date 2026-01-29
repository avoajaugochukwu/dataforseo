import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const draft = db.data.drafts.find((d) => d.id === id);
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(draft);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = await getDb();
  const idx = db.data.drafts.findIndex((d) => d.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  db.data.drafts[idx] = { ...db.data.drafts[idx], ...body, id, updatedAt: new Date().toISOString() };
  await db.write();
  return NextResponse.json(db.data.drafts[idx]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  db.data.drafts = db.data.drafts.filter((d) => d.id !== id);
  await db.write();
  return NextResponse.json({ success: true });
}
