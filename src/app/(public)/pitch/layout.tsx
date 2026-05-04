import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Pitch Deck',
  description:
    'Memelli OS investor pitch deck — the AI-built operating system replacing disconnected SaaS tools with one intelligent platform powered by Claude.',
  path: '/pitch',
});

export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
