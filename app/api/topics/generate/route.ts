import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateTopics } from '@/lib/claude';

export async function POST(req: Request) {
  const { keywords, blogConfigId } = await req.json();
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return NextResponse.json({ error: 'keywords array required' }, { status: 400 });
  }

  const db = await getDb();
  const config = blogConfigId ? db.data.blogConfigs.find((c) => c.id === blogConfigId) : undefined;

  try {
    const topics = await generateTopics(keywords, config?.websiteContext);
    return NextResponse.json(topics);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
