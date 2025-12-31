'use server';

import { supabase } from '@/lib/supabase';

export async function getSearchIndexAction() {
    try {
        // Fetch only necessary columns to reduce payload
        const { data: movies } = await supabase
            .from('movies')
            .select('id, tmdb_id, title, poster_url, release_year, genre')
            .order('created_at', { ascending: false }); // Limit if necessary? .limit(1000)

        const { data: series } = await supabase
            .from('series')
            .select('id, tmdb_id, title, poster_url, release_year, genre') // Series sometimes use 'title' in DB now? Check schema. Assuming title exists or fallback to name logic handled by query?
            // Actually, in previous steps 'series' table had 'title' alias or similar. Let's check schema/contentService.
            // content service says: name: dbSeriesItem.title || 'Sem Título'. So 'title' column exists.
            .order('created_at', { ascending: false });

        const movieItems = (movies || []).map(m => ({
            id: m.id, // Supabase UUID
            title: m.title,
            poster_path: m.poster_url,
            media_type: 'movie',
            release_year: m.release_year?.toString() || '',
            genre: m.genre,
            // Minimal keywords for Fuse
            keywords: `${m.title} ${m.genre || ''} ${m.release_year || ''}`
        }));

        const seriesItems = (series || []).map(s => ({
            id: s.id,
            title: s.title,
            poster_path: s.poster_url,
            media_type: 'tv',
            release_year: s.release_year?.toString() || '',
            genre: s.genre,
            keywords: `${s.title} ${s.genre || ''} ${s.release_year || ''}`
        }));

        return { index: [...movieItems, ...seriesItems] };
    } catch (e) {
        console.error('Failed to build search index', e);
        return { index: [] };
    }
}
