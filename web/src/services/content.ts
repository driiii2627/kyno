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
    logo_url?: string; // DB column is logo_url
}

// Interface for the combined data (Supabase ID + TMDB Metadata)
export interface CatalogItem extends Movie {
    video_url: string;
    supabase_id: string;
    logo_url?: string; // Passed from DB
    genre?: string;
    genres?: { id: number; name: string }[];
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
    async getMovieById(uuid: string): Promise<{ tmdb_id: number; video_url: string | null; trailer_url: string | null; show_trailer: boolean } | null> {
        const { data, error } = await supabase
            .from('movies')
            .select('tmdb_id, video_url, trailer_url, show_trailer')
            .eq('id', uuid)
            .single();

        if (error || !data) return null;
        return { tmdb_id: data.tmdb_id, video_url: data.video_url, trailer_url: data.trailer_url, show_trailer: data.show_trailer };
    },

    /**
     * Get a single series by UUID
     */
    async getSeriesById(uuid: string): Promise<{ tmdb_id: number; video_url: string | null; trailer_url: string | null; show_trailer: boolean } | null> {
        const { data, error } = await supabase
            .from('series')
            .select('tmdb_id, video_url, trailer_url, show_trailer')
            .eq('id', uuid)
            .single();

        if (error || !data) return null;
        return { tmdb_id: data.tmdb_id, video_url: data.video_url, trailer_url: data.trailer_url, show_trailer: data.show_trailer };
    },

    /**
     * Generic lookup to find item by UUID in either table
     */
    async getItemByUuid(uuid: string): Promise<{ type: 'movie' | 'tv'; tmdb_id: number; video_url: string | null; trailer_url: string | null; show_trailer: boolean } | null> {
        // Run both checks in parallel
        const [movie, series] = await Promise.all([
            this.getMovieById(uuid),
            this.getSeriesById(uuid)
        ]);

        if (movie) return { type: 'movie', ...movie };
        if (series) return { type: 'tv', ...series };

        return null;
    },

    /**
    * Find item by TMDB ID
    */
    async getItemByTmdbId(tmdbId: number, type: 'movie' | 'tv'): Promise<{ data: { id: string } | null, error: any }> {
        const table = type === 'movie' ? 'movies' : 'series';

        const { data, error } = await supabase
            .from(table)
            .select('id')
            .eq('tmdb_id', tmdbId)
            .single();

        return { data, error };
    },

    /**
     * Syncs a list of TMDB movies to Supabase
     * Uses Service Role to bypass RLS for inserts
     */
    async syncMovies(movies: Movie[]) {
        // DISABLED by User Request. 
        // Automatic syncing prevents deletion of content.
        return;
    },

    /**
     * Syncs a list of TMDB series to Supabase
     */
    async syncSeries(series: Movie[]) {
        // DISABLED by User Request. 
        return;
    },

    /**
     * Get all movies from the catalog (Fast - DB Only)
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

        if (!dbMovies) return [];

        // Map directly from DB columns to CatalogItem interface
        return dbMovies.map((dbMovie: SupabaseContent) => ({
            id: dbMovie.tmdb_id,
            title: dbMovie.title || 'Sem Título',
            poster_path: dbMovie.poster_url,
            backdrop_path: dbMovie.backdrop_url,
            overview: dbMovie.description,
            vote_average: dbMovie.rating || 0,
            release_date: dbMovie.release_year?.toString(),
            video_url: dbMovie.video_url,
            supabase_id: dbMovie.id,
            genre: dbMovie.genre,
            // Construct a fake genre object if needed by UI, or just rely on 'genre' string
            genres: dbMovie.genre ? [{ id: 0, name: dbMovie.genre }] : [],
            duration: dbMovie.duration,
            logo_url: dbMovie.logo_url
        })) as CatalogItem[];
    },

    /**
     * Get all series from the catalog (Fast - DB Only)
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

        if (!dbSeries) return [];

        return dbSeries.map((dbSeriesItem: SupabaseContent) => ({
            id: dbSeriesItem.tmdb_id,
            name: dbSeriesItem.title || 'Sem Título',
            title: dbSeriesItem.title || 'Sem Título',
            poster_path: dbSeriesItem.poster_url,
            backdrop_path: dbSeriesItem.backdrop_url,
            overview: dbSeriesItem.description,
            vote_average: dbSeriesItem.rating || 0,
            first_air_date: dbSeriesItem.release_year?.toString(),
            video_url: dbSeriesItem.video_url,
            supabase_id: dbSeriesItem.id,
            genre: dbSeriesItem.genre,
            genres: dbSeriesItem.genre ? [{ id: 0, name: dbSeriesItem.genre }] : [],
            logo_url: dbSeriesItem.logo_url
        })) as CatalogItem[];
    }
};
