import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Deterministic PRNG based on a seed (Mulberry32)
 */
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

/**
 * Shuffles an array deterministically based on a seed.
 * Useful for "Daily/Hourly" rotation that is same for all users.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
    const rng = mulberry32(seed);
    const shuffled = [...array];

    // Fisher-Yates shuffle using seeded RNG
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Generates a seed based on current time and interval.
 * @param intervalHours Duration of the window in hours
 * @param salt Optional string to make seeds unique per category
 */
export function getTimeSeed(intervalHours: number, salt: string = ''): number {
    const now = Date.now();
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const timeIndex = Math.floor(now / intervalMs);

    // Create a hash from the salt string to add to the time index
    let hash = 0;
    for (let i = 0; i < salt.length; i++) {
        const char = salt.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return timeIndex + hash;
}

/**
 * Stable Sort based on ID + Seed.
 * Prevents catalog shifting when items are added/removed.
 * Each item gets a score, and we sort by score. 
 * Adding a new item just inserts it into its score position without shuffling others.
 */
export function hashedSort<T extends { id?: string | number }>(array: T[], seed: number): T[] {
    const scored = array.map(item => {
        const idStr = String(item.id || '');
        // Simple hash of Seed + ID
        let h = seed;
        for (let i = 0; i < idStr.length; i++) {
            h = Math.imul(31, h) + idStr.charCodeAt(i) | 0;
        }
        return { item, score: h };
    });

    // Sort by score
    scored.sort((a, b) => a.score - b.score);

    return scored.map(s => s.item);
}

/**
 * True Random Shuffle (Fisher-Yates) using Math.random()
 * Much better distribution than .sort(() => Math.random() - 0.5)
 */
export function randomShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
