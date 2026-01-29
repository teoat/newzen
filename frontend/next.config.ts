import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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

export default nextConfig;
