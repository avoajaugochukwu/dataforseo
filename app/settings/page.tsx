'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { BlogConfig } from '@/lib/types';

export default function SettingsPage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<BlogConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<BlogConfig>>({});

  useEffect(() => {
    fetch('/api/blog-configs').then((r) => r.json()).then(setConfigs);
  }, []);

  async function saveConfig() {
    const method = editConfig.id ? 'PUT' : 'POST';
    const url = editConfig.id ? `/api/blog-configs/${editConfig.id}` : '/api/blog-configs';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editConfig) });
    const saved = await res.json();
    if (editConfig.id) {
      setConfigs((c) => c.map((x) => (x.id === saved.id ? saved : x)));
    } else {
      setConfigs((c) => [...c, saved]);
    }
    setShowForm(false);
    setEditConfig({});
    toast('Blog config saved', 'success');
  }

  async function deleteConfig(id: string) {
    if (!confirm('Delete this blog config?')) return;
    await fetch(`/api/blog-configs/${id}`, { method: 'DELETE' });
    setConfigs((c) => c.filter((x) => x.id !== id));
    toast('Deleted', 'info');
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Blog Configs</h3>
          <Button variant="secondary" onClick={() => { setEditConfig({ fieldMapping: {}, defaultValues: { status: 'published' } }); setShowForm(true); }}>Add</Button>
        </div>

        {configs.length === 0 && <p className="text-sm text-zinc-500">No blog configs yet.</p>}

        {configs.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 py-2">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.payloadUrl} / {c.collectionSlug}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setEditConfig(c); setShowForm(true); }}>Edit</Button>
              <Button variant="danger" onClick={() => deleteConfig(c.id)}>Delete</Button>
            </div>
          </div>
        ))}

        {showForm && (
          <div className="mt-4 space-y-3 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <Input label="Name" value={editConfig.name || ''} onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })} />
            <Input label="Payload URL" value={editConfig.payloadUrl || ''} onChange={(e) => setEditConfig({ ...editConfig, payloadUrl: e.target.value })} />
            <Input label="API Key" type="password" value={editConfig.apiKey || ''} onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })} />
            <Input label="Collection Slug" value={editConfig.collectionSlug || ''} onChange={(e) => setEditConfig({ ...editConfig, collectionSlug: e.target.value })} />
            <Input label="Extra Field Mapping (JSON) — title, slug, content, excerpt, author, status, publishDate are automatic" value={JSON.stringify(editConfig.fieldMapping || {})} onChange={(e) => { try { setEditConfig({ ...editConfig, fieldMapping: JSON.parse(e.target.value) }); } catch {} }} />
            <Input label="Default Values (JSON) — e.g. {&quot;author&quot;: 1}" value={JSON.stringify(editConfig.defaultValues || {})} onChange={(e) => { try { setEditConfig({ ...editConfig, defaultValues: JSON.parse(e.target.value) }); } catch {} }} />
            <div className="flex gap-2">
              <Button onClick={saveConfig}>Save</Button>
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditConfig({}); }}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-lg font-semibold mb-2">Danger Zone</h3>
        <p className="text-sm text-zinc-500 mb-4">Clear all keywords, topics, and drafts. This cannot be undone.</p>
        <Button variant="danger" onClick={async () => {
          if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return;
          const res = await fetch('/api/reset', { method: 'DELETE' });
          if (res.ok) {
            toast('All data cleared', 'success');
          } else {
            toast('Failed to reset data', 'error');
          }
        }}>Start Over</Button>
      </Card>
    </div>
  );
}
