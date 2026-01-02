import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev to avoid annoying logging
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'tmdb-images',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/superflixapi\.buzz\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    }
  ],
});

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

export default withPWA(nextConfig);
