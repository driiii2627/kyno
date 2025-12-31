
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin'; // Use Admin client for updates
import { tmdb } from '@/services/tmdb';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend timeout to 60s if possible (Vercel Pro)

export async function GET() {
    try {
        console.log('[GenreSync] Starting sync...');

        // 1. Fetch items with NULL genre
        // We check 'movies' and 'series' tables. Assuming 'catalog' is a view or individual tables?
        // Based on user screenshot, likely 'movies' and 'series' tables.

        // Let's assume separate tables as per standard Kyno structure, or 'content' table?
        // Service uses 'getCatalogMovies', likely distinct tables.

        const { data: movies, error: mError } = await supabaseAdmin
            .from('movies')
            .select('id, tmdb_id')
            .is('genre', null)
            .limit(100); // Process 100 at a time to be safe

        if (mError) throw mError;

        console.log(`[GenreSync] Found ${movies?.length || 0} movies without genre.`);

        let updatedCount = 0;

        // 2. Process Movies
        if (movies && movies.length > 0) {
            await Promise.all(movies.map(async (m) => {
                try {
                    const details = await tmdb.getMovieDetails(m.tmdb_id);
                    if (details && details.genres) {
                        const genreString = details.genres.map((g: any) => g.name).join(', ');

                        await supabaseAdmin
                            .from('movies')
                            .update({
                                genre: genreString,
                                genres: details.genres // Store JSON array too if column exists
                            })
                            .eq('id', m.id);

                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to update movie ${m.id}`, e);
                }
            }));
        }

        // 3. Process Series
        const { data: series, error: sError } = await supabaseAdmin
            .from('series')
            .select('id, tmdb_id')
            .is('genre', null)
            .limit(100);

        if (sError) throw sError;

        console.log(`[GenreSync] Found ${series?.length || 0} series without genre.`);

        if (series && series.length > 0) {
            await Promise.all(series.map(async (s) => {
                try {
                    const details = await tmdb.getTVDetails(s.tmdb_id);
                    if (details && details.genres) {
                        const genreString = details.genres.map((g: any) => g.name).join(', ');

                        await supabaseAdmin
                            .from('series')
                            .update({
                                genre: genreString,
                                genres: details.genres
                            })
                            .eq('id', s.id);

                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to update series ${s.id}`, e);
                }
            }));
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${updatedCount} items. Refresh page to sync more if needed.`
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
