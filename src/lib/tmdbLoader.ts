'use client';

import { ImageLoaderProps } from 'next/image';

export default function tmdbLoader({ src, width, quality }: ImageLoaderProps) {
    // TMDB only supports specific widths
    // We map the requested width (from Next.js sizes/srcset) to the nearest TMDB size
    // Available: w92, w154, w185, w342, w500, w780, w1280, original

    // If src is already a full URL (e.g. from a different source), return it
    if (src.startsWith('http')) return src;

    // Ensure src starts with /
    const path = src.startsWith('/') ? src : `/${src}`;

    let tmdbSize = 'original';

    if (width <= 92) tmdbSize = 'w92';
    else if (width <= 154) tmdbSize = 'w154';
    else if (width <= 185) tmdbSize = 'w185';
    else if (width <= 342) tmdbSize = 'w342';
    else if (width <= 500) tmdbSize = 'w500';
    else if (width <= 780) tmdbSize = 'w780';
    else if (width <= 1280) tmdbSize = 'w1280';
    // For anything larger than 1280, we use original. 
    // User wanted to "limit to 4k". Original is the only step above 1280. 
    // Most 4k TVs and monitors will request > 1280 width.
    else tmdbSize = 'original';

    return `https://image.tmdb.org/t/p/${tmdbSize}${path}`;
}
