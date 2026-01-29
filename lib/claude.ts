import Anthropic from '@anthropic-ai/sdk';
import type { WebsiteContext } from './types';

function buildContextBlock(ctx?: WebsiteContext): string {
  if (!ctx) return '';
  const parts: string[] = [];
  if (ctx.description) parts.push(`Website description: ${ctx.description}`);
  if (ctx.targetAudience) parts.push(`Target audience: ${ctx.targetAudience}`);
  if (ctx.tone) parts.push(`Tone/voice: ${ctx.tone}`);
  if (ctx.additionalInstructions) parts.push(`Additional instructions: ${ctx.additionalInstructions}`);
  if (parts.length === 0) return '';
  return `\n\nWebsite context (use this to guide your output):\n${parts.join('\n')}\n`;
}

function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key not configured');
  return new Anthropic({ apiKey });
}

export async function generateTopics(keywords: string[], websiteContext?: WebsiteContext): Promise<{
  title: string;
  slug: string;
  outline: string[];
  contentPrompt: string;
  keywordGroup: string[];
}[]> {
  const client = getClient();
  const contextBlock = buildContextBlock(websiteContext);

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Today's date is ${getCurrentDate()}.${contextBlock}

You are an SEO content strategist. Given these keywords, group them into blog post topics. For each topic provide:
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

export async function generateContent(title: string, outline: string[], contentPrompt: string, websiteContext?: WebsiteContext): Promise<{
  content: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
}> {
  const client = getClient();
  const contextBlock = buildContextBlock(websiteContext);

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Today's date is ${getCurrentDate()}. All references to dates, years, and timeframes must reflect this.${contextBlock}

Write a comprehensive, SEO-optimized blog post in Markdown.

Title: ${title}
Outline sections: ${outline.join(', ')}

Additional instructions: ${contentPrompt}

Write the full blog post in Markdown format. Start with the title as an H1, then follow the outline. Make it informative, well-structured, and engaging.

Writing style guidelines:
- Write like a knowledgeable person explaining things to a friend — conversational, clear, and direct.
- Avoid flowery, corporate, or overly formal language. No words like "revolutionize", "game-changer", "delve", "landscape", "cutting-edge", "unleash", "seamlessly", "robust", or "leverage".
- Use short sentences. Vary sentence length naturally.
- Be specific and concrete rather than vague and abstract.
- Skip filler intros like "In today's fast-paced world..." — get to the point.
- Use contractions (it's, you'll, don't) where natural.
- Prefer active voice over passive voice.

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
