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
    ],
  },
};

export default nextConfig;
