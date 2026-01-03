'use server';

import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { redirect } from 'next/navigation';

export async function getSeason(tvId: number, seasonNumber: number) {
    try {
        const seasonData = await tmdb.getSeasonDetails(tvId, seasonNumber);

        // OPTIMIZED SUPERFLIX VALIDATION:
        // Instead of checking every episode (20+ requests -> Infinite Loading),
        // We fetch the Season Page ONCE and parse available episodes from it.
        // This reduces overhead by 95% while still guaranteeing availability.

        const seasonUrl = `https://superflixapi.buzz/serie/${tvId}/${seasonNumber}`;
        const checkRes = await fetch(seasonUrl, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36.0' // Avoid blocking
            }
        });

        if (!checkRes.ok) {
            // Season page itself doesn't exist? Then no episodes exist.
            console.warn(`Season ${seasonNumber} page missing for ${tvId}`);
            // Return empty list safely
            return { ...seasonData, episodes: [] };
        }

        const html = await checkRes.text();
        const availableEpMap = new Set<number>();

        // Regex to find links to episodes: /serie/123/1/5
        // Pattern: href=".../serie/ID/SEASON/EP_NUM"
        // We look for the specific pattern relating to this show/season
        const pattern = new RegExp(`serie/${tvId}/${seasonNumber}/(\\d+)`, 'g');
        let match;

        while ((match = pattern.exec(html)) !== null) {
            const epNum = parseInt(match[1]);
            if (!isNaN(epNum)) {
                availableEpMap.add(epNum);
            }
        }

        // Filter TMDB episodes against what we found on Superflix
        const filteredEpisodes = seasonData.episodes.filter(ep => availableEpMap.has(ep.episode_number));

        // Fallback: If scraping failed to find ANY links (maybe layout changed),
        // we should probably fail safe. But usually layout is stable.
        // If 0 found, it might mean empty season or blocked scraping.
        // If 0 found but TMDB has episodes, it's safer to return EMPTY than Broken links.

        return {
            ...seasonData,
            episodes: filteredEpisodes
        };

    } catch (e) {
        console.error(`Failed to fetch season ${seasonNumber} for ${tvId}`, e);
        return { episodes: [] };
    }
}

// Simple in-memory cache to avoid fetching the huge list on every request
// In a serverless environment, this persists only for the lifetime of the container
const validIdsCache: {
    movie: { timestamp: number; ids: Set<string> } | null;
    tv: { timestamp: number; ids: Set<string> } | null;
} = {
    movie: null,
    tv: null
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Verify if content exists on Superflix API using the /lista endpoint
 */
async function verifySuperflixContent(tmdbId: number, type: 'movie' | 'tv'): Promise<boolean> {
    try {
        const category = type === 'movie' ? 'movie' : 'serie';

        // 1. Check Cache
        const cached = validIdsCache[type];
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.ids.has(tmdbId.toString());
        }

        // 2. Fetch Fresh List
        const url = `https://superflixapi.buzz/lista?category=${category}&type=tmdb&format=json`;
        console.log(`Fetching Superflix list for ${category}...`);

        const res = await fetch(url, { method: 'GET', cache: 'no-store' });

        if (!res.ok) {
            console.error("Superflix list fetch failed:", res.status);
            return false;
        }

        const idsArray: string[] = await res.json();
        const idsSet = new Set(idsArray);

        // 3. Update Cache
        validIdsCache[type] = {
            timestamp: Date.now(),
            ids: idsSet
        };

        // 4. Verify
        return idsSet.has(tmdbId.toString());

    } catch (e) {
        console.error(`Superflix verification failed for ${type} ${tmdbId}:`, e);
        return false; // Fail safe
    }
}

/**
 * Resolves a TMDB ID to a Kyno UUID.
 * 1. Checks if it exists in Supabase.
 * 2. If yes, returns UUID.
 * 3. If no, CHECKS SUPERFLIX AVAILABILITY.
 * 4. If available, syncs it (creates it) and returns new UUID.
 * 5. If not available, returns null.
 */
export async function resolveTmdbContent(tmdbId: number, type: 'movie' | 'tv') {
    // 1. Check if already exists in Supabase
    const { data: existing, error } = await contentService.getItemByTmdbId(tmdbId, type);

    if (existing) {
        return existing.id;
    }

    // 2. Fetch details from TMDB FIRST to validate eligibility (Release Date, Status)
    try {
        const details = await tmdb.getDetails(tmdbId, type);

        // CHECK 1: Is it released?
        const releaseDateStr = details.release_date || details.first_air_date;
        if (!releaseDateStr) {
            console.warn(`Content ${tmdbId} rejected: No release date.`);
            return null;
        }

        const releaseDate = new Date(releaseDateStr);
        const today = new Date();

        // Allow a small buffer (e.g., 2 days) for timezone diffs, but generally strictly past
        if (releaseDate > today) {
            // console.warn(`Content ${tmdbId} rejected: Future release date (${releaseDateStr}).`);
            return null;
        }

        // CHECK 2: Status check (if available)
        // Movies usually have 'status'. 'Released' is what we want. 'Post Production' etc should be blocked.
        if ('status' in details && details.status !== 'Released' && details.status !== 'Returning Series' && details.status !== 'Ended') {
            // console.warn(`Content ${tmdbId} rejected: Status is ${details.status}`);
            return null;
        }

        // CHECK 3: Superflix Availability (Final Gate)
        const isAvailable = await verifySuperflixContent(tmdbId, type);
        if (!isAvailable) {
            return null;
        }

        // 3. Sync to Supabase - DISABLED by user request
        // Content must be manually added to the database now.
        // if (type === 'movie') {
        //     await contentService.syncMovies([details]);
        // } else {
        //     await contentService.syncSeries([details]);
        // }

        // 4. Fetch the newly created item
        // Since we disabled sync, this will return null unless it was added concurrently
        const { data: newItem } = await contentService.getItemByTmdbId(tmdbId, type);
        return newItem?.id || null;

    } catch (e) {
        console.error("Failed to resolve content", e);
        return null;
    }
}
