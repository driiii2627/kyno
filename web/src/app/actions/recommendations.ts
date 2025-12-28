'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * Tracks user interest in genres by calling the atomic RPC function.
 * This is "Fire and Forget" for speed, but returns status for debugging.
 */
export async function trackGenreInterest(genres: string[]) {
    // 1. Get Active Profile
    const cookieStore = await cookies();
    const profileId = cookieStore.get('X-Profile-ID')?.value;

    if (!profileId) return { error: 'No active profile' };

    // 2. Validate Genres
    if (!genres || genres.length === 0) return { success: true };

    const supabase = await createClient();

    // 3. Call RPC Atomic Increment
    const { error } = await supabase.rpc('increment_genre_scores', {
        p_profile_id: profileId,
        p_genres: genres
    });

    if (error) {
        console.error('Failed to track genre interest:', error);
        return { error: error.message };
    }

    return { success: true };
}

/**
 * Initializes the recommendation row for a new profile.
 */
export async function initRecommendations(profileId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('profile_recommendations')
        .insert({
            profile_id: profileId,
            genre_scores: {}
        });

    if (error) {
        console.error('Failed to init recommendations:', error);
        // Getting an error here isn't fatal (stats will init on first watch via RPC anyway)
        // But logging it is good practice.
    }
}

/**
 * Fetches the user's genre preferences sorted by score.
 */
export async function getProfileRecommendations(profileId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profile_recommendations')
        .select('genre_scores')
        .eq('profile_id', profileId)
        .single();

    if (error || !data) return null;

    return data.genre_scores as Record<string, number>;
}
