/**
 * Superflix API Service
 * Handles verification of content availability on the external provider.
 */

// Simple in-memory cache to avoid spamming the external API
const validIdsCache: {
    movie: { timestamp: number; ids: Set<string> } | null;
    serie: { timestamp: number; ids: Set<string> } | null;
    anime: { timestamp: number; ids: Set<string> } | null;
} = {
    movie: null,
    serie: null,
    anime: null
};

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

async function getCachedIds(category: 'movie' | 'serie' | 'anime'): Promise<Set<string>> {
    const cached = validIdsCache[category];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        return cached.ids;
    }

    // Fetch fresh
    const url = `https://superflixapi.buzz/lista?category=${category}&type=tmdb&format=json`;
    // console.log(`[Superflix] Fetching list for ${category}...`);

    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const idsArray: string[] = await res.json();
    const idsSet = new Set(idsArray.map(id => id.toString())); // Ensure strings

    validIdsCache[category] = {
        timestamp: Date.now(),
        ids: idsSet
    };

    return idsSet;
}

export const superflix = {
    /**
     * Checks if a TMDB ID exists in the Superflix library.
     */
    checkAvailability: async (tmdbId: number, type: 'movie' | 'tv'): Promise<{ available: boolean, reason?: string }> => {
        try {
            const idStr = tmdbId.toString();

            if (type === 'movie') {
                const movies = await getCachedIds('movie');
                if (movies.has(idStr)) return { available: true };
                return { available: false, reason: 'Filme não encontrado no catálogo externo.' };
            }

            if (type === 'tv') {
                // Check Series AND Anime (animations like Rick and Morty are often here)
                const series = await getCachedIds('serie');
                if (series.has(idStr)) return { available: true };

                const animes = await getCachedIds('anime');
                if (animes.has(idStr)) return { available: true };

                return { available: false, reason: 'Série/Anime não encontrado no catálogo externo.' };
            }

            return { available: false, reason: 'Tipo de mídia inválido.' };

        } catch (e: any) {
            console.error(`[Superflix Error] ${type} ${tmdbId}:`, e);
            return { available: false, reason: e.message || 'Unknown Error' };
        }
    }
};
