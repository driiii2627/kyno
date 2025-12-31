
import { contentService } from '@/services/content';

async function main() {
    console.log('Fetching catalog...');
    const movies = await contentService.getCatalogMovies();

    console.log(`Analyzing ${movies.length} movies...`);

    // 1. Check Keywords for Animations
    const potentialAnimations = movies.filter(m => {
        const s = JSON.stringify(m).toLowerCase();
        // Check broad terms to see what genres they ACTUALLY have
        return s.includes('shrek') || s.includes('toy story') || s.includes('spider-verse') || s.includes('gato de botas');
    });

    console.log('\n--- POTENTIAL ANIMATIONS (Data Dump) ---');
    potentialAnimations.forEach(m => {
        console.log(`[${m.title}]`);
        console.log(`  genre (DB): ${m.genre}`);
        console.log(`  genres (TMDB): ${JSON.stringify(m.genres)}`);
    });

    // 2. Check Action vs SciFi Overlap
    const actionKeywords = ['ação', 'action', 'aventura', 'adventure'];
    const scifiKeywords = ['ficção', 'fiction', 'sci-fi', 'scifi'];

    const getGenres = (m: any) => {
        const db = m.genre?.toLowerCase() || '';
        const tmdb = m.genres?.map((g: any) => g.name.toLowerCase()).join(' ') || '';
        return (db + ' ' + tmdb).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const actionM = movies.filter(m => {
        const g = getGenres(m);
        return actionKeywords.some(k => g.includes(k));
    });

    const scifiM = movies.filter(m => {
        const g = getGenres(m);
        return scifiKeywords.some(k => g.includes(k));
    });

    console.log(`\n--- STATS ---`);
    console.log(`Action Count: ${actionM.length}`);
    console.log(`SciFi Count: ${scifiM.length}`);

    console.log('\n--- SCIFI SAMPLE ---');
    scifiM.slice(0, 5).forEach(m => console.log(`- ${m.title} (${m.genre})`));

    process.exit(0);
}

main();
