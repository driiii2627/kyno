import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Enable Vercel Image Optimization for faster loading (resize/cache)
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
    // Allow optimization for 4K screens (default max is usually 1920 or 2048)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};

export default nextConfig;
