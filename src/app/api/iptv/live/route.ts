import { NextResponse } from 'next/server';

/**
 * GET /api/iptv/live
 *
 * Returns a curated list of live channels with stream URLs already routed
 * through the /api/iptv/proxy endpoint.  Designed for the FireStick TV APK
 * to fetch on startup — no CORS issues, no direct cross-origin HLS requests.
 *
 * Response shape:
 *   { channels: Channel[], categories: string[] }
 */

interface Channel {
  id: string;
  name: string;
  category: string;
  streamUrl: string;
  logo: string;
  color: string;
  description: string;
}

/** Public HLS streams — same sources used by the dashboard IPTV page. */
const RAW_CHANNELS: (Omit<Channel, 'streamUrl'> & { rawUrl: string })[] = [
  {
    id: 'nasa-tv',
    name: 'NASA TV',
    category: 'Science',
    rawUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    logo: '🚀',
    color: '#60a5fa',
    description: 'Official NASA Television — live launches, ISS coverage, and space exploration.',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    category: 'News',
    rawUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    logo: '🌍',
    color: '#4ade80',
    description: 'Independent international news from Al Jazeera English.',
  },
  {
    id: 'france24',
    name: 'France 24',
    category: 'News',
    rawUrl: 'https://stream.france24.com/hls/live/2037199/F24_EN_HI_HLS/master.m3u8',
    logo: 'F24',
    color: '#818cf8',
    description: 'French international 24-hour news channel in English.',
  },
  {
    id: 'dw-news',
    name: 'DW News',
    category: 'News',
    rawUrl: 'https://dwstream4-lh.akamaihd.net/i/dwstream4_live@124411/master.m3u8',
    logo: 'DW',
    color: '#38bdf8',
    description: 'Deutsche Welle — German international broadcaster covering world events.',
  },
  {
    id: 'cgtn',
    name: 'CGTN',
    category: 'News',
    rawUrl: 'https://news.cgtn.com/resource/live/english/cgtn-news.m3u8',
    logo: 'CG',
    color: '#f87171',
    description: 'China Global Television Network — international news from China.',
  },
  {
    id: 'euronews',
    name: 'Euronews',
    category: 'News',
    rawUrl: 'https://rakuten-euronews-1-gb.samsung.wurl.tv/playlist.m3u8',
    logo: 'EN',
    color: '#fbbf24',
    description: 'European news channel covering international affairs in multiple languages.',
  },
  {
    id: 'pbs-news',
    name: 'PBS NewsHour',
    category: 'News',
    rawUrl: 'https://bcoveliveios-i.akamaihd.net/hls/live/215452/National/master.m3u8',
    logo: 'PBS',
    color: '#c084fc',
    description: 'Trusted public broadcasting news from the United States.',
  },
  {
    id: 'sky-news',
    name: 'Sky News',
    category: 'News',
    rawUrl: 'https://skynews-i.akamaihd.net/hls/live/221427/SKYNEWS/master.m3u8',
    logo: '🌐',
    color: '#0ea5e9',
    description: 'Breaking news, exclusives and analysis from Sky News.',
  },
  // ── Additional free/public channels ─────────────────────────────────────
  {
    id: 'rt-news',
    name: 'RT News',
    category: 'News',
    rawUrl: 'https://rt-news.secure.footprint.net/1105.m3u8',
    logo: 'RT',
    color: '#f97316',
    description: 'RT international news — global affairs from an alternative perspective.',
  },
  {
    id: 'bloomberg-tv',
    name: 'Bloomberg TV',
    category: 'News',
    rawUrl: 'https://www.bloomberg.com/media-manifest/streams/us.m3u8',
    logo: 'BB',
    color: '#f59e0b',
    description: 'Bloomberg Television — financial markets, business news, and analysis.',
  },
  {
    id: 'abc-news',
    name: 'ABC News Live',
    category: 'News',
    rawUrl: 'https://abclive2-lh.akamaihd.net/i/abc_live02@423398/master.m3u8',
    logo: 'ABC',
    color: '#facc15',
    description: 'ABC News Live — breaking news and live events from the United States.',
  },
  {
    id: 'nasa-tv-media',
    name: 'NASA TV Media',
    category: 'Science',
    rawUrl: 'https://ntv2.akamaized.net/hls/live/2014076/NASA-NTV2-HLS/master.m3u8',
    logo: '🛸',
    color: '#34d399',
    description: 'NASA Television Media Channel — B-roll footage and press conferences.',
  },
  {
    id: 'cbsn',
    name: 'CBSN',
    category: 'News',
    rawUrl: 'https://cbsn-us.cbsnews.com/0d2bc7bc9aa5f03c7ed84fbf44c85636/master.m3u8',
    logo: 'CBS',
    color: '#a78bfa',
    description: 'CBS News Network — always-on 24/7 digital streaming news channel.',
  },
  {
    id: 'ion-television',
    name: 'ION Television',
    category: 'Entertainment',
    rawUrl: 'https://ion-primary-samsungus.amagi.tv/playlist.m3u8',
    logo: 'ION',
    color: '#2dd4bf',
    description: 'ION Television — family-friendly entertainment and drama series.',
  },
  {
    id: 'pluto-tv-news',
    name: 'Pluto TV News',
    category: 'News',
    rawUrl: 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/62df76d3cc5e230007f22e0b/master.m3u8',
    logo: '📡',
    color: '#fb7185',
    description: 'Pluto TV curated news stream — top stories from around the world.',
  },
  {
    id: 'trt-world',
    name: 'TRT World',
    category: 'News',
    rawUrl: 'https://trtworld.live.trt.com.tr/master.m3u8',
    logo: 'TRT',
    color: '#f43f5e',
    description: 'TRT World — Turkish public broadcaster covering international news.',
  },
  {
    id: 'arirang-tv',
    name: 'Arirang TV',
    category: 'Entertainment',
    rawUrl: 'https://amdlive-ch01.akamaized.net/cmaf/live/2001020/ch01/index.m3u8',
    logo: '🇰🇷',
    color: '#06b6d4',
    description: 'South Korea\'s international English-language public broadcaster.',
  },
];

function buildProxyUrl(rawUrl: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}/api/iptv/proxy?url=${encodeURIComponent(rawUrl)}`;
}

const CATEGORIES = [...new Set(RAW_CHANNELS.map((c) => c.category))].sort();

export async function GET() {
  const channels: Channel[] = RAW_CHANNELS.map(({ rawUrl, ...rest }) => ({
    ...rest,
    streamUrl: buildProxyUrl(rawUrl),
  }));

  return NextResponse.json(
    { channels, categories: CATEGORIES },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
