'use server'

import { contentService } from "@/services/content";
import { tmdb } from "@/services/tmdb";

// Curated list of 15 high-quality movies (2000-2025)
const SEED_IDS = [
    157336, // Interstellar
    155,    // The Dark Knight
    299534, // Avengers: Endgame
    19995,  // Avatar
    496243, // Parasite
    361743, // Top Gun: Maverick
    634649, // Spider-Man: No Way Home
    414906, // The Batman
    763215, // Dune: Part Two
    872585, // Oppenheimer
    346698, // Barbie
    502356, // The Super Mario Bros. Movie
    667538, // Transformers: Rise of the Beasts
    299536, // Avengers: Infinity War
    27205   // Inception
];

export async function seedDatabase() {
    console.log("Starting manual seed...");
    const movies = [];

    // Fetch details for each ID
    // We do this sequentially or parallel, parallel is faster
    const promises = SEED_IDS.map(async (id) => {
        try {
            return await tmdb.getDetails(id, 'movie');
        } catch (e) {
            console.error(`Failed to fetch movie ${id} for seeding`, e);
            return null;
        }
    });

    const results = await Promise.all(promises);
    const validMovies = results.filter((m): m is import("@/services/tmdb").MovieDetails => m !== null);

    console.log(`Fetched ${validMovies.length} movies for seeding.`);

    if (validMovies.length > 0) {
        await contentService.syncMovies(validMovies);
    }

    return { success: true, count: validMovies.length };
}
