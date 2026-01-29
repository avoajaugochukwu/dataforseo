'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { Topic, DraftPost } from '@/lib/types';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function ContentPage() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [editing, setEditing] = useState<DraftPost | null>(null);

  useEffect(() => {
    fetch('/api/topics').then((r) => r.json()).then(setTopics);
    fetch('/api/drafts').then((r) => r.json()).then(setDrafts);
  }, []);

  const approvedTopics = topics.filter((t) => t.status === 'approved');

  async function generate(topicId: string) {
    setGenerating(topicId);
    try {
      const res = await fetch('/api/content/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId }) });
      if (!res.ok) throw new Error((await res.json()).error);
      const draft: DraftPost = await res.json();
      setDrafts((d) => [...d, draft]);
      setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, status: 'generated' as const } : t)));
      toast('Content generated', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
    setGenerating(null);
  }

  async function saveDraft() {
    if (!editing) return;
    await fetch(`/api/drafts/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editing.content, title: editing.title, metaTitle: editing.metaTitle, metaDescription: editing.metaDescription, excerpt: editing.excerpt }) });
    setDrafts((d) => d.map((x) => (x.id === editing.id ? editing : x)));
    setEditing(null);
    toast('Draft saved', 'success');
  }

  async function deleteDraft(id: string) {
    if (!confirm('Delete this draft?')) return;
    await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
    setDrafts((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Content Generation</h2>

      {approvedTopics.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-3">Approved Topics</h3>
          {approvedTopics.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-2">
              <p className="font-medium">{t.title}</p>
              <Button onClick={() => generate(t.id)} loading={generating === t.id}>Generate</Button>
            </div>
          ))}
        </Card>
      )}

      {editing ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Editing: {editing.title}</h3>
            <div className="flex gap-2">
              <Button onClick={saveDraft}>Save</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <Input label="Meta Title" value={editing.metaTitle || ''} onChange={(e) => setEditing({ ...editing, metaTitle: e.target.value })} />
            <Input label="Meta Description" value={editing.metaDescription || ''} onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })} />
            <Input label="Excerpt" value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
          </div>
          <MDEditor value={editing.content} onChange={(val) => setEditing({ ...editing, content: val || '' })} height={500} />
        </Card>
      ) : (
        <Card>
          <h3 className="font-semibold mb-3">Drafts ({drafts.length})</h3>
          {drafts.length === 0 && <p className="text-sm text-zinc-500">No drafts yet. Generate content from approved topics above.</p>}
          {drafts.map((d) => (
            <div key={d.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-2">
              <div>
                <p className="font-medium">{d.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${d.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>{d.status}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(d)}>Edit</Button>
                <Button variant="danger" onClick={() => deleteDraft(d.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
