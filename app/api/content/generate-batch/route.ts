import { NextResponse } from 'next/server';
import { startBatch } from '@/lib/batch-queue';

export async function POST(req: Request) {
  const { topicIds, blogConfigId, autoPublish } = await req.json();
  if (!topicIds || !Array.isArray(topicIds) || topicIds.length === 0) {
    return NextResponse.json({ error: 'topicIds array required' }, { status: 400 });
  }

  const jobId = startBatch(topicIds, blogConfigId, autoPublish);
  return NextResponse.json({ jobId }, { status: 201 });
}
