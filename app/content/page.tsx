'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { BatchProgress } from '@/components/batch-progress';
import { TopicEditor } from '@/components/topic-editor';
import type { BlogConfig, Topic, DraftPost } from '@/lib/types';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export default function ContentPage() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [editing, setEditing] = useState<DraftPost | null>(null);
  const [blogConfigs, setBlogConfigs] = useState<BlogConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);

  const loadData = useCallback(() => {
    fetch('/api/topics').then((r) => r.json()).then(setTopics);
    fetch('/api/drafts').then((r) => r.json()).then(setDrafts);
  }, []);

  useEffect(() => {
    loadData();
    fetch('/api/blog-configs').then((r) => r.json()).then((configs: BlogConfig[]) => {
      setBlogConfigs(configs);
      if (configs.length > 0) setSelectedConfigId(configs[0].id);
    });
  }, [loadData]);

  const approvedTopics = topics.filter((t) => t.status === 'approved');

  function toggleTopicSelection(id: string) {
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllTopics() {
    if (selectedTopicIds.size === approvedTopics.length) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(approvedTopics.map((t) => t.id)));
    }
  }

  async function generate(topicId: string) {
    setGenerating(topicId);
    try {
      const res = await fetch('/api/content/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId, blogConfigId: selectedConfigId || undefined }) });
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

  async function generateAll() {
    const ids = Array.from(selectedTopicIds);
    if (ids.length === 0) return;
    try {
      const res = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds: ids, blogConfigId: selectedConfigId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { jobId } = await res.json();
      setBatchJobId(jobId);
      setSelectedTopicIds(new Set());
      toast('Batch generation started', 'info');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function handleBatchComplete() {
    loadData();
  }

  function handleRetryFailed(failedTopicIds: string[]) {
    setSelectedTopicIds(new Set(failedTopicIds));
    setBatchJobId(null);
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

      {batchJobId && (
        <Card>
          <h3 className="font-semibold mb-3">Batch Progress</h3>
          <BatchProgress
            jobId={batchJobId}
            onComplete={handleBatchComplete}
            onRetryFailed={handleRetryFailed}
          />
        </Card>
      )}

      {approvedTopics.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Approved Topics</h3>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={toggleAllTopics}>
                {selectedTopicIds.size === approvedTopics.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button onClick={generateAll} disabled={selectedTopicIds.size === 0}>
                Generate All ({selectedTopicIds.size})
              </Button>
            </div>
          </div>
          {blogConfigs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Blog Config (for AI context)</label>
              <select
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
              >
                <option value="">None</option>
                {blogConfigs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {approvedTopics.map((t) => (
            <div key={t.id} className="border-b border-zinc-100 dark:border-zinc-800 py-2">
              {editingTopic === t.id ? (
                <TopicEditor
                  topic={t}
                  onSave={(updated) => {
                    setTopics((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingTopic(null);
                    toast('Topic updated', 'success');
                  }}
                  onCancel={() => setEditingTopic(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTopicIds.has(t.id)}
                      onChange={() => toggleTopicSelection(t.id)}
                    />
                    <div
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => setEditingTopic(t.id)}
                    >
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-zinc-500">Click to edit</p>
                    </div>
                  </div>
                  <Button onClick={() => generate(t.id)} loading={generating === t.id}>Generate</Button>
                </div>
              )}
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
