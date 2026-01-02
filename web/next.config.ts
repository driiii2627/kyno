import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable Vercel Image Optimization to save usage limits
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow optimization for 4K screens (default max is usually 1920 or 2048)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};

// @ts-expect-error next-pwa types issues
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'tmdb-images',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Fallback to default caching for everything else
    ...require('next-pwa/cache'),
  ],
});

export default withPWA(nextConfig);
