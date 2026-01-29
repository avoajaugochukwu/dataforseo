import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE() {
  const db = await getDb();
  db.data.keywords = [];
  db.data.topics = [];
  db.data.drafts = [];
  await db.write();
  return NextResponse.json({ ok: true });
}
