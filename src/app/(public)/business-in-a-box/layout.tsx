import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Business in a Box',
  description:
    'Launch your complete business in 24 hours. Website, CRM, email, SMS, phone, payments, SEO, and AI assistant — all built by Melli, all in one platform.',
  path: '/business-in-a-box',
});

export default function BusinessInABoxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
