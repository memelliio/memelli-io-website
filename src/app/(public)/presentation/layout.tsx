import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Presentation',
  description:
    'Live commerce presentation generated autonomously by Memelli OS. Products, checkout flows, and net terms — all built from a single AI command.',
  path: '/presentation',
});

export default function PresentationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
