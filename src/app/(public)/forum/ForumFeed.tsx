'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface ForumCategory {
  slug: string;
  name: string;
  description: string;
  threadCount: number;
  icon: string;
}

export interface ForumThread {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  slug: string;
  views?: number;
  answerCount: number;
  voteCount?: number;
  author?: string;
  createdAt: string;
  isAiGenerated?: boolean;
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

function UpvoteIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PostCard({ thread, rank }: { thread: ForumThread; rank?: number }) {
  const [votes, setVotes] = useState(thread.voteCount ?? Math.floor(Math.random() * 200) + 1);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  function handleVote(dir: 'up' | 'down', e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (voted === dir) {
      setVoted(null);
      setVotes((v) => dir === 'up' ? v - 1 : v + 1);
    } else {
      const delta = dir === 'up' ? 1 : -1;
      const undo = voted ? (voted === 'up' ? -1 : 1) : 0;
      setVotes((v) => v + delta + undo);
      setVoted(dir);
    }
  }

  return (
    <Link
      href={`/forum/${thread.categorySlug}/${thread.slug}`}
      className="group flex gap-0 rounded-xl border border-white/[0.05] bg-card backdrop-blur-xl overflow-hidden hover:border-border hover:bg-card transition-all duration-200"
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1 px-3 py-4 bg-[hsl(var(--background))] border-r border-border min-w-[52px]">
        <button
          onClick={(e) => handleVote('up', e)}
          className={`transition-colors ${voted === 'up' ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}
        >
          <UpvoteIcon />
        </button>
        <span className={`text-xs font-bold tabular-nums ${voted === 'up' ? 'text-red-400' : voted === 'down' ? 'text-blue-400' : 'text-muted-foreground'}`}>
          {votes}
        </span>
        <button
          onClick={(e) => handleVote('down', e)}
          className={`rotate-180 transition-colors ${voted === 'down' ? 'text-blue-400' : 'text-muted-foreground hover:text-blue-400'}`}
        >
          <UpvoteIcon />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3.5 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded-full">
            r/{thread.categorySlug}
          </span>
          {thread.isAiGenerated && (
            <span className="text-[10px] text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-full font-medium">
              ✦ AI Boosted
            </span>
          )}
          {rank && rank <= 3 && (
            <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
              🔥 Hot
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-foreground leading-snug tracking-tight group-hover:text-white transition-colors line-clamp-2">
          {thread.title}
        </h3>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Posted by u/{thread.author ?? 'member'}</span>
          <span>{relativeTime(thread.createdAt)}</span>
          <span className="flex items-center gap-1">
            <CommentIcon />
            {thread.answerCount} comments
          </span>
          {thread.views != null && (
            <span className="flex items-center gap-1">
              <EyeIcon />
              {thread.views}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const SORT_TABS = ['Hot', 'New', 'Top', 'Rising'] as const;

interface ForumFeedProps {
  trending: ForumThread[];
  latest: ForumThread[];
  categories: ForumCategory[];
  totalMembers: number;
  onlineNow: number;
}

export function ForumFeed({ trending, latest, categories, totalMembers, onlineNow }: ForumFeedProps) {
  const [activeSort, setActiveSort] = useState<typeof SORT_TABS[number]>('Hot');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex gap-6 items-start">

        {/* ── Main feed ── */}
        <div className="flex-1 min-w-0">

          {/* Sort tabs */}
          <div className="flex items-center gap-1 mb-5 bg-card border border-white/[0.05] rounded-xl p-1 w-fit">
            {SORT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSort(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeSort === tab
                    ? 'bg-red-600 text-white'
                    : 'text-muted-foreground hover:text-muted-foreground'
                }`}
              >
                {tab === 'Hot' ? '🔥' : tab === 'New' ? '✨' : tab === 'Top' ? '📈' : '🚀'} {tab}
              </button>
            ))}
          </div>

          {/* Trending */}
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Trending</h2>
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="space-y-2 mb-8">
            {trending.map((t, i) => (
              <PostCard key={t.id} thread={t} rank={i + 1} />
            ))}
          </div>

          {/* Latest */}
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Latest Posts</h2>
            <div className="flex-1 h-px bg-muted" />
          </div>
          <div className="space-y-2">
            {latest.map((t) => (
              <PostCard key={t.id} thread={t} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="text-sm text-muted-foreground hover:text-muted-foreground transition-colors">
              Load more posts
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">

          {/* Community stats */}
          <div className="rounded-xl border border-white/[0.05] bg-card p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="font-bold text-white">{totalMembers.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">members</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-400 flex items-center gap-1 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  {onlineNow}
                </div>
                <div className="text-xs text-muted-foreground">online</div>
              </div>
            </div>

            {/* Create post */}
            <Link
              href="/register"
              className="flex items-center gap-3 w-full px-4 py-2.5 bg-muted hover:bg-muted/50 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <span className="text-muted-foreground">✏</span>
              Create a post…
            </Link>
            <div className="flex gap-2">
              <Link href="/register" className="flex-1 py-2 text-center text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
                Post
              </Link>
              <Link href="/register" className="flex-1 py-2 text-center text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/50 rounded-lg transition-colors border border-border">
                Ask Question
              </Link>
            </div>
          </div>

          {/* AI SEO Activity */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-bold text-violet-300">AI SEO Agents Active</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Memelli&apos;s AI agents continuously publish SEO-optimized topics to drive Google traffic to this forum.
            </p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-green-400">↑</span>
                Indexed 3 new topics today
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400">🔍</span>
                47 organic search visits today
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400">🎯</span>
                12 trending keywords targeted
              </div>
            </div>
          </div>

          {/* Communities */}
          <div className="rounded-xl border border-white/[0.05] bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Communities</h3>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/forum/${cat.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground group-hover:text-white transition-colors truncate">
                        r/{cat.slug}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{cat.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 ml-2">{cat.threadCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer links */}
          <div className="text-[10px] text-muted-foreground leading-relaxed px-1">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/pricing" className="hover:text-muted-foreground">Pricing</Link>
              <Link href="/vpn" className="hover:text-muted-foreground">Infinity VPN</Link>
              <Link href="/register" className="hover:text-muted-foreground">Sign Up</Link>
              <Link href="/login" className="hover:text-muted-foreground">Log In</Link>
            </div>
            <p className="mt-2">© {new Date().getFullYear()} Memelli OS. Powered by AI.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
