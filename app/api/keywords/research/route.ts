import { NextResponse } from 'next/server';
import { researchKeywords } from '@/lib/dataforseo';

export async function POST(req: Request) {
  const { seeds } = await req.json();
  if (!seeds || !Array.isArray(seeds) || seeds.length === 0) {
    return NextResponse.json({ error: 'seeds array required' }, { status: 400 });
  }

  try {
    const results = await researchKeywords(seeds);
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
