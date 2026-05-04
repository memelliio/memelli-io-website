import type { Metadata } from 'next';

const BASE_URL = 'https://memelli.com';
const OG_IMAGE = `${BASE_URL}/memelli-logo.png`;
const SITE_NAME = 'Memelli OS';

export function buildMetadata(overrides: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const { title, description, path, ogImage } = overrides;
  const url = `${BASE_URL}${path}`;
  const image = ogImage ?? OG_IMAGE;

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}
