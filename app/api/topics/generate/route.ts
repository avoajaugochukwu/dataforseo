import { NextResponse } from 'next/server';
import { generateTopics } from '@/lib/claude';

export async function POST(req: Request) {
  const { keywords } = await req.json();
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: 'keywords array required' }, { status: 400 });
  }

  try {
    const topics = await generateTopics(keywords);
    return NextResponse.json(topics);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
