import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Baseline CSP — pragmatic, not maximally strict. 'unsafe-inline' on
// script-src is required without a nonce-based setup (Next.js App Router
// inlines some bootstrap/hydration scripts); 'unsafe-eval' is dev-only for
// Fast Refresh/HMR. Tighten with per-request nonces in a follow-up if this
// needs to be locked down further.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://ik.imagekit.io",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  // swagger-ui-react ships legacy class components (UNSAFE_componentWillReceiveProps)
  // that trip Strict Mode's double-invoke warnings in dev. Disabled project-wide
  // since Next has no per-route Strict Mode toggle; no effect on production behavior.
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
