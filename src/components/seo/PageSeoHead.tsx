'use client';

/**
 * PageSeoHead — Injects SEO metadata into the page head.
 * Uses Next.js Metadata API patterns for client components.
 * For server components, use generateMetadata() instead.
 */

import { useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageSeoProps {
  // Core meta
  title: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';

  // Twitter
  twitterCard?: 'summary' | 'summary_large_image';

  // Robots
  noindex?: boolean;
  nofollow?: boolean;

  // Brand
  brandName?: string;
  titleSuffix?: string; // e.g., "| Memelli"

  // JSON-LD Schema
  schema?: Record<string, any> | Record<string, any>[];
}

// ─── Schema Generators ──────────────────────────────────────────────────────

export function generateOrganizationSchema(config: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  telephone?: string;
  email?: string;
  sameAs?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    ...(config.logo && { logo: config.logo }),
    ...(config.description && { description: config.description }),
    ...(config.telephone && { telephone: config.telephone }),
    ...(config.email && { email: config.email }),
    ...(config.sameAs?.length && { sameAs: config.sameAs }),
  };
}

export function generateWebSiteSchema(config: { name: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: config.url,
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function generateQAPageSchema(config: {
  question: string;
  answer: string;
  url: string;
  datePublished: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: config.question,
      text: config.question,
      dateCreated: config.datePublished,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: config.answer,
        dateCreated: config.datePublished,
        url: config.url,
        ...(config.author && {
          author: { '@type': 'Person', name: config.author },
        }),
      },
    },
  };
}

export function generateForumPostingSchema(config: {
  headline: string;
  text: string;
  url: string;
  datePublished: string;
  author?: string;
  replyCount?: number;
  viewCount?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: config.headline,
    text: config.text,
    url: config.url,
    datePublished: config.datePublished,
    ...(config.author && {
      author: { '@type': 'Person', name: config.author },
    }),
    interactionStatistic: [
      ...(config.replyCount !== undefined ? [{
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: config.replyCount,
      }] : []),
      ...(config.viewCount !== undefined ? [{
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ViewAction',
        userInteractionCount: config.viewCount,
      }] : []),
    ],
  };
}

export function generateProductSchema(config: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  url: string;
  availability?: 'InStock' | 'OutOfStock';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.description,
    ...(config.image && { image: config.image }),
    url: config.url,
    offers: {
      '@type': 'Offer',
      price: config.price,
      priceCurrency: config.currency || 'USD',
      availability: `https://schema.org/${config.availability || 'InStock'}`,
    },
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PageSeoHead({
  title, description, keywords, canonicalUrl,
  ogTitle, ogDescription, ogImage, ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex, nofollow,
  brandName, titleSuffix,
  schema,
}: PageSeoProps) {
  const fullTitle = titleSuffix ? `${title} ${titleSuffix}` : title;
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(',');

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to set/update a meta tag
    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Core meta
    if (description) setMeta('description', description);
    if (keywords?.length) setMeta('keywords', keywords.join(', '));
    setMeta('robots', robotsContent);

    // Open Graph
    setMeta('og:title', ogTitle || fullTitle, true);
    if (ogDescription || description) setMeta('og:description', ogDescription || description || '', true);
    setMeta('og:type', ogType, true);
    if (ogImage) setMeta('og:image', ogImage, true);
    if (canonicalUrl) setMeta('og:url', canonicalUrl, true);

    // Twitter
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', ogTitle || fullTitle);
    if (ogDescription || description) setMeta('twitter:description', ogDescription || description || '');
    if (ogImage) setMeta('twitter:image', ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }

    // JSON-LD Schema
    // Remove old schema
    document.querySelectorAll('script[data-seo-schema]').forEach(el => el.remove());

    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach((s, i) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-schema', String(i));
        script.textContent = JSON.stringify(s);
        document.head.appendChild(script);
      });
    }

    // Cleanup
    return () => {
      document.querySelectorAll('script[data-seo-schema]').forEach(el => el.remove());
    };
  }, [fullTitle, description, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterCard, noindex, nofollow, robotsContent, schema]);

  return null; // This component only manages head tags
}

// ─── Server-side metadata generator for Next.js generateMetadata ────────────

export function buildMetadata(props: PageSeoProps) {
  const fullTitle = props.titleSuffix ? `${props.title} ${props.titleSuffix}` : props.title;

  return {
    title: fullTitle,
    description: props.description,
    keywords: props.keywords,
    robots: {
      index: !props.noindex,
      follow: !props.nofollow,
    },
    openGraph: {
      title: props.ogTitle || fullTitle,
      description: props.ogDescription || props.description,
      images: props.ogImage ? [props.ogImage] : undefined,
      type: props.ogType || 'website',
      url: props.canonicalUrl,
    },
    twitter: {
      card: props.twitterCard || 'summary_large_image',
      title: props.ogTitle || fullTitle,
      description: props.ogDescription || props.description,
      images: props.ogImage ? [props.ogImage] : undefined,
    },
    alternates: {
      canonical: props.canonicalUrl,
    },
  };
}
