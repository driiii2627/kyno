'use server';

import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { redirect } from 'next/navigation';

export async function getSeason(tvId: number, seasonNumber: number) {
    const seasonData = await tmdb.getSeasonDetails(tvId, seasonNumber);

    // Filter episodes available on Superflix
    const filteredEpisodes = await Promise.all(
        seasonData.episodes.map(async (ep) => {
            try {
                // Check if episode exists on Superflix
                // Use default domain or config. For speed, hardcoding the check domain as per documentation is safest for now,
                // or we could use the Base URL from content service if we needed to be dynamic.
                // The user specifically pointed to superflixapi.buzz
                const url = `https://superflixapi.buzz/serie/${tvId}/${seasonNumber}/${ep.episode_number}`;
                const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
                return res.ok ? ep : null;
            } catch (e) {
                // If check fails, assume safe or exclude? 
                // To be safe and avoid "empty players", strict filtering is better.
                return null;
            }
        })
    );

    return {
        ...seasonData,
        episodes: filteredEpisodes.filter(ep => ep !== null)
    };
}

/**
 * Resolves a TMDB ID to a Kyno UUID.
 * 1. Checks if it exists in Supabase.
 * 2. If yes, returns UUID.
 * 3. If no, syncs it (creates it) and returns new UUID.
 */
export async function resolveTmdbContent(tmdbId: number, type: 'movie' | 'tv') {
    // 1. Check if already exists in Supabase
    const { data: existing, error } = await contentService.getItemByTmdbId(tmdbId, type);

    if (existing) {
        return existing.id;
    }

    // 2. Fetch details from TMDB to sync
    try {
        const details = await tmdb.getDetails(tmdbId, type);

        // 3. Sync to Supabase
        if (type === 'movie') {
            await contentService.syncMovies([details]);
        } else {
            await contentService.syncSeries([details]);
        }

        // 4. Fetch the newly created item
        const { data: newItem } = await contentService.getItemByTmdbId(tmdbId, type);
        return newItem?.id;

    } catch (e) {
        console.error("Failed to resolve content", e);
        return null;
    }
}
