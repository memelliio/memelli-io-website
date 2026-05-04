import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface CategoryData {
  slug: string;
  name: string;
  description: string;
}

interface ThreadItem {
  id: string;
  title: string;
  slug: string;
  answerCount: number;
  views: number;
  createdAt: string;
  author?: string;
}

interface PageProps {
  params: Promise<{ category: string }>;
}

async function getCategoryData(slug: string) {
  try {
    const [catRes, threadsRes] = await Promise.all([
      fetch(`${API_URL}/api/forum/public/categories/${slug}`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/api/forum/public/categories/${slug}/threads`, { next: { revalidate: 60 } }),
    ]);

    if (!catRes.ok) return null;

    const category: CategoryData = (await catRes.json()).data;
    const threads: ThreadItem[] = threadsRes.ok ? (await threadsRes.json()).data ?? [] : [];

    return { category, threads };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const data = await getCategoryData(slug);
  if (!data) return { title: 'Category Not Found' };
  return {
    title: `${data.category.name} - Community Forum`,
    description: data.category.description,
  };
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const data = await getCategoryData(slug);

  if (!data) notFound();

  const { category, threads } = data;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Breadcrumbs + header */}
      <div className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-48 w-48 rounded-full bg-red-600/8 blur-[100px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-12">
          {/* Breadcrumbs */}
          <nav className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/forum" className="hover:text-muted-foreground transition-colors duration-200">
                  Forum
                </Link>
              </li>
              <li className="text-muted-foreground">/</li>
              <li className="text-muted-foreground">{category.name}</li>
            </ol>
          </nav>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{category.name}</h1>
          <p className="text-muted-foreground mt-1.5 leading-relaxed">{category.description}</p>
        </div>
      </div>

      {/* Thread list */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        {threads.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No threads in this category yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/${slug}/${thread.slug}`}
                className="block rounded-xl border border-border bg-card backdrop-blur-xl p-5 hover:bg-white/[0.02] transition-colors duration-200"
              >
                <h3 className="text-sm font-medium text-foreground leading-snug tracking-tight">{thread.title}</h3>
                <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
                  {thread.author && <span className="text-muted-foreground">{thread.author}</span>}
                  <span>{thread.views} views</span>
                  <span>{thread.answerCount} answers</span>
                  <span>{relativeTime(thread.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
