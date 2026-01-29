export interface BlogConfig {
  id: string;
  name: string;
  payloadUrl: string;
  apiKey: string;
  collectionSlug: string;
  fieldMapping: Record<string, string>; // local field -> payload field
  defaultValues: Record<string, unknown>;
}

export interface Keyword {
  id: string;
  keyword: string;
  searchVolume: number;
  competition: number;
  cpc: number;
  savedAt: string;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  outline: string[];
  contentPrompt: string;
  keywordIds: string[];
  status: 'draft' | 'approved' | 'generated';
  createdAt: string;
}

export interface DraftPost {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  excerpt?: string;
  status: 'draft' | 'reviewing' | 'published';
  publishedTo?: string; // blog config id
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSchema {
  blogConfigs: BlogConfig[];
  keywords: Keyword[];
  topics: Topic[];
  drafts: DraftPost[];
}
