import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/iptv/channels?category=movies&limit=60
 *
 * Fetches and parses the iptv-org category M3U playlists.
 * Returns a clean JSON array of channels with name, logo, streamUrl.
 *
 * Sources:
 *   https://iptv-org.github.io/iptv/categories/{category}.m3u
 *   https://iptv-org.github.io/iptv/countries/us.m3u
 */

export const revalidate = 3600; // cache 1 hour

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

interface ParsedChannel {
  id: string;
  name: string;
  logo: string;
  group: string;
  streamUrl: string;
  country: string;
  language: string;
}

function parseM3U(text: string): ParsedChannel[] {
  const lines = text.split('\n').map((l) => l.trim());
  const channels: ParsedChannel[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('#EXTINF')) continue;

    // Parse attributes from EXTINF line
    const name        = line.match(/,(.+)$/)?.[1]?.trim() ?? 'Unknown';
    const logo        = line.match(/tvg-logo="([^"]*)"/)?.[1] ?? '';
    const group       = line.match(/group-title="([^"]*)"/)?.[1] ?? '';
    const country     = line.match(/tvg-country="([^"]*)"/)?.[1] ?? '';
    const language    = line.match(/tvg-language="([^"]*)"/)?.[1] ?? 'EN';
    const tvgId       = line.match(/tvg-id="([^"]*)"/)?.[1] ?? '';

    // Next non-comment line is the stream URL
    let streamUrl = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith('#') && lines[j].length > 0) {
        streamUrl = lines[j];
        i = j;
        break;
      }
    }

    if (!streamUrl || !streamUrl.startsWith('http')) continue;

    channels.push({
      id: tvgId || `ch-${channels.length}`,
      name,
      logo,
      group,
      streamUrl,
      country,
      language: language.split(';')[0] ?? 'EN',
    });
  }

  return channels;
}

const CATEGORY_URLS: Record<string, string> = {
  movies:        'https://iptv-org.github.io/iptv/categories/movies.m3u',
  sports:        'https://iptv-org.github.io/iptv/categories/sports.m3u',
  entertainment: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
  news:          'https://iptv-org.github.io/iptv/categories/news.m3u',
  music:         'https://iptv-org.github.io/iptv/categories/music.m3u',
  kids:          'https://iptv-org.github.io/iptv/categories/kids.m3u',
  documentary:   'https://iptv-org.github.io/iptv/categories/documentary.m3u',
  cooking:       'https://iptv-org.github.io/iptv/categories/cooking.m3u',
  travel:        'https://iptv-org.github.io/iptv/categories/travel.m3u',
  us:            'https://iptv-org.github.io/iptv/countries/us.m3u',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? 'news';
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '80'), 200);
  const offset   = parseInt(searchParams.get('offset') ?? '0');

  const url = CATEGORY_URLS[category];
  if (!url) {
    return NextResponse.json({ error: 'Unknown category', categories: Object.keys(CATEGORY_URLS) }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MemelliOS/1.0)' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream fetch failed: ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    const all = parseM3U(text);
    const page = all.slice(offset, offset + limit);

    return NextResponse.json({
      category,
      total: all.length,
      offset,
      limit,
      channels: page,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch channels', detail: String(err) }, { status: 500 });
  }
}
