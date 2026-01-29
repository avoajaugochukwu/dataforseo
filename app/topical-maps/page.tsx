'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { BatchProgress } from '@/components/batch-progress';
import { TopicEditor } from '@/components/topic-editor';
import type { BlogConfig, TopicalMap, Topic } from '@/lib/types';

interface MapDetail {
  map: TopicalMap;
  pillar: Topic | null;
  clusters: Topic[];
}

export default function TopicalMapsPage() {
  const { toast } = useToast();
  const [maps, setMaps] = useState<TopicalMap[]>([]);
  const [pillarKeyword, setPillarKeyword] = useState('');
  const [description, setDescription] = useState('');
  const [clusterCount, setClusterCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [mapDetail, setMapDetail] = useState<MapDetail | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [batchJobId, setBatchJobId] = useState<string | null>(null);
  const [blogConfigs, setBlogConfigs] = useState<BlogConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  const loadMaps = useCallback(() => {
    fetch('/api/topical-maps').then((r) => r.json()).then(setMaps);
  }, []);

  useEffect(() => {
    loadMaps();
    fetch('/api/blog-configs').then((r) => r.json()).then((configs: BlogConfig[]) => {
      setBlogConfigs(configs);
      if (configs.length > 0) setSelectedConfigId(configs[0].id);
    });
  }, [loadMaps]);

  async function createMap() {
    if (!pillarKeyword.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/topical-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillarKeyword, description, clusterCount, blogConfigId: selectedConfigId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setMaps((prev) => [...prev, data.map]);
      setPillarKeyword('');
      setDescription('');
      toast('Topical map created', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
    setGenerating(false);
  }

  async function expandMap(id: string) {
    if (expandedMapId === id) {
      setExpandedMapId(null);
      setMapDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/topical-maps/${id}`);
      const data: MapDetail = await res.json();
      setMapDetail(data);
      setExpandedMapId(id);
    } catch {
      toast('Failed to load map details', 'error');
    }
  }

  async function deleteMap(id: string) {
    if (!confirm('Delete this topical map and all its topics?')) return;
    await fetch(`/api/topical-maps/${id}`, { method: 'DELETE' });
    setMaps((prev) => prev.filter((m) => m.id !== id));
    if (expandedMapId === id) {
      setExpandedMapId(null);
      setMapDetail(null);
    }
    toast('Map deleted', 'info');
  }

  async function approveAll(id: string) {
    try {
      const res = await fetch(`/api/topical-maps/${id}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error);
      setMaps((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'approved' as const } : m)));
      if (mapDetail && mapDetail.map.id === id) {
        setMapDetail({
          ...mapDetail,
          map: { ...mapDetail.map, status: 'approved' },
          pillar: mapDetail.pillar ? { ...mapDetail.pillar, status: 'approved' } : null,
          clusters: mapDetail.clusters.map((c) => ({ ...c, status: 'approved' as const })),
        });
      }
      toast('All topics approved', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function generateAllContent(mapId: string) {
    if (!mapDetail) return;
    const allTopics = [mapDetail.pillar, ...mapDetail.clusters].filter(
      (t): t is Topic => t !== null && t.status === 'approved'
    );
    if (allTopics.length === 0) {
      toast('No approved topics to generate', 'error');
      return;
    }
    try {
      const res = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds: allTopics.map((t) => t.id), blogConfigId: selectedConfigId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { jobId } = await res.json();
      setBatchJobId(jobId);
      toast('Batch generation started', 'info');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function handleTopicSave(updated: Topic) {
    if (!mapDetail) return;
    if (mapDetail.pillar?.id === updated.id) {
      setMapDetail({ ...mapDetail, pillar: updated });
    } else {
      setMapDetail({
        ...mapDetail,
        clusters: mapDetail.clusters.map((c) => (c.id === updated.id ? updated : c)),
      });
    }
    setEditingTopicId(null);
    toast('Topic updated', 'success');
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-600',
    approved: 'bg-green-100 text-green-700',
    generating: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    generated: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Topical Maps</h2>

      {batchJobId && (
        <Card>
          <h3 className="font-semibold mb-3">Batch Progress</h3>
          <BatchProgress
            jobId={batchJobId}
            onComplete={() => {
              if (expandedMapId) expandMap(expandedMapId);
            }}
          />
        </Card>
      )}

      <Card>
        <h3 className="font-semibold mb-3">Create Topical Map</h3>
        <div className="space-y-3">
          <Input
            label="Pillar Keyword"
            value={pillarKeyword}
            onChange={(e) => setPillarKeyword(e.target.value)}
            placeholder="e.g. content marketing"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description / Context</label>
            <textarea
              className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the topical map should cover..."
            />
          </div>
          <Input
            label="Cluster Count"
            type="number"
            value={String(clusterCount)}
            onChange={(e) => setClusterCount(Number(e.target.value))}
          />
          {blogConfigs.length > 0 && (
            <div>
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
          <Button onClick={createMap} loading={generating} disabled={!pillarKeyword.trim()}>
            Generate Topical Map
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Existing Maps ({maps.length})</h3>
        {maps.length === 0 && <p className="text-sm text-zinc-500">No topical maps yet.</p>}
        {maps.map((m) => (
          <div key={m.id} className="border-b border-zinc-100 dark:border-zinc-800 py-3">
            <div className="flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => expandMap(m.id)}>
                <p className="font-medium">{m.pillarTitle}</p>
                <p className="text-xs text-zinc-500">
                  Keyword: {m.pillarKeyword} &middot; {m.clusterCount} clusters
                </p>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColors[m.status] || ''}`}>
                  {m.status}
                </span>
              </div>
              <div className="flex gap-2">
                {m.status === 'draft' && (
                  <Button variant="secondary" onClick={() => approveAll(m.id)}>Approve All</Button>
                )}
                {m.status === 'approved' && expandedMapId === m.id && (
                  <Button onClick={() => generateAllContent(m.id)}>Generate All Content</Button>
                )}
                <Button variant="danger" onClick={() => deleteMap(m.id)}>Delete</Button>
              </div>
            </div>

            {expandedMapId === m.id && mapDetail && (
              <div className="mt-4 space-y-3">
                {mapDetail.pillar && (
                  <div className="pl-2 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-blue-600 uppercase">Pillar</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[mapDetail.pillar.status] || ''}`}>
                        {mapDetail.pillar.status}
                      </span>
                    </div>
                    {editingTopicId === mapDetail.pillar.id ? (
                      <TopicEditor
                        topic={mapDetail.pillar}
                        onSave={handleTopicSave}
                        onCancel={() => setEditingTopicId(null)}
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingTopicId(mapDetail.pillar!.id)}
                      >
                        <p className="font-medium">{mapDetail.pillar.title}</p>
                        <p className="text-xs text-zinc-500">
                          {mapDetail.pillar.outline.length} sections &middot; Click to edit
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {mapDetail.clusters.map((cluster) => (
                  <div key={cluster.id} className="pl-6 border-l-2 border-zinc-300 dark:border-zinc-600">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-zinc-500 uppercase">Cluster</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColors[cluster.status] || ''}`}>
                        {cluster.status}
                      </span>
                    </div>
                    {editingTopicId === cluster.id ? (
                      <TopicEditor
                        topic={cluster}
                        onSave={handleTopicSave}
                        onCancel={() => setEditingTopicId(null)}
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingTopicId(cluster.id)}
                      >
                        <p className="font-medium">{cluster.title}</p>
                        <p className="text-xs text-zinc-500">
                          {cluster.outline.length} sections &middot; Click to edit
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
