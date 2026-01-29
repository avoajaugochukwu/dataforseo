# Help Page Maintenance Agent

## Purpose

Keep `/app/help/page.tsx` in sync with the actual application. The help page is a hardcoded `sections` array — any app change that affects user-facing behavior must be reflected there.

## When to Update the Help Page

After **any** change to the following, update the corresponding section in `app/help/page.tsx`:

### 1. Routes & Navigation (`components/sidebar.tsx`)
- New page added → add a new section to `sections[]`
- Page removed → remove its section
- Page renamed → update section title and references

### 2. Settings Page (`app/settings/page.tsx`, `app/api/blog-configs/`)
- New credential field → document in "Settings" section
- New blog config field → document in "Settings" section
- Removed field → remove from "Settings" section

### 3. Keywords Page (`app/keywords/page.tsx`, `app/api/keywords/`)
- New filter/sort option → document in "Keywords" section
- Changed research parameters (location, language defaults) → update description
- New bulk actions → document

### 4. Topics Page (`app/topics/page.tsx`, `app/api/topics/`)
- New topic statuses beyond `draft | approved | generated` → document
- Changed generation flow → update "Topics" section steps
- New topic fields (beyond title, slug, outline, contentPrompt) → document

### 5. Content Page (`app/content/page.tsx`, `app/api/content/`)
- Editor changes → update "Content" section
- New draft fields or statuses → document
- Changed generation behavior → update steps

### 6. Publish Page (`app/publish/page.tsx`, `app/api/publish/`)
- New publish targets beyond Payload CMS → add to "Publishing" section
- Changed field mapping or default values behavior → update
- New post-publish actions → document

### 7. New Features
- Any entirely new page → add sidebar link check + new help section
- New UI components that change user workflow → update relevant section
- New API integrations → document in relevant section or "Getting Started"

## How to Update

The help page is at `app/help/page.tsx`. Content lives in the `sections` array:

```typescript
const sections = [
  { title: 'Section Name', content: `Markdown-like text here...` },
  // ...
];
```

Rules:
- Keep each section's `content` as plain text with `•` bullets and `**bold**` for emphasis
- Use numbered lists for sequential steps
- Match the existing tone: concise, instructional, no jargon
- Section order should follow the workflow: Getting Started → Settings → Keywords → Topics → Content → Publishing

## Current App Architecture Reference

```
Workflow: Settings → Keywords → Topics → Content → Publish
Database: LowDB (data/db.json)
AI: Anthropic Claude (claude-sonnet-4-20250514)
Keyword API: DataForSEO
CMS: Payload CMS (REST API)
Types: lib/types.ts (BlogConfig, Keyword, Topic, DraftPost, DbSchema)
```

## Checklist Before Completing Any PR

- [ ] Did you add/remove/rename a page? → Update sidebar references in help
- [ ] Did you change a user-facing form or action? → Update the relevant help section
- [ ] Did you add a new integration or credential? → Document in Settings section
- [ ] Did you change the workflow order? → Update "Getting Started" section
- [ ] Does the help page still compile? → `npm run build` passes
