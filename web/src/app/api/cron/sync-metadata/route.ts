
import { NextRequest, NextResponse } from 'next/server';
import { supabase, getServiceSupabase } from '@/lib/supabase';
import { tmdb, MovieDetails } from '@/services/tmdb';

// Force dynamic prevents caching of this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Security Check
    // Vercel sends the authorization header as "Bearer <CRON_SECRET>"
    // We also allow a manual query param ?key=<CRON_SECRET> for testing
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get('key');
    const cronSecret = process.env.CRON_SECRET;

    if (
        authHeader !== `Bearer ${cronSecret}` &&
        queryKey !== cronSecret
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminSupabase = getServiceSupabase();
        const logs: string[] = [];
        let updatedCount = 0;

        // 2. Fetch Movies to Update (Batch of 50 to avoid timeout)
        // Ideally, we'd order by 'last_updated' asc, but we'll just check all for this MVP
        const { data: movies, error: moviesError } = await supabase
            .from('movies')
            .select('*')
            .limit(50); // Safety limit

        if (movies) {
            for (const movie of movies) {
                try {
                    const details = await tmdb.getDetails(movie.tmdb_id, 'movie');
                    if (!details) continue;

                    // Prepare update payload
                    // Only updating mutable fields: poster, backdrop, rating, description, title
                    const updates = {
                        title: details.title || movie.title,
                        description: details.overview || movie.description,
                        poster_url: details.poster_path || movie.poster_url,
                        backdrop_url: details.backdrop_path || movie.backdrop_url,
                        rating: details.vote_average || movie.rating,
                        // We could add an 'updated_at': new Date() column if it existed
                    };

                    const { error: updateError } = await adminSupabase
                        .from('movies')
                        .update(updates)
                        .eq('id', movie.id);

                    if (!updateError) {
                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to update movie ${movie.tmdb_id}`, e);
                }
            }
        }

        // 3. Repeating logic for Series (Batch of 50)
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .limit(50);

        if (series) {
            for (const s of series) {
                try {
                    const details = await tmdb.getDetails(s.tmdb_id, 'tv');
                    if (!details) continue;

                    const updates = {
                        title: details.name || details.title || s.title,
                        description: details.overview || s.description,
                        poster_url: details.poster_path || s.poster_url,
                        backdrop_url: details.backdrop_path || s.backdrop_url,
                        rating: details.vote_average || s.rating,
                    };

                    const { error: updateError } = await adminSupabase
                        .from('series')
                        .update(updates)
                        .eq('id', s.id);

                    if (!updateError) {
                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to update series ${s.tmdb_id}`, e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${updatedCount} items successfully.`,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
