'use server';

import { supabase, getServiceSupabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';

/**
 * Temporary maintenance action to fix low-quality image paths in Supabase.
 * It iterates through all movies/series, fetches fresh data from TMDB, 
 * and updates the backdrop_url/poster_url with the RAW path (e.g., /abc.jpg).
 */
export async function repairImagePaths() {
    console.log("Starting Image Repair...");
    const admin = getServiceSupabase();

    // 1. Repair Movies
    const { data: movies } = await admin.from('movies').select('*');
    if (movies) {
        console.log(`Found ${movies.length} movies to check.`);
        for (const m of movies) {
            try {
                // Fetch fresh details to get the raw path
                const details = await tmdb.getDetails(m.tmdb_id, 'movie');

                // Update with raw paths (no full URL)
                if (details.backdrop_path || details.poster_path) {
                    await admin.from('movies').update({
                        backdrop_url: details.backdrop_path, // Store /path.jpg
                        poster_url: details.poster_path      // Store /path.jpg
                    }).eq('id', m.id);
                }
            } catch (e) {
                console.error(`Failed to repair movie ${m.tmdb_id}`, e);
            }
        }
    }

    // 2. Repair Series
    const { data: series } = await admin.from('series').select('*');
    if (series) {
        console.log(`Found ${series.length} series to check.`);
        for (const s of series) {
            try {
                const details = await tmdb.getDetails(s.tmdb_id, 'tv');

                if (details.backdrop_path || details.poster_path) {
                    await admin.from('series').update({
                        backdrop_url: details.backdrop_path,
                        poster_url: details.poster_path
                    }).eq('id', s.id);
                }
            } catch (e) {
                console.error(`Failed to repair series ${s.tmdb_id}`, e);
            }
        }
    }

    console.log("Image Repair Complete.");
    return { success: true };
}
