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
