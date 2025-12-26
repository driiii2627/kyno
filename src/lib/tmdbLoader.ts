'use client';

import { ImageLoaderProps } from 'next/image';

export default function tmdbLoader({ src, width, quality }: ImageLoaderProps) {
    // TMDB only supports specific widths
    // We map the requested width (from Next.js sizes/srcset) to the nearest TMDB size
    // Available: w92, w154, w185, w342, w500, w780, w1280, original

    if (!src || src === '/') return 'https://placehold.co/600x400?text=No+Image';

    // If it's a full URL, return it as is (bypass loader logic)
    if (src.startsWith('http')) return src;

    // Remove leading slash if present to avoid double slash
    const cleanPath = src.startsWith('/') ? src.slice(1) : src;

    // Map width to TMDB sizes
    let tmdbSize = 'original';
    if (width <= 92) tmdbSize = 'w92';
    else if (width <= 154) tmdbSize = 'w154';
    else if (width <= 185) tmdbSize = 'w185';
    else if (width <= 342) tmdbSize = 'w342';
    else if (width <= 500) tmdbSize = 'w500';
    else if (width <= 780) tmdbSize = 'w780';
    else if (width <= 1280) tmdbSize = 'w1280';

    return `https://image.tmdb.org/t/p/${tmdbSize}/${cleanPath}`;
}
