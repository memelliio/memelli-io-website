import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_URL } from '@/lib/config';

interface Answer {
  id: string;
  content: string;
  author: string;
  isAccepted: boolean;
  upvotes: number;
  createdAt: string;
}

interface RelatedThread {
  id: string;
  title: string;
  slug: string;
  categorySlug: string;
}

interface ThreadData {
  id: string;
  title: string;
  slug: string;
  question: string;
  directAnswer: string;
  content: string;
  category: string;
  categorySlug: string;
  views: number;
  answers: Answer[];
  related: RelatedThread[];
  createdAt: string;
  updatedAt: string;
  schemaMarkup?: string;
}

interface PageProps {
  params: Promise<{ category: string; thread: string }>;
}

async function getThreadData(categorySlug: string, threadSlug: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/forum/public/categories/${categorySlug}/threads/${threadSlug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as ThreadData;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, thread: threadSlug } = await params;
  const thread = await getThreadData(category, threadSlug);
  if (!thread) return { title: 'Thread Not Found' };
  return {
    title: `${thread.title} - Community Forum`,
    description: thread.directAnswer?.slice(0, 160) ?? thread.question,
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

function buildSchema(thread: ThreadData): string {
  if (thread.schemaMarkup) return thread.schemaMarkup;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: thread.title,
      text: thread.question,
      answerCount: thread.answers.length,
      dateCreated: thread.createdAt,
      ...(thread.directAnswer
        ? {
            acceptedAnswer: {
              '@type': 'Answer',
              text: thread.directAnswer,
              dateCreated: thread.createdAt,
              upvoteCount: 0,
            },
          }
        : {}),
      ...(thread.answers.length > 0
        ? {
            suggestedAnswer: thread.answers.map((a) => ({
              '@type': 'Answer',
              text: a.content,
              dateCreated: a.createdAt,
              upvoteCount: a.upvotes,
              author: { '@type': 'Person', name: a.author },
            })),
          }
        : {}),
    },
  };

  return JSON.stringify(schema);
}

export default async function ThreadPage({ params }: PageProps) {
  const { category: categorySlug, thread: threadSlug } = await params;
  const thread = await getThreadData(categorySlug, threadSlug);

  if (!thread) notFound();

  const schemaJson = buildSchema(thread);

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />

      <div className="min-h-screen bg-[hsl(var(--background))]">
        {/* Header */}
        <div className="relative border-b border-border">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
            <div className="h-48 w-48 rounded-full bg-red-600/8 blur-[100px]" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumbs */}
            <nav className="mb-4">
              <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <li>
                  <Link href="/forum" className="hover:text-muted-foreground transition-colors duration-200">
                    Forum
                  </Link>
                </li>
                <li className="text-muted-foreground">/</li>
                <li>
                  <Link
                    href={`/forum/${thread.categorySlug}`}
                    className="hover:text-muted-foreground transition-colors duration-200"
                  >
                    {thread.category}
                  </Link>
                </li>
                <li className="text-muted-foreground">/</li>
                <li className="text-muted-foreground truncate max-w-[200px]">{thread.title}</li>
              </ol>
            </nav>

            <h1 className="text-xl font-semibold tracking-tight text-foreground leading-snug">{thread.title}</h1>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>{thread.views} views</span>
              <span>{thread.answers.length} answers</span>
              <span>Asked {relativeTime(thread.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Question */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Question
                </h2>
                <p className="text-foreground leading-relaxed">{thread.question}</p>
              </div>

              {/* Direct Answer */}
              {thread.directAnswer && (
                <div className="rounded-2xl border border-red-500/10 bg-red-950/10 backdrop-blur-xl p-8">
                  <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
                    Best Answer
                  </h2>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {thread.directAnswer}
                  </div>
                </div>
              )}

              {/* Extended content */}
              {thread.content && (
                <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Detailed Explanation
                  </h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {thread.content}
                  </div>
                </div>
              )}

              {/* Community Answers */}
              {thread.answers.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground mb-5">
                    {thread.answers.length} Answer{thread.answers.length !== 1 ? 's' : ''}
                  </h2>
                  <div className="space-y-3">
                    {thread.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={`rounded-2xl border p-6 backdrop-blur-xl ${
                          answer.isAccepted
                            ? 'border-emerald-500/10 bg-emerald-950/10'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {answer.author.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">
                              {answer.author}
                            </span>
                            {answer.isAccepted && (
                              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/15 rounded-full px-2 py-0.5">
                                Accepted
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {relativeTime(answer.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {answer.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <span>{answer.upvotes} upvotes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-center">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Need Expert Help?</h3>
                <p className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">
                  Get personalized assistance from our team of professionals.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Related threads */}
              {thread.related.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground mb-3">Related Questions</h3>
                  <div className="space-y-1">
                    {thread.related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/forum/${r.categorySlug}/${r.slug}`}
                        className="block text-sm text-muted-foreground hover:text-red-400 transition-colors duration-200 leading-snug py-1.5"
                      >
                        {r.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA sidebar */}
              <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-5">
                <h3 className="text-sm font-semibold tracking-tight text-foreground mb-2">Free Consultation</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Talk to an expert about your specific situation.
                </p>
                <Link
                  href="/contact"
                  className="block text-center rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 transition-colors duration-200"
                >
                  Schedule Now
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
