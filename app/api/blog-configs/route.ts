import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import type { BlogConfig } from '@/lib/types';

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.data.blogConfigs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = await getDb();

  const config: BlogConfig = {
    id: uuid(),
    name: body.name || '',
    payloadUrl: body.payloadUrl || '',
    apiKey: body.apiKey || '',
    collectionSlug: body.collectionSlug || '',
    fieldMapping: body.fieldMapping || { title: 'title', slug: 'slug', content: 'content', metaTitle: 'meta_title', metaDescription: 'meta_description', excerpt: 'excerpt' },
    defaultValues: body.defaultValues || {},
  };

  db.data.blogConfigs.push(config);
  await db.write();
  return NextResponse.json(config, { status: 201 });
}
