'use server';

import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { redirect } from 'next/navigation';

export async function getSeason(tvId: number, seasonNumber: number) {
    const seasonData = await tmdb.getSeasonDetails(tvId, seasonNumber);

    // Filter episodes available on Superflix (Two-step validation)
    const filteredEpisodes = await Promise.all(
        seasonData.episodes.map(async (ep) => {
            try {
                // 1. Get the wrapper page from Superflix API
                const wrapperUrl = `https://superflixapi.buzz/serie/${tvId}/${seasonNumber}/${ep.episode_number}`;
                const wrapperRes = await fetch(wrapperUrl, { cache: 'no-store' });
                if (!wrapperRes.ok) return null;

                const html = await wrapperRes.text();

                // 2. Extract the real content link (Visualização button)
                // Regex to find href in <a ... class="btn btn-secondary">Visualização</a>
                // or just any link that looks like a player link if class changes.
                // The pattern observed is class="btn btn-secondary" and text "Visualização"
                // Match: <a href="(URL)" class="btn btn-secondary">Visualização</a>
                const match = html.match(/href="([^"]+)"\s+class="btn btn-secondary">Visualização<\/a>/);

                if (!match || !match[1]) {
                    // If no link found, it might not be available
                    return null;
                }

                const targetUrl = match[1];

                // 3. Check the real link status
                const targetRes = await fetch(targetUrl, { method: 'HEAD', cache: 'no-store' });

                // Pobreflix/Noveflix returns 404 if not found
                return targetRes.status === 200 ? ep : null;

            } catch (e) {
                console.error(`Error checking ep ${ep.episode_number}:`, e);
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
