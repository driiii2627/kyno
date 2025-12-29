'use server';

import { tmdb, TmdbDetails } from '@/services/tmdb';
import { superflix } from '@/services/superflix';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Searches TMDB and checks availability for each result.
 */
export async function searchContentAction(query: string) {
    if (!query) return { results: [] };

    try {
        const data = await tmdb.searchMulti(query);

        // Filter out "person" and items without poster/backdrop (usually junk)
        const validResults = data.results.filter(item =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            item.poster_path // Only show items with images
        );

        // Enhance with Superflix status (Parallel)
        const enhancedResults = await Promise.all(validResults.map(async (item) => {
            const type = item.media_type as 'movie' | 'tv';
            const { available, reason } = await superflix.checkAvailability(item.id, type);

            // Also check if we already have it in OUR database
            const admin = await createAdminClient();
            const { data: existing } = await admin
                .from(type === 'movie' ? 'movies' : 'series')
                .select('id')
                .eq('tmdb_id', item.id)
                .single();

            return {
                ...item,
                is_available: available,
                availability_reason: reason,
                is_in_library: !!existing
            };
        }));

        return { results: enhancedResults };

    } catch (err: any) {
        console.error('Search error:', err);
        return { error: 'Failed to search content.' };
    }
}

/**
 * Imports a single Movie or TV Show into Supabase.
 */
export async function importContentAction(tmdbId: number, type: 'movie' | 'tv') {
    try {
        // 1. Validate Availability again (Security)
        const { available } = await superflix.checkAvailability(tmdbId, type);
        if (!available) throw new Error('Este conteúdo não está disponível na API externa.');

        // 2. Fetch Full Details
        const details = await tmdb.getDetails(tmdbId, type);
        const images = await tmdb.getImages(tmdbId, type);

        // Determine Logo (find first PNG in PT, then EN, then any)
        const logoPath = images.logos.find(l => l.iso_639_1 === 'pt')?.file_path ||
            images.logos.find(l => l.iso_639_1 === 'en')?.file_path ||
            images.logos[0]?.file_path || null;

        const admin = await createAdminClient();

        if (type === 'movie') {
            const { error } = await admin.from('movies').upsert({
                tmdb_id: details.id,
                title: details.title,
                description: details.overview,
                poster_url: details.poster_path,
                backdrop_url: details.backdrop_path,
                logo_url: logoPath,
                release_year: details.release_date ? parseInt(details.release_date.split('-')[0]) : null,
                rating: details.vote_average,
                created_at: new Date().toISOString()
            }, { onConflict: 'tmdb_id' });

            if (error) throw error;

        } else {
            // SERIES IMPORT
            // Insert Series
            const { data: seriesData, error: seriesError } = await admin.from('series').upsert({
                tmdb_id: details.id,
                title: details.name,
                description: details.overview,
                poster_url: details.poster_path,
                backdrop_url: details.backdrop_path,
                logo_url: logoPath,
                release_year: details.first_air_date ? parseInt(details.first_air_date.split('-')[0]) : null,
                rating: details.vote_average,
                created_at: new Date().toISOString()
            }, { onConflict: 'tmdb_id' }).select().single();

            if (seriesError) throw seriesError;

            // Insert Seasons & Episodes (Iterate)
            if (details.seasons) {
                for (const season of details.seasons) {
                    if (season.season_number === 0) continue; // Skip specials usually

                    // Insert Season
                    const { data: seasonRect, error: seasonError } = await admin.from('seasons').upsert({
                        series_id: seriesData.id,
                        tmdb_id: season.id,
                        number: season.season_number,
                        title: season.name,
                        overview: season.overview,
                        poster_url: season.poster_path
                    }, { onConflict: 'tmdb_id' }).select().single();

                    if (seasonError) {
                        console.error('Error saving season', season.season_number, seasonError);
                        continue;
                    }

                    // Fetch Episodes for this season
                    const seasonDetails = await tmdb.getSeasonDetails(details.id, season.season_number);
                    if (seasonDetails.episodes) {
                        const episodesToInsert = seasonDetails.episodes.map((ep: any) => ({
                            season_id: seasonRect.id,
                            tmdb_id: ep.id,
                            number: ep.episode_number,
                            title: ep.name,
                            overview: ep.overview,
                            still_url: ep.still_path,
                            duration: ep.runtime
                        }));

                        const { error: epsError } = await admin.from('episodes').upsert(episodesToInsert, { onConflict: 'tmdb_id' });
                        if (epsError) console.error('Error saving episodes', epsError);
                    }
                }
            }
        }

        revalidatePath('/'); // Refresh UI
        return { success: true };

    } catch (err: any) {
        console.error('Import error:', err);
        return { error: err.message || 'Unknown Import Error' };
    }
}

/**
 * Imports an entire collection (Franchise).
 */
export async function importCollectionAction(collectionId: number) {
    try {
        const collection = await tmdb.getCollection(collectionId);

        let successCount = 0;
        let failCount = 0;

        for (const part of collection.parts) {
            // 1. Check availability
            const { available } = await superflix.checkAvailability(part.id, 'movie'); // Collections are usually movies

            if (available) {
                const res = await importContentAction(part.id, 'movie');
                if (res.success) successCount++;
                else failCount++;
            } else {
                failCount++; // Skipped
            }
        }

        return { success: true, count: successCount, skipped: failCount };

    } catch (err: any) {
        return { error: err.message };
    }
}

/**
 * Fetches all movies and series from the library.
 */
export async function getLibraryContent() {
    try {
        const admin = await createAdminClient();

        // Fetch movies
        const { data: movies, error: moviesError } = await admin
            .from('movies')
            .select('id, tmdb_id, title, poster_url, release_year, created_at')
            .order('created_at', { ascending: false });

        // Fetch series
        const { data: series, error: seriesError } = await admin
            .from('series')
            .select('id, tmdb_id, title, poster_url, release_year, created_at')
            .order('created_at', { ascending: false });

        if (moviesError) throw moviesError;
        if (seriesError) throw seriesError;

        // Combine and normalize
        const library = [
            ...(movies || []).map(m => ({ ...m, media_type: 'movie' })),
            ...(series || []).map(s => ({ ...s, media_type: 'tv' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return { data: library };

    } catch (err: any) {
        console.error('Error fetching library:', err);
        return { error: err.message };
    }
}
