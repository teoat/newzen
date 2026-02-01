import withBundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
    reactCompiler: true,
  },
  transpilePackages: ['lucide-react', 'framer-motion'],
  typescript: {
  },
  eslint: {
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'grainy-gradients.vercel.app',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.API_URL 
          ? `${process.env.API_URL}/api/v1/:path*` 
          : 'http://127.0.0.1:8200/api/v1/:path*',
      },
      {
        source: '/api/v2/:path*',
        destination: process.env.API_URL 
          ? `${process.env.API_URL}/api/v2/:path*` 
          : 'http://127.0.0.1:8200/api/v2/:path*',
      },
      {
        source: '/ws/:path*',
        destination: process.env.API_URL
          ? `${process.env.API_URL}/ws/:path*`
          : 'http://127.0.0.1:8200/ws/:path*',
      }
    ];
  },
};

export default withPWA(bundleAnalyzer(withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
})));

