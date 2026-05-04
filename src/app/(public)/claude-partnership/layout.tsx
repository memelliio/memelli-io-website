import { buildMetadata } from '../seo-metadata';

export const metadata = buildMetadata({
  title: 'Claude Partnership',
  description:
    'How Anthropic Claude powers Memelli OS — 262+ pages, 50,000+ lines of TypeScript, 43 doctrine stages, 13 agent pools. AI as operating system architect.',
  path: '/claude-partnership',
});

export default function ClaudePartnershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
