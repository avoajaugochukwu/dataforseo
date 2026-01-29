'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { BlogConfig, Keyword, Topic } from '@/lib/types';

export default function TopicsPage() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKws, setSelectedKws] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<Topic[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pendingTopics, setPendingTopics] = useState<Array<{ title: string; slug: string; outline: string[]; contentPrompt: string; keywordGroup: string[] }>>([]);
  const [blogConfigs, setBlogConfigs] = useState<BlogConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  useEffect(() => {
    fetch('/api/keywords').then((r) => r.json()).then(setKeywords);
    fetch('/api/topics').then((r) => r.json()).then(setTopics);
    fetch('/api/blog-configs').then((r) => r.json()).then((configs: BlogConfig[]) => {
      setBlogConfigs(configs);
      if (configs.length > 0) setSelectedConfigId(configs[0].id);
    });
  }, []);

  async function generate() {
    const kws = keywords.filter((k) => selectedKws.has(k.id)).map((k) => k.keyword);
    if (kws.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/topics/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: kws, blogConfigId: selectedConfigId || undefined }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setPendingTopics(await res.json());
    } catch (e) {
      toast((e as Error).message, 'error');
    }
    setGenerating(false);
  }

  async function saveTopics() {
    const mapped = pendingTopics.map((t) => ({
      ...t,
      keywordIds: keywords.filter((k) => t.keywordGroup.includes(k.keyword)).map((k) => k.id),
    }));
    const res = await fetch('/api/topics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapped) });
    const saved: Topic[] = await res.json();
    setTopics((prev) => [...prev, ...saved]);
    setPendingTopics([]);
    toast(`Saved ${saved.length} topics`, 'success');
  }

  async function approve(id: string) {
    await fetch(`/api/topics/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'approved' } : t)));
    toast('Topic approved', 'success');
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/topics/${id}`, { method: 'DELETE' });
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Topics & Outlines</h2>

      <Card>
        <h3 className="font-semibold mb-3">Select Keywords</h3>
        {keywords.length === 0 && <p className="text-sm text-zinc-500">No saved keywords. Go to Keywords page first.</p>}
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.map((k) => (
            <label key={k.id} className="flex items-center gap-1 text-sm bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded cursor-pointer">
              <input type="checkbox" checked={selectedKws.has(k.id)} onChange={() => setSelectedKws((s) => { const n = new Set(s); n.has(k.id) ? n.delete(k.id) : n.add(k.id); return n; })} />
              {k.keyword}
            </label>
          ))}
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
        <Button onClick={generate} loading={generating} disabled={selectedKws.size === 0}>Generate Topics</Button>
      </Card>

      {pendingTopics.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Generated Topics (Review)</h3>
            <Button onClick={saveTopics}>Save All</Button>
          </div>
          {pendingTopics.map((t, i) => (
            <div key={i} className="border-b border-zinc-200 dark:border-zinc-700 py-3">
              <p className="font-medium">{t.title}</p>
              <p className="text-xs text-zinc-500">/{t.slug}</p>
              <ul className="mt-1 ml-4 list-disc text-sm text-zinc-600 dark:text-zinc-400">
                {t.outline.map((s, j) => <li key={j}>{s}</li>)}
              </ul>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-3">Saved Topics ({topics.length})</h3>
        {topics.length === 0 && <p className="text-sm text-zinc-500">No topics yet.</p>}
        {topics.map((t) => (
          <div key={t.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-2">
            <div>
              <p className="font-medium">{t.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'generated' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{t.status}</span>
            </div>
            <div className="flex gap-2">
              {t.status === 'draft' && <Button variant="secondary" onClick={() => approve(t.id)}>Approve</Button>}
              <Button variant="danger" onClick={() => deleteTopic(t.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
