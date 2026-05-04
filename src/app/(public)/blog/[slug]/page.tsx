import Link from 'next/link';

const articles: Record<
  string,
  {
    title: string;
    excerpt: string;
    date: string;
    category: string;
    readTime: string;
    author: string;
    content: string[];
  }
> = {
  'why-ai-companies-are-the-future': {
    title: 'Why AI Companies Are the Future of Entrepreneurship',
    excerpt:
      'The cost of starting a business just dropped to near zero. Here is how AI agents are replacing entire teams.',
    date: 'Mar 8, 2025',
    category: 'AI & Automation',
    readTime: '6 min read',
    author: 'Memelli Team',
    content: [
      'The traditional path to building a business has always required one thing above all else: people. You needed salespeople to sell, marketers to market, accountants to count, and managers to manage. The cost of those people has been the single biggest barrier to entry for aspiring entrepreneurs.',
      'That barrier just disappeared.',
      'AI agents -- not chatbots, not simple automations, but true autonomous agents capable of reasoning, planning, and executing complex tasks -- are now sophisticated enough to handle the work that previously required entire teams. And the implications for entrepreneurship are staggering.',
      'Consider what it takes to run a service business today. You need a CRM to track leads, a marketing team to generate content, a sales process to close deals, customer support to retain clients, and operations to keep everything running. Each of those functions traditionally required at least one dedicated person, often more.',
      'With AI agents, a solo founder can deploy an entire workforce in minutes. Not a simplified, dumbed-down version -- a genuine, full-featured operation where AI agents handle lead generation, content creation, customer communication, appointment scheduling, invoicing, and more.',
      'This is not theoretical. It is happening right now. Platforms like Memelli OS are giving entrepreneurs access to 50+ specialized AI agents that work together as a coordinated team. Your AI company operates 24/7, does not take vacations, and scales instantly.',
      'The economic implications are profound. When the cost of labor approaches zero, the traditional advantages of scale disappear. A solo founder with the right AI tools can compete with companies ten times their size. Industries that were previously winner-take-all become accessible to anyone with a good idea and the ambition to execute.',
      'We are entering an era where the size of your vision matters more than the size of your team. The entrepreneurs who embrace this shift early will have an enormous advantage. Those who wait will be competing against AI-powered businesses that never sleep.',
      'The future of entrepreneurship is not about hiring more people. It is about deploying smarter agents. And that future is here today.',
    ],
  },
  'launching-memelli-os': {
    title: 'Introducing Memelli OS: Your Business Operating System',
    excerpt:
      'Today we are launching the platform we have been building for the past year.',
    date: 'Mar 1, 2025',
    category: 'Product Updates',
    readTime: '4 min read',
    author: 'Memelli Team',
    content: [
      'Today marks a milestone we have been working toward for over a year. We are officially launching Memelli OS -- the operating system for AI-powered businesses.',
      'When we started building Memelli, we noticed something broken about the SaaS landscape. Entrepreneurs were using 10, 15, even 20 different tools to run their businesses. A CRM here, an email platform there, a separate tool for invoicing, another for content, another for scheduling. None of them talked to each other. The result was chaos.',
      'We asked a simple question: what if one platform did everything? Not by stitching together integrations, but by building every product from the ground up on a single, unified architecture?',
      'That is Memelli OS. Ten deeply integrated products. Fifty-plus AI agents. One platform.',
      'Here is what is included at launch: Memelli Master for AI-powered company management. Commerce for storefronts and order processing. CRM for pipeline management and customer relationships. Coaching for digital program delivery. Forum SEO Traffic for AI-generated content at scale. LeadPulse for signal-based lead detection. Communications for phone, SMS, and email. Credit for credit repair automation. Approval Pipeline for document processing. And Website Builder for custom sites.',
      'Every product is powered by AI agents that work autonomously. Your AI sales director manages the pipeline. Your AI marketing lead generates content. Your AI operations manager handles orders and fulfillment. They coordinate with each other, share data, and work 24/7.',
      'We are launching with four pricing tiers: Starter at $49/month, Growth at $149/month, Pro at $349/month, and Enterprise with custom pricing. Every plan includes a 14-day free trial with no credit card required.',
      'This is just the beginning. We have an aggressive roadmap for 2025, including more AI agents, more industry verticals, and capabilities that will make your AI company even more powerful.',
      'Welcome to the future of business. Welcome to Memelli OS.',
    ],
  },
};

// Fallback content for articles not fully defined
const fallbackArticle = {
  author: 'Memelli Team',
  content: [
    'This article is coming soon. Check back shortly for the full content.',
    'In the meantime, explore our other articles or sign up for our newsletter to get notified when new content drops.',
  ],
};

const relatedArticles = [
  {
    slug: 'why-ai-companies-are-the-future',
    title: 'Why AI Companies Are the Future of Entrepreneurship',
    category: 'AI & Automation',
    readTime: '6 min read',
  },
  {
    slug: 'launching-memelli-os',
    title: 'Introducing Memelli OS: Your Business Operating System',
    category: 'Product Updates',
    readTime: '4 min read',
  },
  {
    slug: 'how-to-start-business-with-no-employees',
    title: 'How to Start a Business With Zero Employees',
    category: 'Entrepreneurship',
    readTime: '8 min read',
  },
];

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = articles[slug];
  const title = article?.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const author = article?.author ?? fallbackArticle.author;
  const date = article?.date ?? 'Coming Soon';
  const category = article?.category ?? 'General';
  const readTime = article?.readTime ?? '5 min read';
  const content = article?.content ?? fallbackArticle.content;

  // Filter out the current article from related
  const related = relatedArticles.filter((a) => a.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Article Header */}
      <section className="relative px-6 pt-24 pb-14">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
          <div className="h-64 w-64 rounded-full bg-red-600/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Blog
          </Link>

          <div className="mb-4 inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
            {category}
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            {title}
          </h1>

          <div className="mt-6 flex items-center gap-4">
            {/* Author avatar placeholder */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-violet-500 text-sm font-semibold text-white">
              {author.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{author}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{date}</span>
                <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                <span>{readTime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-card backdrop-blur-xl p-8 sm:p-10">
            <div className="space-y-6">
              {content.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-8 text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              Ready to Build Your{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                AI Company?
              </span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Start your free trial today. No credit card required.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-block rounded-xl bg-red-600 px-8 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-red-500"
            >
              Start Your AI Company
            </Link>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="px-6 pb-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold tracking-tight">
              Related{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Articles
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-2xl border border-border bg-card backdrop-blur-xl p-5 transition-all duration-300 hover:border-red-500/15 hover:bg-card hover:-translate-y-0.5"
                >
                  <div className="mb-2 inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300/80">
                    {r.category}
                  </div>
                  <h3 className="text-sm font-medium tracking-tight text-foreground group-hover:text-red-300 transition-colors duration-200 line-clamp-2">
                    {r.title}
                  </h3>
                  <div className="mt-2 text-[10px] text-muted-foreground">{r.readTime}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
