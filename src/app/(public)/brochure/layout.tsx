import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Brochure',
  description:
    'Explore Memelli OS — the AI-first operating system for business. Commerce, CRM, coaching, SEO, and 40+ AI agents in one platform.',
  path: '/brochure',
});

export default function BrochureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
