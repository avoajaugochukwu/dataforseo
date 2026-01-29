'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Topic } from '@/lib/types';

interface TopicEditorProps {
  topic: Topic;
  onSave: (updated: Topic) => void;
  onCancel: () => void;
}

export function TopicEditor({ topic, onSave, onCancel }: TopicEditorProps) {
  const [title, setTitle] = useState(topic.title);
  const [outline, setOutline] = useState(topic.outline.join('\n'));
  const [contentPrompt, setContentPrompt] = useState(topic.contentPrompt);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          outline: outline.split('\n').filter((l) => l.trim()),
          contentPrompt,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Outline (one H2 per line)</label>
        <textarea
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
          rows={5}
          value={outline}
          onChange={(e) => setOutline(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Content Prompt</label>
        <textarea
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
          rows={4}
          value={contentPrompt}
          onChange={(e) => setContentPrompt(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} loading={saving}>Save</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
