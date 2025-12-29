/**
 * Superflix API Service
 * Handles verification of content availability on the external provider.
 */

// Simple in-memory cache to avoid spamming the external API
const validIdsCache: {
    movie: { timestamp: number; ids: Set<string> } | null;
    tv: { timestamp: number; ids: Set<string> } | null;
} = {
    movie: null,
    tv: null
};

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export const superflix = {
    /**
     * Checks if a TMDB ID exists in the Superflix library.
     */
    checkAvailability: async (tmdbId: number, type: 'movie' | 'tv'): Promise<{ available: boolean, reason?: string }> => {
        try {
            const category = type === 'movie' ? 'movie' : 'serie';

            // 1. Check Cache
            const cached = validIdsCache[type];
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                if (cached.ids.has(tmdbId.toString())) {
                    return { available: true };
                }
            }

            // If not in cache (or cache expired), fetch fresh list
            // Optimization: If cache is valid but ID not found, it's likely actually unavailable. 
            // EXCEPT if it was added *very* recently.
            // For Safety in Admin: We can force refresh or just trust cache for 30mins.
            if (!cached || (Date.now() - cached.timestamp >= CACHE_DURATION)) {
                const url = `https://superflixapi.buzz/lista?category=${category}&type=tmdb&format=json`;
                // console.log(`[Superflix] Fetching list for ${category}...`);

                const res = await fetch(url, { method: 'GET', cache: 'no-store' });

                if (!res.ok) {
                    return { available: false, reason: `API Error: ${res.status}` };
                }

                const idsArray: string[] = await res.json();
                const idsSet = new Set(idsArray);

                // Update Cache
                validIdsCache[type] = {
                    timestamp: Date.now(),
                    ids: idsSet
                };
            }

            // Re-check after cache update
            const isAvailable = validIdsCache[type]?.ids.has(tmdbId.toString());

            if (isAvailable) return { available: true };
            return { available: false, reason: 'Not found in external catalog' };

        } catch (e: any) {
            console.error(`[Superflix Error] ${type} ${tmdbId}:`, e);
            return { available: false, reason: e.message || 'Unknown Error' };
        }
    }
};
