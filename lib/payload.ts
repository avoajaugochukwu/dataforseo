import type { BlogConfig, DraftPost } from './types';

function textToLexical(text: string) {
  return {
    root: {
      type: 'root',
      children: text.split('\n\n').filter(Boolean).map(paragraph => ({
        type: 'paragraph',
        children: [{
          type: 'text',
          text: paragraph,
          format: 0,
          detail: 0,
          mode: 'normal',
          style: '',
          version: 1,
        }],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  };
}

export async function publishToPayload(draft: DraftPost, config: BlogConfig): Promise<{ id: string; debug: string[] }> {
  const debug: string[] = [];

  // App-managed fields (not configurable)
  const body: Record<string, unknown> = {
    title: draft.title,
    slug: draft.slug,
    content: textToLexical(draft.content),
    excerpt: draft.excerpt,
    author: config.defaultValues.author ? Number(config.defaultValues.author) : undefined,
    publishDate: new Date().toISOString(),
  };

  // Extra mapped fields from config (for fields the app doesn't manage)
  const mapping = config.fieldMapping;
  for (const [localKey, payloadKey] of Object.entries(mapping)) {
    if (localKey === 'metaTitle') body[payloadKey] = draft.metaTitle;
    else if (localKey === 'metaDescription') body[payloadKey] = draft.metaDescription;
    else body[payloadKey] = config.defaultValues[localKey];
  }

  // Merge any remaining default values not already set
  for (const [key, value] of Object.entries(config.defaultValues)) {
    if (key === 'author') continue; // already handled
    if (!(key in body)) body[key] = value;
  }

  const url = `${config.payloadUrl}/api/${config.collectionSlug}`;

  const contentPreview = typeof body.content === 'string'
    ? body.content.slice(0, 20)
    : JSON.stringify(body.content).slice(0, 20);
  console.log(`[payload] POST ${url}`);
  console.log(`[payload] title: ${body.title}, content preview: ${contentPreview}...`);

  const debugBody = { ...body, content: contentPreview + '...' };
  debug.push(`[payload] POST ${url}`);
  debug.push(`[payload] body: ${JSON.stringify(debugBody, null, 2)}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `users API-Key ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    debug.push(`[payload] Error ${res.status}: ${text}`);
    let detail = text;
    try {
      const json = JSON.parse(text);
      const messages: string[] = [];
      if (Array.isArray(json.errors)) {
        for (const err of json.errors) {
          messages.push(err.message ?? JSON.stringify(err));
          if (err.data?.errors) {
            for (const fieldErr of err.data.errors) {
              messages.push(`  ${fieldErr.path ?? 'unknown'}: ${fieldErr.message}`);
            }
          }
        }
      }
      if (messages.length) detail = messages.join('\n');
    } catch {
      // use raw text
    }

    if (!detail || !detail.trim()) {
      const statusMessages: Record<number, string> = {
        400: 'Bad Request - check your payload fields',
        401: 'Unauthorized - check your API key',
        403: 'Forbidden - your API key may lack permissions',
        404: 'Not Found - check collection slug and API URL',
        405: 'Method Not Allowed - check collection slug and API URL',
        500: 'Internal Server Error on the Payload instance',
      };
      detail = statusMessages[res.status] ?? `HTTP ${res.status}`;
    }

    const err = new Error(`Payload CMS error ${res.status}: ${detail}\nURL: POST ${url}`);
    (err as Error & { debug: string[] }).debug = debug;
    throw err;
  }

  const data = await res.json();
  return { id: data.id, debug };
}
