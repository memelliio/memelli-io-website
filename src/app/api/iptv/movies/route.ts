import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/iptv/movies?page=1&genre=comedy
 *
 * Fetches public-domain movies from the Internet Archive.
 * These are 100% free, legal, and streamable via MP4 or OGG.
 * Includes classic Hollywood films, documentaries, indie films.
 */

export const revalidate = 3600;

interface ArchiveDoc {
  identifier: string;
  title?: string;
  description?: string | string[];
  year?: string | number;
  creator?: string | string[];
  subject?: string | string[];
  downloads?: number;
  avg_rating?: number;
}

interface Movie {
  id: string;
  title: string;
  description: string;
  year: string;
  director: string;
  genres: string[];
  streamUrl: string;
  thumbUrl: string;
  rating: number;
  downloads: number;
  free: true;
}

const GENRE_QUERIES: Record<string, string> = {
  classic:     'subject:(classic OR "golden age" OR hollywood) mediatype:movies',
  comedy:      'subject:comedy mediatype:movies',
  noir:        'subject:(noir OR crime OR mystery) mediatype:movies',
  documentary: 'mediatype:movies subject:documentary',
  scifi:       'subject:("science fiction" OR scifi OR "sci-fi") mediatype:movies',
  western:     'subject:western mediatype:movies',
  horror:      'subject:horror mediatype:movies',
  action:      'subject:(action OR adventure) mediatype:movies',
  all:         'mediatype:movies avg_rating:[3 TO 5]',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const genre  = searchParams.get('genre') ?? 'classic';
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const rows   = Math.min(parseInt(searchParams.get('rows') ?? '40'), 100);
  const start  = (page - 1) * rows;

  const q = GENRE_QUERIES[genre] ?? GENRE_QUERIES.classic;

  const apiUrl = new URL('https://archive.org/advancedsearch.php');
  apiUrl.searchParams.set('q', q);
  apiUrl.searchParams.set('fl[]', 'identifier,title,description,year,creator,subject,downloads,avg_rating');
  apiUrl.searchParams.set('sort[]', 'downloads desc');
  apiUrl.searchParams.set('rows', String(rows));
  apiUrl.searchParams.set('start', String(start));
  apiUrl.searchParams.set('output', 'json');
  apiUrl.searchParams.set('callback', '');

  try {
    const res = await fetch(apiUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MemelliOS/1.0)' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Archive.org fetch failed: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const docs: ArchiveDoc[] = data?.response?.docs ?? [];
    const numFound: number = data?.response?.numFound ?? 0;

    const movies: Movie[] = docs
      .filter((d) => d.identifier && d.title)
      .map((d): Movie => {
        const id = d.identifier;
        const desc = Array.isArray(d.description) ? d.description[0] : d.description ?? '';
        const creator = Array.isArray(d.creator) ? d.creator.join(', ') : d.creator ?? 'Unknown';
        const subjects: string[] = Array.isArray(d.subject)
          ? d.subject
          : typeof d.subject === 'string'
            ? d.subject.split(';').map((s: string) => s.trim())
            : [];
        return {
          id,
          title: d.title ?? 'Untitled',
          description: desc.slice(0, 300),
          year: String(d.year ?? ''),
          director: creator,
          genres: subjects.slice(0, 3),
          // Archive.org serves MP4 files at a standard path
          streamUrl: `https://archive.org/download/${id}/${id}.mp4`,
          // Thumbnail from archive.org
          thumbUrl: `https://archive.org/services/img/${id}`,
          rating: Math.round((d.avg_rating ?? 3) * 10) / 10,
          downloads: d.downloads ?? 0,
          free: true,
        };
      });

    return NextResponse.json({
      genre,
      page,
      rows,
      total: numFound,
      movies,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch movies', detail: String(err) }, { status: 500 });
  }
}
