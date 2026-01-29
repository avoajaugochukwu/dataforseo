interface KeywordResult {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
}

export async function researchKeywords(seeds: string[], locationCode = 2840, languageCode = 'en'): Promise<KeywordResult[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }

  const auth = Buffer.from(`${login}:${password}`).toString('base64');

  const res = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{
      keyword: seeds[0],
      location_code: locationCode,
      language_code: languageCode,
      include_seed_keyword: true,
      limit: 100,
    }]),
  });

  if (!res.ok) {
    throw new Error(`DataForSEO API error: ${res.status}`);
  }

  const data = await res.json();
  const task = data?.tasks?.[0];
  if (task?.status_code !== 20000) {
    throw new Error(task?.status_message || 'DataForSEO task failed');
  }
  const items: Record<string, unknown>[] = task.result?.[0]?.items || [];

  return items.map((item: Record<string, unknown>) => ({
    keyword: item.keyword as string,
    search_volume: (item.keyword_info as Record<string, unknown>)?.search_volume as number || 0,
    competition: (item.keyword_info as Record<string, unknown>)?.competition as number || 0,
    cpc: (item.keyword_info as Record<string, unknown>)?.cpc as number || 0,
  }));
}
