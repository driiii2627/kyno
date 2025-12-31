'use server';

import { contentService } from '@/services/content';

export async function getSearchIndexAction() {
    try {
        const [movies, series] = await Promise.all([
            contentService.getCatalogMovies(),
            contentService.getCatalogSeries()
        ]);

        const index = [
            ...movies.map(m => ({
                id: m.supabase_id, // Use UUID for navigation
                tmdb_id: m.id,
                title: m.title,
                poster_path: m.poster_path,
                backdrop_path: m.backdrop_path,
                media_type: 'movie',
                release_year: m.release_date ? m.release_date.split('-')[0] : '',
                genre: m.genre,
                keywords: [m.title, m.genre, m.release_date?.split('-')[0]].join(' ') // Helper for fuzzy
            })),
            ...series.map(s => ({
                id: s.supabase_id,
                tmdb_id: s.id,
                title: s.name || s.title,
                poster_path: s.poster_path,
                backdrop_path: s.backdrop_path,
                media_type: 'tv',
                release_year: s.first_air_date ? s.first_air_date.split('-')[0] : '',
                genre: s.genre,
                keywords: [s.name, s.title, s.genre, s.first_air_date?.split('-')[0]].join(' ')
            }))
        ];

        return { index };
    } catch (e) {
        console.error('Failed to build search index', e);
        return { index: [] };
    }
}
