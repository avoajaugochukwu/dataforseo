import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { Keyword } from '@/lib/types';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data.keywords);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await getDb();

  const items: Keyword[] = (Array.isArray(body) ? body : [body]).map((k: Record<string, unknown>) => ({
    id: uuid(),
    keyword: k.keyword as string,
    searchVolume: (k.searchVolume ?? k.search_volume ?? 0) as number,
    competition: (k.competition ?? 0) as number,
    cpc: (k.cpc ?? 0) as number,
    savedAt: new Date().toISOString(),
  }));

  db.data.keywords.push(...items);
  await db.write();
  return NextResponse.json(items, { status: 201 });
}
