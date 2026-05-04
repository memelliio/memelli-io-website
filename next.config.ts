import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone" — disabled (Next.js clientReferenceManifest invariant on (public)/page in standalone mode)
  transpilePackages: ["@memelli/ui", "@memelli/types", "@memelli/auth"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Legacy /admin.html links rewrite to /admin (the App Router page route).
  async rewrites() {
    return [
      { source: '/admin.html', destination: '/admin' },
    ];
  },
};

export default nextConfig;
