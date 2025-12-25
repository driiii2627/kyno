import { supabase, getServiceSupabase } from '@/lib/supabase';
import { tmdb, Movie, MovieDetails } from './tmdb';

// Interface matching the ACTUAL Supabase table structure (Database Schema)
export interface SupabaseContent {
    id: string;
    tmdb_id: number;
    video_url: string;
    title?: string;
    description?: string; // DB column is description, not overview
    poster_url?: string;  // DB column is poster_url
    backdrop_url?: string; // DB column is backdrop_url
    release_year?: number; // DB column is release_year
    rating?: number;       // DB column is rating
    genre?: string;
    duration?: number;
    created_at: string;
}

// Interface for the combined data (Supabase ID + TMDB Metadata)
export interface CatalogItem extends Movie {
    video_url: string;
    supabase_id: string;
    genre?: string;
    duration?: number;
}

/**
 * Service to manage content from Supabase Catalog
 */
export const contentService = {

    /**
     * Get a config value from app_config table
     */
    async getAppConfig(key: string, defaultValue: string): Promise<string> {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', key)
                .single();

            if (error || !data) {
                // Return default if not found or error
                return defaultValue;
            }
            return data.value;
        } catch (e) {
            console.error(`Failed to fetch config for ${key}`, e);
            return defaultValue;
        }
    },

    /**
     * Get a single movie by UUID (Lightweight lookup for Player)
     */
    async getMovieById(uuid: string): Promise<{ tmdb_id: number } | null> {
        const { data, error } = await supabase
            .from('movies')
            .select('tmdb_id')
            .eq('id', uuid)
            .single();

        if (error || !data) return null;
        return { tmdb_id: data.tmdb_id };
    },

    /**
     * Get a single series by UUID
     */
    async getSeriesById(uuid: string): Promise<{ tmdb_id: number } | null> {
        const { data, error } = await supabase
            .from('series')
            .select('tmdb_id')
            .eq('id', uuid)
            .single();

        if (error || !data) return null;
        return { tmdb_id: data.tmdb_id };
    },

    /**
     * Syncs a list of TMDB movies to Supabase
     * Uses Service Role to bypass RLS for inserts
     */
    async syncMovies(movies: Movie[]) {
        if (!movies.length) return;

        try {
            const adminClient = getServiceSupabase();
            const payload = movies.map(m => {
                let year = 2025;
                const dateStr = m.release_date || m.first_air_date;
                if (dateStr) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
                }

                const details = m as MovieDetails;
                const genreStr = details.genres ? details.genres.map(g => g.name).join(', ') : '';
                const duration = details.runtime || 0;

                return {
                    tmdb_id: m.id,
                    video_url: '',
                    title: m.title || m.name || 'Sem Título',
                    description: m.overview || '',
                    poster_url: m.poster_path || '',
                    backdrop_url: m.backdrop_path || '',
                    release_year: year,
                    rating: typeof m.vote_average === 'number' ? m.vote_average : 0,
                    genre: genreStr,
                    duration: duration,
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
                let year = 2025;
                const dateStr = s.first_air_date || s.release_date;
                if (dateStr) {
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) year = parsed.getFullYear();
                }

                const details = s as MovieDetails;
                const genreStr = details.genres ? details.genres.map(g => g.name).join(', ') : '';

                return {
                    tmdb_id: s.id,
                    video_url: '',
                    title: s.name || s.title || 'Sem Título',
                    description: s.overview || '',
                    poster_url: s.poster_path || '',
                    backdrop_url: s.backdrop_path || '',
                    release_year: year,
                    rating: typeof s.vote_average === 'number' ? s.vote_average : 0,
                    genre: genreStr
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
            dbMovies.map(async (dbMovie: SupabaseContent) => {
                try {
                    // Try to fetch fresh from TMDB, fallback to DB if fail
                    const tmdbDetails = await tmdb.getDetails(dbMovie.tmdb_id, 'movie').catch(() => null);

                    if (tmdbDetails) {
                        return {
                            ...tmdbDetails,
                            video_url: dbMovie.video_url,
                            supabase_id: dbMovie.id,
                            id: dbMovie.tmdb_id,
                            // Ideally, keep DB ID/URL logic
                        } as CatalogItem;
                    }

                    // Fallback using stored backup data
                    return {
                        id: dbMovie.tmdb_id,
                        title: dbMovie.title,
                        poster_path: dbMovie.poster_url,  // Correct property mapping
                        backdrop_path: dbMovie.backdrop_url, // Correct property mapping
                        overview: dbMovie.description,    // Correct property mapping
                        vote_average: dbMovie.rating || 0, // Correct property mapping
                        release_date: dbMovie.release_year?.toString(),
                        video_url: dbMovie.video_url,
                        supabase_id: dbMovie.id,
                        genre_ids: [], // Fallback
                    } as CatalogItem;

                } catch (e) {
                    console.error("Hydration failed for", dbMovie.tmdb_id);
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
            dbSeries.map(async (dbSeriesItem: SupabaseContent) => {
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
                        vote_average: dbSeriesItem.rating || 0,
                        first_air_date: dbSeriesItem.release_year?.toString(),
                        video_url: dbSeriesItem.video_url,
                        supabase_id: dbSeriesItem.id,
                        genre_ids: [], // Fallback
                    } as CatalogItem;
                } catch (e) {
                    return null;
                }
            })
        );

        return hydratedSeries.filter((s): s is CatalogItem => s !== null);
    }
};
