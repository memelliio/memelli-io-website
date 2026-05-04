import Link from 'next/link';

const categories = ['All', 'AI & Automation', 'Entrepreneurship', 'Product Updates', 'Guides', 'Case Studies'];

const articles = [
  {
    slug: 'why-ai-companies-are-the-future',
    title: 'Why AI Companies Are the Future of Entrepreneurship',
    excerpt:
      'The cost of starting a business just dropped to near zero. Here is how AI agents are replacing entire teams and what it means for the next generation of founders.',
    date: 'Mar 8, 2025',
    category: 'AI & Automation',
    readTime: '6 min read',
    featured: true,
  },
  {
    slug: 'launching-memelli-os',
    title: 'Introducing Memelli OS: Your Business Operating System',
    excerpt:
      'Today we are launching the platform we have been building for the past year -- 10 products, 50+ AI agents, one unified operating system for your business.',
    date: 'Mar 1, 2025',
    category: 'Product Updates',
    readTime: '4 min read',
    featured: true,
  },
  {
    slug: 'ai-crm-vs-traditional-crm',
    title: 'AI CRM vs Traditional CRM: Why the Gap Is Growing',
    excerpt:
      'Traditional CRMs require manual data entry and constant babysitting. AI-native CRMs do the work for you. We break down the key differences.',
    date: 'Feb 24, 2025',
    category: 'AI & Automation',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: 'how-to-start-business-with-no-employees',
    title: 'How to Start a Business With Zero Employees',
    excerpt:
      'A step-by-step guide to launching and running a profitable business using nothing but AI agents. No hiring, no payroll, no HR headaches.',
    date: 'Feb 18, 2025',
    category: 'Entrepreneurship',
    readTime: '8 min read',
    featured: false,
  },
  {
    slug: 'seo-content-at-scale',
    title: 'How to Generate SEO Content at Scale Without Sacrificing Quality',
    excerpt:
      'AI-generated content has a bad reputation. Here is how our Forum SEO Traffic product creates genuinely useful, ranking content -- 250 articles per month.',
    date: 'Feb 10, 2025',
    category: 'Guides',
    readTime: '7 min read',
    featured: false,
  },
  {
    slug: 'credit-repair-automation-guide',
    title: 'The Complete Guide to Automating Your Credit Repair Business',
    excerpt:
      'From dispute letter generation to client communication, learn how AI can handle 90% of the work in a credit repair business.',
    date: 'Feb 3, 2025',
    category: 'Guides',
    readTime: '10 min read',
    featured: false,
  },
  {
    slug: 'memelli-affiliate-program-launch',
    title: 'Announcing the Memelli Affiliate Program: Earn Up to 35% Recurring',
    excerpt:
      'We are launching our affiliate program with industry-leading recurring commissions. Here is everything you need to know to get started.',
    date: 'Jan 28, 2025',
    category: 'Product Updates',
    readTime: '3 min read',
    featured: false,
  },
  {
    slug: 'ai-agents-explained',
    title: 'What Are AI Agents? A Non-Technical Explanation',
    excerpt:
      'AI agents are not just chatbots. They are autonomous workers that can research, write, analyze, communicate, and execute tasks on your behalf.',
    date: 'Jan 20, 2025',
    category: 'AI & Automation',
    readTime: '5 min read',
    featured: false,
  },
  {
    slug: 'solo-founder-case-study',
    title: 'How a Solo Founder Runs a 6-Figure Business With AI',
    excerpt:
      'Meet Sarah, who launched a coaching business on Memelli and scaled to six figures in 4 months -- without hiring a single person.',
    date: 'Jan 14, 2025',
    category: 'Case Studies',
    readTime: '6 min read',
    featured: false,
  },
];

export default function BlogPage() {
  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Hero */}
      <section className="relative px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
          <div className="h-72 w-72 rounded-full bg-red-600/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            The Memelli{' '}
            <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Insights on AI, automation, and building the next generation of businesses.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  cat === 'All'
                    ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20'
                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-8 transition-all duration-300 hover:border-red-500/20 hover:bg-card hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-500/[0.04]"
              >
                <div className="mb-3 inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                  {article.category}
                </div>
                <h2 className="mb-3 text-xl font-semibold tracking-tight text-foreground group-hover:text-red-300 transition-colors duration-200">
                  {article.title}
                </h2>
                <p className="mb-5 text-sm text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{article.date}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                  <span>{article.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/blog/${article.slug}`}
                className="group rounded-2xl border border-border bg-card backdrop-blur-xl p-6 transition-all duration-300 hover:border-red-500/15 hover:bg-card hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/[0.03]"
              >
                <div className="mb-3 inline-flex rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-medium text-red-300/80">
                  {article.category}
                </div>
                <h3 className="mb-2 text-sm font-semibold tracking-tight text-foreground group-hover:text-red-300 transition-colors duration-200 line-clamp-2">
                  {article.title}
                </h3>
                <p className="mb-4 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{article.date}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-muted" />
                  <span>{article.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card backdrop-blur-xl p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Stay in the{' '}
              <span className="bg-gradient-to-r from-red-400 to-violet-400 bg-clip-text text-transparent">
                Loop
              </span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Get the latest insights on AI business automation delivered to your inbox.
              No spam, unsubscribe anytime.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="your@email.com"
                className="rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500/40 focus:outline-none focus:ring-1 focus:ring-red-500/30 sm:w-64 transition-colors"
              />
              <button className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-red-500">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
