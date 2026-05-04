import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Performance',
  description:
    'Live session results from Memelli OS — 14 AI agents, 13 deliverables shipped simultaneously, zero type errors, production-grade output.',
  path: '/performance',
});

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
