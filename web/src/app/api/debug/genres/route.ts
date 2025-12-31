
import { NextResponse } from 'next/server';
import { contentService } from '@/services/content';

export async function GET() {
    const movies = await contentService.getCatalogMovies();

    // 1. Check Keywords for Animations
    const potentialAnimations = movies.filter(m => {
        const s = JSON.stringify(m).toLowerCase();
        return s.includes('shrek') || s.includes('toy story') || s.includes('spider-verse') || s.includes('gato de botas') || s.includes('kung fu panda');
    });

    // 2. Sample data
    const debugData = potentialAnimations.map(m => ({
        title: m.title,
        db_genre: m.genre,
        tmdb_genres: m.genres
    }));

    const allGenres = new Set();
    movies.forEach(m => {
        if (m.genre) allGenres.add(m.genre);
        m.genres?.forEach(g => allGenres.add(g.name));
    });

    return NextResponse.json({
        potential_animations: debugData,
        all_unique_genres_found: Array.from(allGenres)
    });
}
