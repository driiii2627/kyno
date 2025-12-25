import { supabase } from '@/lib/supabase';
import { tmdb, Movie, MovieDetails } from './tmdb';

// Interface matching the Supabase table structure
export interface SupabaseContent {
    id: string;
    tmdb_id: number;
    video_url: string;
    // ... other fields are largely optional backups, we mostly use TMDB data for display
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
     * Get all movies from the catalog
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

        // Hydrate with TMDB data
        // We do this in parallel, but be mindful of rate limits if the catalog gets huge.
        // For a small catalog (<50 items), Promise.all is fine.
        const hydratedMovies = await Promise.all(
            dbMovies.map(async (dbMovie: SupabaseContent) => {
                try {
                    const tmdbDetails = await tmdb.getDetails(dbMovie.tmdb_id, 'movie');
                    return {
                        ...tmdbDetails, // TMDB data overrides backup data
                        video_url: dbMovie.video_url,
                        supabase_id: dbMovie.id,
                        // Ensure ID used in UI is usually TMDB ID for routing, 
                        // but we keep supabase_id if needed for backend ops
                        id: dbMovie.tmdb_id
                    } as CatalogItem;
                } catch (e) {
                    console.error(`Failed to hydrate movie ${dbMovie.tmdb_id}`, e);
                    return null;
                }
            })
        );

        // Filter out any failures
        return hydratedMovies.filter((m): m is CatalogItem => m !== null);
    },

    /**
     * Get all series from the catalog
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
                    const tmdbDetails = await tmdb.getDetails(dbSeriesItem.tmdb_id, 'tv');
                    return {
                        ...tmdbDetails,
                        video_url: dbSeriesItem.video_url,
                        supabase_id: dbSeriesItem.id,
                        id: dbSeriesItem.tmdb_id
                    } as CatalogItem;
                } catch (e) {
                    console.error(`Failed to hydrate series ${dbSeriesItem.tmdb_id}`, e);
                    return null;
                }
            })
        );

        return hydratedSeries.filter((s): s is CatalogItem => s !== null);
    }
};
