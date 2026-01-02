import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';

// Force dynamic - this is an administrative task
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s runtime (Vercel Limit)

export async function GET(req: NextRequest) {
    // Basic security: Check for a secret key if needed, or open for now since it's idempotent
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        console.log("Starting Textless Poster Sync...");
        const updates = [];
        const errors = [];

        // 1. Sync Movies
        const { data: movies, error: moviesError } = await supabase
            .from('movies')
            .select('id, tmdb_id, textless_poster_url')
            .is('textless_poster_url', null); // Only fetch those missing the poster

        if (moviesError) throw moviesError;

        console.log(`Found ${movies?.length || 0} movies to sync.`);

        if (movies) {
            for (const movie of movies) {
                try {
                    const posterPath = await tmdb.getTextlessPoster(movie.tmdb_id, 'movie');
                    if (posterPath) {
                        const { error: updateError } = await supabase
                            .from('movies')
                            .update({ textless_poster_url: posterPath })
                            .eq('id', movie.id);

                        if (updateError) {
                            console.error(`Failed to update movie ${movie.id}:`, updateError);
                            errors.push({ id: movie.id, error: updateError });
                        } else {
                            updates.push({ id: movie.id, type: 'movie', path: posterPath });
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch/update movie ${movie.tmdb_id}`, e);
                }
            }
        }

        // 2. Sync Series
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('id, tmdb_id, textless_poster_url')
            .is('textless_poster_url', null);

        if (seriesError) throw seriesError;

        console.log(`Found ${series?.length || 0} series to sync.`);

        if (series) {
            for (const s of series) {
                try {
                    const posterPath = await tmdb.getTextlessPoster(s.tmdb_id, 'tv');
                    if (posterPath) {
                        const { error: updateError } = await supabase
                            .from('series')
                            .update({ textless_poster_url: posterPath })
                            .eq('id', s.id);

                        if (updateError) {
                            console.error(`Failed to update series ${s.id}:`, updateError);
                            errors.push({ id: s.id, error: updateError });
                        } else {
                            updates.push({ id: s.id, type: 'tv', path: posterPath });
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch/update series ${s.tmdb_id}`, e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            synced_count: updates.length,
            updates: updates,
            errors: errors
        });

    } catch (error: any) {
        console.error("Critical Sync Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
