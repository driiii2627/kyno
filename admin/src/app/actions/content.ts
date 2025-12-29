'use server';

import { tmdb, TmdbDetails, TmdbMovie } from '@/services/tmdb';
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
 * Fetches popular and trending content for Discovery Mode.
 */
export async function getPopularContentAction() {
    try {
        const [
            trendingDay,
            trendingWeek,
            popularMovies,
            popularSeries,
            topRatedMovies
        ] = await Promise.all([
            tmdb.getTrending('all', 'day'),
            tmdb.getTrending('all', 'week'),
            tmdb.getList('movie', 'popular'),
            tmdb.getList('tv', 'popular'),
            tmdb.getList('movie', 'top_rated')
        ]);

        // Helper to process availability in parallel for a list
        const processList = async (list: TmdbMovie[]) => {
            // Limit to top 15 to avoid massive API spam
            const top15 = list.slice(0, 15);
            return Promise.all(top15.map(async (item) => {
                const type = item.media_type || (item.title ? 'movie' : 'tv');
                // Availability check (optional for discovery speed, maybe check only on interaction? 
                // User asked for "Check Superflix". We should check availability but it might be slow for 5 lists * 15 items = 75 requests.
                // Creating a simplified check or parallelizing heavily.

                // Let's do a fast check or just skip availability for the list view until click?
                // The prompt implies we use the same system. I will check availability but maybe LIMIT concurrency if needed.
                // ContentManager already handles lists well. Let's try full check. `superflix.ts` has cache!

                const { available } = await superflix.checkAvailability(item.id, type as 'movie' | 'tv');

                // Check Library
                const admin = await createAdminClient();
                const { data: existing } = await admin
                    .from(type === 'movie' ? 'movies' : 'series')
                    .select('id')
                    .eq('tmdb_id', item.id)
                    .single();

                return {
                    ...item,
                    media_type: type, // Ensure media_type is set
                    is_available: available,
                    is_in_library: !!existing
                };
            }));
        };

        const [
            trendingDayProcessed,
            trendingWeekProcessed,
            popularMoviesProcessed,
            popularSeriesProcessed,
            topRatedMoviesProcessed
        ] = await Promise.all([
            processList(trendingDay.results),
            processList(trendingWeek.results),
            processList(popularMovies.results),
            processList(popularSeries.results),
            processList(topRatedMovies.results)
        ]);

        return {
            data: {
                trendingDay: trendingDayProcessed,
                trendingWeek: trendingWeekProcessed,
                popularMovies: popularMoviesProcessed,
                popularSeries: popularSeriesProcessed,
                topRatedMovies: topRatedMoviesProcessed
            }
        };

    } catch (err: any) {
        console.error('Popular Content Error:', err);
        return { error: 'Failed to fetch popular content.' };
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

        // 3. Get Base URL from App Config
        const { data: configData } = await admin
            .from('app_config')
            .select('value')
            .eq('key', 'superflix_base_url')
            .single();

        const baseUrl = configData?.value || 'https://superflixapi.buzz';
        const videoUrl = `${baseUrl}/${type === 'movie' ? 'filme' : 'serie'}/${details.id}`;

        if (type === 'movie') {
            const { error } = await admin.from('movies').upsert({
                tmdb_id: details.id,
                title: details.title,
                description: details.overview,
                poster_url: details.poster_path,
                backdrop_url: details.backdrop_path,
                logo_url: logoPath,
                video_url: videoUrl, // Added video_url
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
                video_url: videoUrl, // Added video_url
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
                            duration: ep.runtime,
                            video_url: `${baseUrl}/serie/${details.id}/${season.season_number}/${ep.episode_number}` // Construct episode URL too if needed, or leave null if not required. Assuming movie/series main video_url is what triggered the error.
                        }));

                        // Check if episodes table requires video_url. The error was on 'movies' relation using video_url.
                        // Safe to assume episodes might utilize it too or just the main movie link. 
                        // User only specified movie and series formats. I will leave episodes alone unless it errors, 
                        // but to be safe I'll assume only movies/series table was the strict one for now.
                        // Actuallly, for series, the "watch" link usually points to specific episodes? 
                        // The user prompt said: "serie: .../[id]". This usually implies the main page.
                        // I will stick to fixing the REPORTED error on 'movies' and adding it to 'series' main entry.

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
/**
 * Fetches collection details with status for each part.
 */
export async function getCollectionDetailsAction(collectionId: number) {
    try {
        const collection = await tmdb.getCollection(collectionId);

        // Enhance parts with status (Parallel)
        const partsWithStatus = await Promise.all(collection.parts.map(async (part: any) => {
            // 1. Check Availability
            const { available } = await superflix.checkAvailability(part.id, 'movie');

            // 2. Check Library
            const admin = await createAdminClient();
            const { data: existing } = await admin
                .from('movies')
                .select('id')
                .eq('tmdb_id', part.id)
                .single();

            // 3. Get proper poster (sometimes parts have missing posters in collection view?)
            // Usually they are fine, but good to ensure.

            return {
                ...part,
                media_type: 'movie',
                is_available: available,
                is_in_library: !!existing
            };
        }));

        // Sort by release date
        partsWithStatus.sort((a, b) =>
            new Date(a.release_date || '9999-01-01').getTime() - new Date(b.release_date || '9999-01-01').getTime()
        );

        return {
            data: {
                ...collection,
                parts: partsWithStatus
            }
        };

    } catch (err: any) {
        console.error('Get Collection error:', err);
        return { error: err.message };
    }
}

/**
 * Imports specific items from a collection (or all).
 * Now accepts a list of IDs to import for better control.
 */
export async function importCollectionAction(itemsToImport: { id: number, type: 'movie' | 'tv' }[]) {
    try {
        let successCount = 0;
        let failCount = 0;

        for (const item of itemsToImport) {
            const res = await importContentAction(item.id, item.type);
            if (res.success) successCount++;
            else failCount++;
        }

        revalidatePath('/');
        return { success: true, count: successCount, failed: failCount };

    } catch (err: any) {
        return { error: err.message };
    }
}

/**
 * Fetches details for a single item to check for collections etc.
 */
export async function getItemDetailsAction(tmdbId: number, type: 'movie' | 'tv') {
    try {
        const details = await tmdb.getDetails(tmdbId, type);
        return { data: details };
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
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch series
        const { data: series, error: seriesError } = await admin
            .from('series')
            .select('*')
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

/**
 * Deletes content from the database.
 */
export async function deleteContentAction(id: number, type: 'movie' | 'tv') {
    try {
        const admin = await createAdminClient();
        const table = type === 'movie' ? 'movies' : 'series';

        const { error } = await admin.from(table).delete().eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        console.error('Delete error:', err);
        return { error: err.message };
    }
}

/**
 * Updates content fields manually.
 */
export async function updateContentAction(id: number, type: 'movie' | 'tv', data: any) {
    try {
        const admin = await createAdminClient();
        const table = type === 'movie' ? 'movies' : 'series';

        const { error } = await admin.from(table).update({
            title: data.title,
            description: data.description,
            poster_url: data.poster_url,
            backdrop_url: data.backdrop_url,
            logo_url: data.logo_url,
            video_url: data.video_url
        }).eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        console.error('Update error:', err);
        return { error: err.message };
    }
}

/**
 * Syncs content with latest TMDB data.
 */
export async function syncContentAction(id: number, type: 'movie' | 'tv', tmdbId: number) {
    try {
        // 1. Fetch fresh details
        const details = await tmdb.getDetails(tmdbId, type);
        const images = await tmdb.getImages(tmdbId, type);

        // 2. Resolve Logo (PT > EN > Any)
        const logoPath = images.logos.find(l => l.iso_639_1 === 'pt')?.file_path ||
            images.logos.find(l => l.iso_639_1 === 'en')?.file_path ||
            images.logos[0]?.file_path || null;

        const admin = await createAdminClient();
        const table = type === 'movie' ? 'movies' : 'series';

        // 3. Update fields (smart update, keeping custom video_url?)
        // User requested: "caso atualize uma capa, banner etc.." -> usually implies visual refresh.
        // We will update visual fields but keep critical ones like video_url if users customized them?
        // Actually, user said "sync with tmdb... in case cover updates".
        // Use standard upsert logic but targeting ID.

        const { error } = await admin.from(table).update({
            title: details.name || details.title, // Handle TV vs Movie naming
            description: details.overview,
            poster_url: details.poster_path,
            backdrop_url: details.backdrop_path,
            logo_url: logoPath,
            release_year: (details.first_air_date || details.release_date || '').split('-')[0] || null,
            rating: details.vote_average,
            // NOT updating video_url to avoid breaking custom links
        }).eq('id', id);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };

    } catch (err: any) {
        console.error('Sync error:', err);
        return { error: err.message };
    }
}
