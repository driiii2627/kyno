import { supabase, getServiceSupabase } from '@/lib/supabase';
import { tmdb, Movie, MovieDetails } from './tmdb';

// Interface matching the Supabase table structure
export interface SupabaseContent {
    id: string;
    tmdb_id: number;
    video_url: string;
    title?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    vote_average?: number;
    created_at: string;
}

// Interface for the combined data (Supabase ID + TMDB Metadata)
export interface CatalogItem extends Movie {
    video_url: string;
    supabase_id: string;
}

/**
 * Service to manage content from Supabase Catalog
 */
export const contentService = {
    /**
     * Syncs a list of TMDB movies to Supabase
     * Uses Service Role to bypass RLS for inserts
     */
    async syncMovies(movies: Movie[]) {
        if (!movies.length) return;

        try {
            const adminClient = getServiceSupabase();
            const payload = movies.map(m => {
                let year = new Date().getFullYear();
                const dateStr = m.release_date || m.first_air_date;
                if (dateStr) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
                }

                return {
                    tmdb_id: m.id,
                    video_url: '',
                    title: m.title || m.name,
                    description: m.overview || '',
                    poster_url: m.poster_path,
                    backdrop_url: m.backdrop_path,
                    release_year: year,
                    rating: m.vote_average,
                    type: 'movie'
                };
            });

            const { error } = await adminClient
                .from('movies')
                .upsert(payload, { onConflict: 'tmdb_id', ignoreDuplicates: false });

            if (error) console.error("Sync Movies Error:", error);
        } catch (e) {
            console.error("Sync Movies Exception:", e);
        }
    },

    /**
     * Syncs a list of TMDB series to Supabase
     */
    async syncSeries(series: Movie[]) {
        if (!series.length) return;

        try {
            const adminClient = getServiceSupabase();
            const payload = series.map(s => {
                let year = new Date().getFullYear();
                const dateStr = s.first_air_date || s.release_date;
                if (dateStr) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
                }

                return {
                    tmdb_id: s.id,
                    video_url: '',
                    title: s.name || s.title,
                    description: s.overview || '',
                    poster_url: s.poster_path,
                    backdrop_url: s.backdrop_path,
                    release_year: year,
                    rating: s.vote_average
                };
            });

            const { error } = await adminClient
                .from('series')
                .upsert(payload, { onConflict: 'tmdb_id', ignoreDuplicates: false });

            if (error) console.error("Sync Series Error:", error);
        } catch (e) {
            console.error("Sync Series Exception:", e);
        }
    },

    /**
     * Get all movies from the catalog (Hydrated)
     */
    async getCatalogMovies(): Promise<CatalogItem[]> {
        const { data: dbMovies, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching movies from Supabase:', error);
            return [];
        }

        if (!dbMovies || dbMovies.length === 0) return [];

        const hydratedMovies = await Promise.all(
            dbMovies.map(async (dbMovie: any) => {
                try {
                    // Try to fetch fresh from TMDB, fallback to DB if fail
                    const tmdbDetails = await tmdb.getDetails(dbMovie.tmdb_id, 'movie').catch(() => null);

                    if (tmdbDetails) {
                        return {
                            ...tmdbDetails,
                            video_url: dbMovie.video_url,
                            supabase_id: dbMovie.id,
                            id: dbMovie.tmdb_id
                        } as CatalogItem;
                    }

                    // Fallback using stored backup data if TMDB fails
                    return {
                        id: dbMovie.tmdb_id,
                        title: dbMovie.title,
                        poster_path: dbMovie.poster_url,
                        backdrop_path: dbMovie.backdrop_url,
                        overview: dbMovie.description,
                        vote_average: dbMovie.rating,
                        release_date: dbMovie.release_year?.toString(),
                        video_url: dbMovie.video_url,
                        supabase_id: dbMovie.id
                    } as CatalogItem;

                } catch (e) {
                    return null;
                }
            })
        );

        return hydratedMovies.filter((m): m is CatalogItem => m !== null);
    },

    /**
     * Get all series from the catalog (Hydrated)
     */
    async getCatalogSeries(): Promise<CatalogItem[]> {
        const { data: dbSeries, error } = await supabase
            .from('series')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching series from Supabase:', error);
            return [];
        }

        if (!dbSeries || dbSeries.length === 0) return [];

        const hydratedSeries = await Promise.all(
            dbSeries.map(async (dbSeriesItem: any) => {
                try {
                    const tmdbDetails = await tmdb.getDetails(dbSeriesItem.tmdb_id, 'tv').catch(() => null);

                    if (tmdbDetails) {
                        return {
                            ...tmdbDetails,
                            video_url: dbSeriesItem.video_url,
                            supabase_id: dbSeriesItem.id,
                            id: dbSeriesItem.tmdb_id
                        } as CatalogItem;
                    }

                    return {
                        id: dbSeriesItem.tmdb_id,
                        name: dbSeriesItem.title,
                        title: dbSeriesItem.title,
                        poster_path: dbSeriesItem.poster_url,
                        backdrop_path: dbSeriesItem.backdrop_url,
                        overview: dbSeriesItem.description,
                        vote_average: dbSeriesItem.rating,
                        first_air_date: dbSeriesItem.release_year?.toString(),
                        video_url: dbSeriesItem.video_url,
                        supabase_id: dbSeriesItem.id
                    } as CatalogItem;
                } catch (e) {
                    return null;
                }
            })
        );

        return hydratedSeries.filter((s): s is CatalogItem => s !== null);
    }
};
