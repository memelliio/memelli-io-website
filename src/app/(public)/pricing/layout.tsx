import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Pricing',
  description:
    'Memelli OS pricing plans — start free, scale as you grow. AI agents, commerce, CRM, coaching, SEO, and communications included. No hidden fees.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
