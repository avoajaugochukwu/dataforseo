'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { BatchJob } from '@/lib/types';

interface BatchProgressProps {
  jobId: string;
  onComplete?: () => void;
  onRetryFailed?: (failedTopicIds: string[]) => void;
}

export function BatchProgress({ jobId, onComplete, onRetryFailed }: BatchProgressProps) {
  const [job, setJob] = useState<BatchJob | null>(null);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/content/generate-batch/${jobId}`);
        if (!res.ok) return;
        const data: BatchJob = await res.json();
        if (active) setJob(data);
        if (data.status === 'running') {
          setTimeout(poll, 2000);
        } else {
          onComplete?.();
        }
      } catch {
        if (active) setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { active = false; };
  }, [jobId, onComplete]);

  if (!job) return null;

  const done = job.completed + job.failed;
  const pct = job.total > 0 ? Math.round((done / job.total) * 100) : 0;

  async function cancel() {
    await fetch(`/api/content/generate-batch/${jobId}`, { method: 'DELETE' });
  }

  const failedIds = job.errors.map((e) => e.topicId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          {job.completed}/{job.total} generated
          {job.failed > 0 && <span className="text-red-500 ml-2">{job.failed} failed</span>}
        </span>
        <span className="text-zinc-500">{job.status}</span>
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${job.failed > 0 ? 'bg-yellow-500' : 'bg-blue-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        {job.status === 'running' && (
          <Button variant="danger" onClick={cancel}>Cancel</Button>
        )}
        {job.status !== 'running' && failedIds.length > 0 && onRetryFailed && (
          <Button variant="secondary" onClick={() => onRetryFailed(failedIds)}>
            Retry Failed ({failedIds.length})
          </Button>
        )}
      </div>
      {job.errors.length > 0 && (
        <div className="text-xs text-red-500 space-y-1 mt-2">
          {job.errors.map((e, i) => (
            <div key={i}>Topic {e.topicId.slice(0, 8)}...: {e.error}</div>
          ))}
        </div>
      )}
    </div>
  );
}
