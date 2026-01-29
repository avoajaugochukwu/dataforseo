import { NextResponse } from 'next/server';
import { getJob, cancelJob } from '@/lib/batch-queue';

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const cancelled = cancelJob(jobId);
  if (!cancelled) return NextResponse.json({ error: 'Job not found or not running' }, { status: 404 });
  return NextResponse.json({ success: true });
}
