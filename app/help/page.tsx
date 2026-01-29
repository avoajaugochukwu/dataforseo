'use client';

import { Card } from '@/components/ui/card';

const sections = [
  {
    title: 'Getting Started',
    content: `PCE (Programmatic Content Engine) helps you research keywords, generate topic ideas, create blog content, and publish articles to your Payload CMS blog — all from one interface.

The typical workflow is: Settings → Keywords → Topics → Content → Publish. Start by configuring your API keys in Settings, then work through each step in order.`,
  },
{
    title: 'Keywords',
    content: `Use the Keywords page to research and discover keyword opportunities.

1. Enter a seed keyword or phrase and select your target location/language.
2. Click **Research** to fetch keyword data from DataForSEO, including search volume, competition, CPC, and related keywords.
3. Browse the results table — sort and filter by any column to find promising keywords.
4. Select keywords you want to target and click **Save** to add them to your saved list.

Saved keywords carry over to the Topics step where they are used to generate content ideas.`,
  },
  {
    title: 'Topics',
    content: `The Topics page generates blog topic ideas from your saved keywords using AI.

1. Select one or more saved keywords to generate topics for.
2. Click **Generate Topics** — Claude will suggest relevant blog post titles and angles for each keyword.
3. Review the generated topics. You can regenerate if needed.
4. **Approve** the topics you want to write about. Approved topics move to the Content step.

Each topic includes a suggested title and brief outline that guides content generation.`,
  },
  {
    title: 'Content',
    content: `The Content page is where blog posts are generated and refined.

1. Select an approved topic to generate content for.
2. Click **Generate** to create a full blog post draft using Claude. The AI uses the topic title, outline, and target keyword to produce a complete article.
3. Review the generated draft in the editor. You can manually edit the title, body, and meta description.
4. When satisfied, the draft is ready for publishing.

Drafts are saved automatically and persist between sessions.`,
  },
  {
    title: 'Publishing',
    content: `The Publish page lets you push finished drafts to your Payload CMS blog.

1. Select a completed draft from the list.
2. Choose which blog configuration to publish to (configured in Settings).
3. Review the final content preview.
4. Click **Publish** to send the article to your Payload CMS instance via its API.

After publishing, the draft is marked as published so you can track what has been sent.`,
  },
  {
    title: 'Field Mapping',
    content: `Each blog configuration has a fieldMapping that translates internal field names to whatever field names your Payload CMS collection uses.

The internal fields are: title, slug, content, metaTitle, metaDescription, and excerpt. The default mapping is:
• title → title
• slug → slug
• content → content
• metaTitle → meta_title
• metaDescription → meta_description
• excerpt → excerpt

You can customise the mapping JSON in Settings if your Payload CMS collection uses different field names. For example, if your collection stores the title in a field called "heading", set the title mapping to "heading".

If a mapping key is missing, that field is simply skipped during publish — no error is thrown.`,
  },
  {
    title: 'Author & Publishing Requirements',
    content: `Publishing requires a valid author value. This is configured via defaultValues in your blog config on the Settings page.

The author field must reference an existing Author record in Payload CMS (not a User). Make sure an Author entry exists in your Payload CMS database, then use its numeric ID as the author default value.

Example defaultValues: { "author": "1" }

The app automatically converts the author value to a number before sending it to the Payload CMS API. If no valid author is set, publishing will fail.`,
  },
  {
    title: 'Ideal Blog Collection Schema',
    content: `Below is the recommended schema for your Payload CMS blog collection. Setting up your collection with these fields ensures it aligns with what the app expects when publishing content.

• title (text, required) — the blog post title
• slug (text, auto-generated from title)
• featuredImage (upload → media collection)
• excerpt (textarea, required) — short summary for listings and SEO
• content (richText, required) — the main body of the post
• author (relationship → authors collection, required)
• publishDate (date, required)
• status (select: draft | published, default: draft)

• relatedContent (group):
  – games (relationship → games collection, multi-select)
  – posts (relationship → blog-posts collection, multi-select)

• SEO tab:
  – metaTitle (text)
  – metaDescription (textarea)
  – metaImage (upload → media collection)`,
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">User Manual</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        A step-by-step guide to using the Programmatic Content Engine.
      </p>
      {sections.map((s) => (
        <Card key={s.title}>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {s.title}
          </h2>
          <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
            {s.content}
          </div>
        </Card>
      ))}
    </div>
  );
}
