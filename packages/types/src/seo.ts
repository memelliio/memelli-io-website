// ─── Site Types ─────────────────────────────────────────────────────────────

export type SiteType =
  | 'MARKETING'        // Basic public business site, no store
  | 'AUTHORITY'        // Business site with forum SEO engine
  | 'STORE'            // Business site with commerce
  | 'AUTHORITY_STORE'  // Full growth: forum + commerce
  | 'WHITE_LABEL';     // Branded under reseller/affiliate

// ─── Site SEO Config ────────────────────────────────────────────────────────

export interface SiteSeoConfig {
  // Identity
  brandName: string;
  defaultTitleSuffix: string;           // e.g., "| Memelli"
  defaultMetaDescription: string;       // fallback description
  defaultOgImage: string;               // fallback share image URL
  canonicalBaseUrl: string;             // e.g., "https://memelli.com"

  // Feature flags
  seoEnabled: boolean;
  forumEnabled: boolean;
  commerceEnabled: boolean;
  crmCaptureEnabled: boolean;
  communicationsEnabled: boolean;
  whiteLabelMode: boolean;

  // SEO engine flags
  indexingEnabled: boolean;
  sitemapEnabled: boolean;
  topicGenerationEnabled: boolean;
  clusterGenerationEnabled: boolean;
  questionDiscoveryEnabled: boolean;
  autoThreadCreationEnabled: boolean;
  repingEnabled: boolean;

  // Defaults
  defaultCtaType: 'start' | 'apply' | 'book' | 'consultation' | 'check-readiness' | 'get-qualified' | 'contact';
  defaultCtaUrl: string;
  defaultCtaText: string;
  defaultServiceLinks: { label: string; url: string }[];

  // Schema defaults
  defaultSchemaOrg: {
    type: 'Organization' | 'LocalBusiness';
    name: string;
    description?: string;
    logo?: string;
    telephone?: string;
    email?: string;
    address?: { street?: string; city?: string; state?: string; zip?: string; country?: string };
    sameAs?: string[];  // social links
  };

  // White-label overrides
  whiteLabel?: {
    brandName: string;
    logoUrl?: string;
    primaryColor?: string;
    footerText?: string;
    contactEmail?: string;
    contactPhone?: string;
    domain: string;
  };

  // Crawl settings
  crawlPriority?: {
    homepage: number;       // 1.0
    services: number;       // 0.8
    forum: number;          // 0.7
    categories: number;     // 0.6
    threads: number;        // 0.5
    products: number;       // 0.7
    blog: number;           // 0.6
  };
}

// ─── Page SEO Fields ────────────────────────────────────────────────────────

export interface PageSeoFields {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robotsDirective?: string;        // e.g., "index,follow" or "noindex,nofollow"
  schemaType?: PageSchemaType;
  noindex?: boolean;
  structured?: Record<string, any>; // custom JSON-LD overrides
}

export type PageSchemaType =
  | 'WebPage'
  | 'Article'
  | 'FAQPage'
  | 'QAPage'
  | 'DiscussionForumPosting'
  | 'Product'
  | 'Organization'
  | 'LocalBusiness'
  | 'CollectionPage'
  | 'ContactPage'
  | 'AboutPage';

// ─── Page Type ──────────────────────────────────────────────────────────────

export type SitePageType =
  | 'homepage'
  | 'about'
  | 'services'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'get-started'
  | 'forum_hub'
  | 'forum_category'
  | 'forum_thread'
  | 'topic_cluster'
  | 'blog'
  | 'blog_post'
  | 'store'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'custom';

// ─── Template Config ────────────────────────────────────────────────────────

export interface SiteTemplateConfig {
  siteType: SiteType;
  brandName: string;
  logo?: string;
  colors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  domain?: string;
  industry: string;

  // Module flags
  seoEnabled: boolean;
  forumEnabled: boolean;
  commerceEnabled: boolean;
  crmCaptureEnabled: boolean;
  communicationsEnabled: boolean;
  whiteLabelMode: boolean;

  // Defaults
  defaultCtaType: string;
  defaultServiceLinks: { label: string; url: string }[];
  defaultSchemaSettings: SiteSeoConfig['defaultSchemaOrg'];
  defaultMetaRules: {
    titleSuffix: string;
    fallbackDescription: string;
    fallbackOgImage: string;
  };
}

// ─── Meta Title Format Rules ────────────────────────────────────────────────

export interface MetaTitleRule {
  pageType: SitePageType;
  format: string;  // Template string, e.g., "{title} | {brand}"
  example: string;
}

export const DEFAULT_META_TITLE_RULES: MetaTitleRule[] = [
  { pageType: 'homepage', format: '{offer} | {brand}', example: 'Funding Readiness and Business Growth | Memelli' },
  { pageType: 'services', format: '{service} | {brand}', example: 'Credit Repair Services for Funding Readiness | Memelli' },
  { pageType: 'forum_category', format: '{category} Questions and Answers | {brand}', example: 'Business Funding Questions and Answers | Memelli' },
  { pageType: 'forum_thread', format: '{question} | {brand}', example: 'What Credit Score Do You Need for Business Funding? | Memelli' },
  { pageType: 'topic_cluster', format: '{topic} Guide and Related Questions | {brand}', example: 'Business Credit Guide and Related Questions | Memelli' },
  { pageType: 'product', format: '{product} | {brand}', example: 'Credit Repair Package | Memelli' },
  { pageType: 'blog_post', format: '{title} | {brand}', example: 'How to Improve Your Credit Score | Memelli' },
  { pageType: 'about', format: 'About {brand}', example: 'About Memelli' },
  { pageType: 'contact', format: 'Contact {brand}', example: 'Contact Memelli' },
  { pageType: 'faq', format: 'FAQ | {brand}', example: 'FAQ | Memelli' },
  { pageType: 'get-started', format: 'Get Started | {brand}', example: 'Get Started | Memelli' },
];

// ─── Site Compatibility Status ──────────────────────────────────────────────

export interface SeoCompatibilityStatus {
  siteId: string;
  siteName: string;
  seoEnabled: boolean;
  forumEnabled: boolean;
  commerceEnabled: boolean;

  // Audit
  hasForumHome: boolean;
  hasCategoryPages: boolean;
  hasThreadTemplate: boolean;
  hasTopicClusterPage: boolean;
  hasSeoTitleFields: boolean;
  hasSeoDescriptionFields: boolean;
  hasSchemaOutput: boolean;
  hasSitemapIncludesForum: boolean;
  hasRelatedContentZones: boolean;
  hasCtaZones: boolean;
  hasSiteWideSeoSettings: boolean;
  hasWhiteLabelSeoSettings: boolean;

  // Counts
  categoryCount: number;
  threadCount: number;
  clusterCount: number;
  indexedPageCount: number;

  // Status
  sitemapActive: boolean;
  metadataStatus: 'complete' | 'partial' | 'missing';
  schemaStatus: 'complete' | 'partial' | 'missing';
  indexingStatus: 'active' | 'paused' | 'disabled';
  templateCompatibility: 'full' | 'partial' | 'incompatible';
}
