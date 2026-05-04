import type { MetadataRoute } from 'next';
import { API_URL } from '@/lib/config';

const BASE_URL = 'https://memelli.com';

interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
  type?: string;
}

interface SitemapIndexResponse {
  entries?: SitemapIndexEntry[];
  categories?: SitemapIndexEntry[];
  threads?: SitemapIndexEntry[];
  clusters?: SitemapIndexEntry[];
  blog?: SitemapIndexEntry[];
}

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/credit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/coaching`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/commerce`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/communications`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/crm`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/leads`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/store`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/programs`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/affiliate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/approval`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/forum`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  { url: `${BASE_URL}/website-builder`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
];

function mapEntry(
  entry: SitemapIndexEntry,
  defaults: { changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number },
): MetadataRoute.Sitemap[number] {
  return {
    url: entry.loc.startsWith('http') ? entry.loc : `${BASE_URL}${entry.loc}`,
    lastModified: entry.lastmod ? new Date(entry.lastmod) : new Date(),
    changeFrequency: (entry.changefreq as MetadataRoute.Sitemap[number]['changeFrequency']) || defaults.changeFrequency,
    priority: entry.priority ?? defaults.priority,
  };
}

async function fetchDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/api/seo/sitemap/sitemap-index`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data: SitemapIndexResponse = await res.json();
    const dynamic: MetadataRoute.Sitemap = [];

    // If the API returns a flat entries array, map by type
    if (data.entries) {
      for (const entry of data.entries) {
        switch (entry.type) {
          case 'category':
            dynamic.push(mapEntry(entry, { changeFrequency: 'daily', priority: 0.6 }));
            break;
          case 'thread':
            dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.5 }));
            break;
          case 'cluster':
            dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.6 }));
            break;
          case 'blog':
            dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.6 }));
            break;
          default:
            dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.5 }));
        }
      }
    }

    // If the API returns grouped arrays
    if (data.categories) {
      for (const entry of data.categories) {
        dynamic.push(mapEntry(entry, { changeFrequency: 'daily', priority: 0.6 }));
      }
    }
    if (data.threads) {
      for (const entry of data.threads) {
        dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.5 }));
      }
    }
    if (data.clusters) {
      for (const entry of data.clusters) {
        dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.6 }));
      }
    }
    if (data.blog) {
      for (const entry of data.blog) {
        dynamic.push(mapEntry(entry, { changeFrequency: 'weekly', priority: 0.6 }));
      }
    }

    return dynamic;
  } catch {
    // Gracefully fall back to static-only
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicEntries = await fetchDynamicEntries();
  return [...STATIC_PAGES, ...dynamicEntries];
}
