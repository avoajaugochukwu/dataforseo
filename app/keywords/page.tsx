'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { Keyword } from '@/lib/types';

interface ResearchResult {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
}

export default function KeywordsPage() {
  const { toast } = useToast();
  const [seeds, setSeeds] = useState('');
  const [researching, setResearching] = useState(false);
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Keyword[]>([]);
  const [minVolume, setMinVolume] = useState(0);

  useEffect(() => {
    fetch('/api/keywords').then((r) => r.json()).then(setSaved);
  }, []);

  async function research() {
    if (!seeds.trim()) return;
    setResearching(true);
    try {
      const res = await fetch('/api/keywords/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seeds: [seeds.trim()] }) });
      if (!res.ok) throw new Error((await res.json()).error);
      setResults(await res.json());
      setSelected(new Set());
    } catch (e) {
      toast((e as Error).message, 'error');
    }
    setResearching(false);
  }

  async function saveSelected() {
    const items = results.filter((_, i) => selected.has(i)).map((r) => ({
      keyword: r.keyword,
      searchVolume: r.search_volume,
      competition: r.competition,
      cpc: r.cpc,
    }));
    if (items.length === 0) return;
    const res = await fetch('/api/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
    const newKws: Keyword[] = await res.json();
    setSaved((s) => [...s, ...newKws]);
    setResults([]);
    setSelected(new Set());
    toast(`Saved ${newKws.length} keywords`, 'success');
  }

  async function deleteKeyword(id: string) {
    await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
    setSaved((s) => s.filter((k) => k.id !== id));
  }

  const filtered = results.filter((r) => r.search_volume >= minVolume);

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((_, i) => results.indexOf(filtered[i]))));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Keyword Research</h2>

      <Card>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input label="Seed Keyword" value={seeds} onChange={(e) => setSeeds(e.target.value)} placeholder="e.g. seo tools" />
          </div>
          <Button onClick={research} loading={researching}>Research</Button>
        </div>
      </Card>

      {results.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Results ({filtered.length})</h3>
            <div className="flex gap-3 items-end">
              <Input label="Min Volume" type="number" value={String(minVolume)} onChange={(e) => setMinVolume(Number(e.target.value))} className="w-28" />
              <Button variant="secondary" onClick={toggleAll}>Toggle All</Button>
              <Button onClick={saveSelected} disabled={selected.size === 0}>Save Selected ({selected.size})</Button>
            </div>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-zinc-200 dark:border-zinc-700">
                <th className="p-2"></th><th className="p-2">Keyword</th><th className="p-2">Volume</th><th className="p-2">Competition</th><th className="p-2">CPC</th>
              </tr></thead>
              <tbody>
                {filtered.map((r) => {
                  const idx = results.indexOf(r);
                  return (
                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="p-2"><input type="checkbox" checked={selected.has(idx)} onChange={() => setSelected((s) => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })} /></td>
                      <td className="p-2">{r.keyword}</td>
                      <td className="p-2">{r.search_volume.toLocaleString()}</td>
                      <td className="p-2">{r.competition.toFixed(2)}</td>
                      <td className="p-2">${r.cpc.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-3">Saved Keywords ({saved.length})</h3>
        {saved.length === 0 && <p className="text-sm text-zinc-500">No saved keywords yet.</p>}
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <tbody>
              {saved.map((k) => (
                <tr key={k.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-2">{k.keyword}</td>
                  <td className="p-2">{k.searchVolume.toLocaleString()}</td>
                  <td className="p-2">{k.competition.toFixed(2)}</td>
                  <td className="p-2">${k.cpc.toFixed(2)}</td>
                  <td className="p-2"><Button variant="danger" onClick={() => deleteKeyword(k.id)}>Delete</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
