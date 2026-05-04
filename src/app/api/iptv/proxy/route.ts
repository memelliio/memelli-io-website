import { NextRequest, NextResponse } from 'next/server';

/**
 * IPTV universal proxy — handles M3U8 playlists AND HLS TS segments.
 *
 * GET /api/iptv/proxy?url=<encoded-url>
 *
 * - Playlists (.m3u8/.m3u or text content-type): rewrite all segment/sub-playlist
 *   URLs to point back through this proxy so FireStick WebView never makes
 *   cross-origin requests directly.
 * - Binary segments (.ts or non-text content-type): stream through without
 *   buffering, passing original Content-Type.
 * - All responses carry Access-Control-Allow-Origin: * to satisfy CORS.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
} as const;

/**
 * Resolve a URL that may be relative against the base playlist URL.
 */
function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/**
 * Rewrite every segment/sub-playlist URL inside an M3U8 document so it routes
 * through /api/iptv/proxy?url=<encoded>.  Only non-comment, non-empty lines
 * that look like URLs (or relative paths) are rewritten; #EXT tags are left
 * verbatim.
 */
function rewriteM3U8Urls(text: string, playlistUrl: string): string {
  const proxyBase = '/api/iptv/proxy?url=';
  const lines = text.split('\n');

  return lines
    .map((line) => {
      const trimmed = line.trim();
      // Keep comments and empty lines as-is
      if (trimmed === '' || trimmed.startsWith('#')) return line;

      // Resolve relative → absolute, then proxy
      const absolute = resolveUrl(trimmed, playlistUrl);
      return `${proxyBase}${encodeURIComponent(absolute)}`;
    })
    .join('\n');
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Validate — must be http/https
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Bad protocol');
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MemelliTV/1.0)',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const lowerUrl = parsed.pathname.toLowerCase();
    const isPlaylist =
      contentType.includes('text') ||
      contentType.includes('mpegurl') ||
      lowerUrl.endsWith('.m3u8') ||
      lowerUrl.endsWith('.m3u');

    if (isPlaylist) {
      const text = await res.text();
      const rewritten = rewriteM3U8Urls(text, parsed.toString());

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          // Short TTL — live playlists refresh every ~2 s
          'Cache-Control': 'public, max-age=2',
        },
      });
    }

    // Binary TS segments (or any other non-text resource) — stream through
    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        // Never cache segments — each one is unique
        'Cache-Control': 'no-store',
        // Pass through Content-Length when present so the player can track progress
        ...(res.headers.get('content-length')
          ? { 'Content-Length': res.headers.get('content-length') as string }
          : {}),
        ...(res.headers.get('content-range')
          ? { 'Content-Range': res.headers.get('content-range') as string }
          : {}),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
