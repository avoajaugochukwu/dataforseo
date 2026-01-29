import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { publishToPayload } from '@/lib/payload';

export async function POST(req: Request) {
  const { draftId, blogConfigId } = await req.json();
  if (!draftId || !blogConfigId) {
    return NextResponse.json({ error: 'draftId and blogConfigId required' }, { status: 400 });
  }

  const db = await getDb();
  const draft = db.data.drafts.find((d) => d.id === draftId);
  if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });

  const config = db.data.blogConfigs.find((c) => c.id === blogConfigId);
  if (!config) return NextResponse.json({ error: 'Blog config not found' }, { status: 404 });

  const debug: string[] = [];
  try {
    const { content: _, ...draftSummary } = draft;
    debug.push(`[publish] Draft: ${JSON.stringify(draftSummary, null, 2)}`);
    debug.push(`[publish] Config: ${JSON.stringify(config, null, 2)}`);
    const result = await publishToPayload(draft, config);
    draft.status = 'published';
    draft.publishedTo = blogConfigId;
    draft.publishedAt = new Date().toISOString();
    await db.write();

    return NextResponse.json({ success: true, payloadId: result.id, debug: [...debug, ...result.debug] });
  } catch (e) {
    const errDebug = (e as Error & { debug?: string[] }).debug ?? [];
    return NextResponse.json({ error: (e as Error).message, debug: [...(debug ?? []), ...errDebug] }, { status: 500 });
  }
}
