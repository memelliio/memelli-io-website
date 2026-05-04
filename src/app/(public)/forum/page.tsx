import { Metadata } from 'next';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { ForumFeed, type ForumCategory, type ForumThread } from './ForumFeed';

export const metadata: Metadata = {
  title: 'Community Forum — Memelli',
  description: 'Join the Memelli community. Ask questions, share knowledge, and learn from AI-powered entrepreneurs worldwide.',
};

async function getForumData() {
  try {
    const [catRes, trendRes, latestRes] = await Promise.all([
      fetch(`${API_URL}/api/forum/public/categories`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/api/forum/public/trending`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/api/forum/public/latest`, { next: { revalidate: 60 } }),
    ]);

    const categories: ForumCategory[] = catRes.ok ? (await catRes.json()).data ?? [] : [];
    const trending: ForumThread[] = trendRes.ok ? (await trendRes.json()).data ?? [] : [];
    const latest: ForumThread[] = latestRes.ok ? (await latestRes.json()).data ?? [] : [];

    return { categories, trending, latest };
  } catch {
    return { categories: [], trending: [], latest: [] };
  }
}

export default async function ForumPage() {
  const { categories, trending, latest } = await getForumData();

  // Seed with placeholder posts if API returns empty (for SEO preview)
  const displayTrending: ForumThread[] = trending.length > 0 ? trending : [
    { id: '1', title: 'How I got $50k in business funding using Memelli in 90 days', category: 'Funding', categorySlug: 'funding', slug: 'got-50k-business-funding-memelli', views: 4821, answerCount: 47, voteCount: 312, author: 'entrepreneur_jay', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), isAiGenerated: true },
    { id: '2', title: 'Best strategies for repairing credit score fast — what actually worked for me', category: 'Credit Repair', categorySlug: 'credit-repair', slug: 'best-credit-repair-strategies', views: 3204, answerCount: 31, voteCount: 218, author: 'creditwizard', createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: '3', title: 'My experience using the AI agents to automate my entire sales pipeline', category: 'AI Tools', categorySlug: 'ai-tools', slug: 'ai-agents-automate-sales-pipeline', views: 2891, answerCount: 29, voteCount: 195, author: 'automator_pro', createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), isAiGenerated: true },
    { id: '4', title: 'Infinity VPN setup guide for streaming — complete walkthrough', category: 'VPN & Privacy', categorySlug: 'vpn-privacy', slug: 'infinity-vpn-streaming-guide', views: 2110, answerCount: 18, voteCount: 167, author: 'vpn_guru', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: '5', title: 'Is the Forum SEO Traffic engine actually driving Google leads? My 30-day results', category: 'SEO & Traffic', categorySlug: 'seo-traffic', slug: 'forum-seo-traffic-engine-results', views: 1980, answerCount: 22, voteCount: 143, author: 'seotracker', createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), isAiGenerated: true },
  ];

  const displayLatest: ForumThread[] = latest.length > 0 ? latest : [
    { id: '6', title: "Just launched my AI-powered dropshipping store — here's what I learned", category: 'Commerce', categorySlug: 'commerce', slug: 'ai-dropshipping-store-launched', answerCount: 8, voteCount: 54, author: 'shopbuilder', createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString() },
    { id: '7', title: 'Question: Does Memelli integrate with Shopify or only its own storefront?', category: 'Commerce', categorySlug: 'commerce', slug: 'memelli-shopify-integration-question', answerCount: 3, voteCount: 21, author: 'shopify_migrate', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
    { id: '8', title: 'SmartCredit vs Credit Karma — which is better for business credit?', category: 'Credit Repair', categorySlug: 'credit-repair', slug: 'smartcredit-vs-credit-karma-business', answerCount: 12, voteCount: 89, author: 'creditbuilder', createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
    { id: '9', title: 'How to use the phone + SMS module for outbound lead follow-up', category: 'Communications', categorySlug: 'communications', slug: 'phone-sms-outbound-lead-followup', answerCount: 6, voteCount: 45, author: 'outbound_king', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: '10', title: 'Website builder SEO settings — tips for ranking faster on Google', category: 'SEO & Traffic', categorySlug: 'seo-traffic', slug: 'website-builder-seo-settings-tips', answerCount: 9, voteCount: 67, author: 'rank_hacker', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
  ];

  const displayCategories: ForumCategory[] = categories.length > 0 ? categories : [
    { slug: 'funding', name: 'Business Funding', description: 'Loans, grants, and capital strategies', threadCount: 284, icon: '💰' },
    { slug: 'credit-repair', name: 'Credit Repair', description: 'Scores, disputes, and tradelines', threadCount: 412, icon: '📊' },
    { slug: 'ai-tools', name: 'AI Tools', description: 'Agents, automation, and prompts', threadCount: 331, icon: '🤖' },
    { slug: 'commerce', name: 'Commerce', description: 'Storefronts, products, and orders', threadCount: 198, icon: '🛒' },
    { slug: 'seo-traffic', name: 'SEO & Traffic', description: 'Forum SEO engine and rankings', threadCount: 156, icon: '📈' },
    { slug: 'vpn-privacy', name: 'VPN & Privacy', description: 'Infinity VPN tips and setup', threadCount: 89, icon: '🛡️' },
    { slug: 'communications', name: 'Communications', description: 'Phone, SMS, and outreach', threadCount: 124, icon: '📱' },
    { slug: 'general', name: 'General', description: 'Everything else', threadCount: 203, icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">

      {/* ── Hero bar ── */}
      <div className="relative border-b border-border bg-[hsl(var(--background))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden">
          <div className="h-64 w-[600px] rounded-full bg-red-600/6 blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-red-400 bg-red-500/15 px-2.5 py-1 rounded-full border border-red-500/20">
                ✦ AI-Powered SEO Forum
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Memelli Community</h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed max-w-lg">
              Real discussions from real entrepreneurs — powered by AI agents that keep topics trending on Google.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/register"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Join Community
            </Link>
          </div>
        </div>
      </div>

      <ForumFeed
        trending={displayTrending}
        latest={displayLatest}
        categories={displayCategories}
        totalMembers={12847}
        onlineNow={234}
      />
    </div>
  );
}
