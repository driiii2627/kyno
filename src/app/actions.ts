'use server';

import { tmdb } from '@/services/tmdb';

export async function getSeason(tvId: number, seasonNumber: number) {
    return tmdb.getSeasonDetails(tvId, seasonNumber);
}
