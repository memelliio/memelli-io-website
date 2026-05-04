import { buildMetadata } from '../../seo-metadata';

export const metadata = buildMetadata({
  title: 'AI Build Service',
  description:
    'Custom digital products built by AI agents in under an hour. Websites, applications, dashboards, ebooks — production-ready and deployed. Starting at $199.',
  path: '/services/ai-build',
});

export default function AIBuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
