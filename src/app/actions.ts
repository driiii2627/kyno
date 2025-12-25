'use server';

import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { redirect } from 'next/navigation';

export async function getSeason(tvId: number, seasonNumber: number) {
    return tmdb.getSeasonDetails(tvId, seasonNumber);
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
