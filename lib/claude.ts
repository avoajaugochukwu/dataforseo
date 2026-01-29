import Anthropic from '@anthropic-ai/sdk';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key not configured');
  return new Anthropic({ apiKey });
}

export async function generateTopics(keywords: string[]): Promise<{
  title: string;
  slug: string;
  outline: string[];
  contentPrompt: string;
  keywordGroup: string[];
}[]> {
  const client = getClient();

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an SEO content strategist. Given these keywords, group them into blog post topics. For each topic provide:
- title: compelling blog post title
- slug: URL-friendly slug
- outline: array of H2 section headings
- contentPrompt: a detailed prompt to generate the full blog post
- keywordGroup: which keywords from the list this topic covers

Keywords: ${keywords.join(', ')}

Respond with a JSON array only, no other text. Example:
[{"title":"...","slug":"...","outline":["..."],"contentPrompt":"...","keywordGroup":["..."]}]`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse topics from Claude response');
  return JSON.parse(jsonMatch[0]);
}

export async function generateContent(title: string, outline: string[], contentPrompt: string): Promise<{
  content: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
}> {
  const client = getClient();

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Write a comprehensive, SEO-optimized blog post in Markdown.

Title: ${title}
Outline sections: ${outline.join(', ')}

Additional instructions: ${contentPrompt}

Write the full blog post in Markdown format. Start with the title as an H1, then follow the outline. Make it informative, well-structured, and engaging.

In addition to the blog post content, also generate:
- metaTitle: an SEO-optimized title (~60 characters, may differ from the blog post H1)
- metaDescription: an SEO meta description (~155 characters)
- excerpt: a 2-sentence summary/teaser of the post

Respond with a JSON object containing these keys: "content", "metaTitle", "metaDescription", "excerpt". The "content" value should be the full Markdown blog post. Respond with JSON only, no other text.`,
      },
    ],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: treat entire response as content
    return { content: text, metaTitle: title, metaDescription: '', excerpt: '' };
  }
  return JSON.parse(jsonMatch[0]);
}
