export interface BlogConfig {
  id: string;
  name: string;
  payloadUrl: string;
  apiKey: string;
  collectionSlug: string;
  blogUrl?: string;
  fieldMapping: Record<string, string>; // local field -> payload field
  defaultValues: Record<string, unknown>;
  websiteContext?: WebsiteContext;
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
  topicalMapId?: string;
  role?: 'pillar' | 'cluster';
  pillarTopicId?: string;
  relatedTopicIds?: string[];
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

export interface WebsiteContext {
  description: string;
  targetAudience: string;
  tone: string;
  additionalInstructions: string;
}

export interface TopicalMap {
  id: string;
  pillarTitle: string;
  pillarKeyword: string;
  description: string;
  clusterCount: number;
  status: 'draft' | 'approved' | 'generating' | 'completed';
  createdAt: string;
}

export interface TopicalMapContext {
  pillar: { id: string; title: string; slug: string };
  clusters: { id: string; title: string; slug: string }[];
  baseUrl: string;
}

export interface BatchJob {
  id: string;
  topicIds: string[];
  completed: number;
  failed: number;
  total: number;
  status: 'running' | 'completed' | 'cancelled';
  errors: { topicId: string; error: string }[];
  blogConfigId?: string;
  autoPublish?: boolean;
  publishedCount?: number;
  publishErrors?: { topicId: string; error: string }[];
}

export interface DbSchema {
  blogConfigs: BlogConfig[];
  keywords: Keyword[];
  topics: Topic[];
  drafts: DraftPost[];
  topicalMaps: TopicalMap[];
}
