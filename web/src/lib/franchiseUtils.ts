import { CatalogItem } from '@/services/content';

export interface Franchise {
    id: string;
    label: string;
    logoUrl?: string; // High quality logo from TMDB/Supabase
    backdropUrl?: string; // For card background
    itemCount: number;
    gradientClass: string; // CSS class for styling
}

// Pre-defined color gradients for random assignment
const GRADIENTS = [
    'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)', // Orange/Red
    'linear-gradient(135deg, #0cebeb 0%, #20e3b2 100%, #29ffc6 100%)', // Aqua
    'linear-gradient(135deg, #F09819 0%, #EDDE5D 100%)', // Yellow/Gold
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Green
    'linear-gradient(135deg, #CB356B 0%, #BD3F32 100%)', // Red
    'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)', // Purple/Orange
    'linear-gradient(135deg, #001f5c 0%, #1a4da1 100%)', // Deep Blue
    'linear-gradient(135deg, #000428 0%, #004e92 100%)', // Midnight
];

export function detectFranchises(items: CatalogItem[]): Franchise[] {
    const groups: Record<string, CatalogItem[]> = {};

    // 1. Group by Normalized Title Stem
    items.forEach(item => {
        const title = item.title || item.name || '';
        if (!title) return;

        // Normalize: "It: Chapter Two" -> "it"
        // Regex: Remove subtitles (after :), numbers, and 'chapter'
        // This is aggressive cleaning to find the "Root" franchise name
        // e.g. "John Wick 4" -> "john wick"
        // e.g. "Mission: Impossible - Fallout" -> "mission impossible"

        let stem = title.toLowerCase();

        // Remove everything after ':' (Subtitle)
        if (stem.includes(':')) stem = stem.split(':')[0];

        // Remove " - " (Hyphen separator)
        if (stem.includes(' - ')) stem = stem.split(' - ')[0];

        // Remove numbers at the end (e.g. " 2", " 3")
        stem = stem.replace(/\s+\d+$/, '');

        // Remove Roman numerals (IV, III) -- simplistic check
        stem = stem.replace(/\s+(ii|iii|iv|v|vi)$/, '');

        stem = stem.trim();

        if (stem.length < 3) return; // Skip very short titles

        if (!groups[stem]) groups[stem] = [];
        groups[stem].push(item);
    });

    const franchises: Franchise[] = [];

    // 2. Convert Groups to Franchises
    Object.keys(groups).forEach((stem, index) => {
        const groupItems = groups[stem];

        // Only consider it a franchise if there are 2 or more distinct items
        if (groupItems.length < 2) return;

        // Sort by date to find "First" (for Logo) and "Latest" (for Backdrop?)
        // Actually, let's pick the item with the BEST logo (if available)
        const itemWithLogo = groupItems.find(i => i.logo_url && i.logo_url.length > 5);
        const itemWithBackdrop = groupItems.find(i => i.backdrop_path);

        // Capitalize stem for display label
        const displayLabel = stem.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        franchises.push({
            id: `franchise-${stem}`,
            label: displayLabel,
            logoUrl: itemWithLogo?.logo_url, // Prefer DB logo
            backdropUrl: itemWithBackdrop?.backdrop_path ?
                `https://image.tmdb.org/t/p/w500${itemWithBackdrop.backdrop_path}` : undefined,
            itemCount: groupItems.length,
            gradientClass: GRADIENTS[index % GRADIENTS.length] // Assign stable gradient based on index
        });
    });

    // Sort franchises by size (biggest first)
    return franchises.sort((a, b) => b.itemCount - a.itemCount).slice(0, 10);
}
