'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { DraftPost, BlogConfig } from '@/lib/types';

const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default.Markdown), { ssr: false });

export default function PublishPage() {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [configs, setConfigs] = useState<BlogConfig[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftPost | null>(null);
  const [selectedConfig, setSelectedConfig] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetch('/api/drafts').then((r) => r.json()).then(setDrafts);
    fetch('/api/blog-configs').then((r) => r.json()).then(setConfigs);
  }, []);

  const unpublished = drafts.filter((d) => d.status !== 'published');

  async function publish() {
    if (!selectedDraft || !selectedConfig) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ draftId: selectedDraft.id, blogConfigId: selectedConfig }) });
      const data = await res.json();
      if (data.debug) data.debug.forEach((d: string) => console.log(d));
      if (!res.ok) throw new Error(data.error);
      setDrafts((d) => d.map((x) => (x.id === selectedDraft.id ? { ...x, status: 'published' as const } : x)));
      setSelectedDraft(null);
      toast('Published successfully', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
    setPublishing(false);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review & Publish</h2>

      <Card>
        <h3 className="font-semibold mb-3">Unpublished Drafts ({unpublished.length})</h3>
        {unpublished.length === 0 && <p className="text-sm text-zinc-500">No drafts to publish.</p>}
        {unpublished.map((d) => (
          <div
            key={d.id}
            className={`flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-2 cursor-pointer rounded px-2 ${selectedDraft?.id === d.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            onClick={() => setSelectedDraft(d)}
          >
            <p className="font-medium">{d.title}</p>
            <span className="text-xs text-zinc-500">{d.status}</span>
          </div>
        ))}
      </Card>

      {selectedDraft && (
        <>
          <Card>
            <h3 className="font-semibold mb-3">Preview: {selectedDraft.title}</h3>
            <div className="prose dark:prose-invert max-w-none" data-color-mode="auto">
              <MDEditor source={selectedDraft.content} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">Publish To</h3>
            {configs.length === 0 && <p className="text-sm text-zinc-500">No blog configs. Add one in Settings.</p>}
            <div className="flex gap-3 items-end">
              <select
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                value={selectedConfig}
                onChange={(e) => setSelectedConfig(e.target.value)}
              >
                <option value="">Select blog...</option>
                {configs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <Button onClick={publish} loading={publishing} disabled={!selectedConfig}>Publish</Button>
            </div>
          </Card>
        </>
      )}

      {drafts.filter((d) => d.status === 'published').length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Published</h3>
          {drafts.filter((d) => d.status === 'published').map((d) => (
            <div key={d.id} className="border-b border-zinc-100 dark:border-zinc-800 py-2">
              <p className="font-medium">{d.title}</p>
              <p className="text-xs text-zinc-500">Published {d.publishedAt ? new Date(d.publishedAt).toLocaleString() : ''}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
