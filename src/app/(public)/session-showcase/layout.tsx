import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Session Showcase',
  description:
    '82 AI agents, one session, zero failures. March 2026 Memelli OS session report — 65,000+ lines of code, 325+ pages, 100% success rate.',
  path: '/session-showcase',
});

export default function SessionShowcaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
