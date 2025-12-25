import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import SyncButton from '@/components/dev/SyncButton'; // Imp
import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';

export default async function Home() {
  // ... (existing code, ensure it matches)
  // I will just match the top imports and the bottom return
  // But wait, replace_file_content needs the target content to match exactly.
  // Since I just rewrote the file in step 1113, I know the exact content.
  // I will assume standard imports at the top.

  // Actually, I'll use multi_replace for safer editing of top and bottom.


  export default async function Home() {
    // Fetch real data in parallel
    // We use try/catch to prevent the whole page from crashing if API fails
    let trendingMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
    let popularMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
    let topRatedMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
    let trendingSeries: { results: import('@/services/tmdb').Movie[] } = { results: [] };

    let catalogMovies: import('@/services/content').CatalogItem[] = [];
    let catalogSeries: import('@/services/content').CatalogItem[] = [];

    try {
      // 1. Fetch Source Data from TMDB
      [
        trendingMovies,
        popularMovies,
        topRatedMovies,
        trendingSeries
      ] = await Promise.all([
        tmdb.getTrending('movie'),
        tmdb.getPopular('movie'),
        tmdb.getTopRated('movie'),
        tmdb.getTrending('tv')
      ]);

      // 2. Sync fetched content to Supabase (Auto-register)
      // We use Promise.allSettled to ensure rendering happens even if sync fails
      await Promise.allSettled([
        contentService.syncMovies([...trendingMovies.results, ...popularMovies.results, ...topRatedMovies.results]),
        contentService.syncSeries(trendingSeries.results)
      ]);

      // 3. Fetch ONLY what is in the database for display
      try {
        [catalogMovies, catalogSeries] = await Promise.all([
          contentService.getCatalogMovies(),
          contentService.getCatalogSeries()
        ]);
      } catch (e) {
        console.error("Failed to fetch catalog", e);
      }

    } catch (error) {
      console.error("Failed to fetch TMDB data:", error);
    }

    // Combine and Randomize for Hero and Trending
    const allCatalog = [...catalogMovies, ...catalogSeries];

    // Fisher-Yates Shuffle for Hero (Random 10)
    const shuffled = [...allCatalog];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const heroMovies = shuffled.slice(0, 10);

    // Mixed "Trending" Row (Recent adds from both)
    // We use the raw combined list (roughly strictly ordered by when we fetched/id, or random if we use shuffled)
    const mixedTrending = shuffled.slice(0, 20);

    return (
      <div style={{ paddingBottom: '3rem' }}>
        {/* STRICT: Only show Hero if we have DB content. If empty, show nothing (or placeholder) */}
        {heroMovies.length > 0 && <Hero movies={heroMovies} />}

        <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>

          {/* STRICT: Only show rows if we have data. No fallbacks to TMDB direct lists. */}
          {mixedTrending.length > 0 && (
            <MovieRow title="Destaques do Catálogo" movies={mixedTrending} priority={true} />
          )}

          {catalogMovies.length > 0 && (
            <MovieRow title="Filmes" movies={catalogMovies} />
          )}

          {catalogSeries.length > 0 && (
            <MovieRow title="Séries" movies={catalogSeries} />
          )}
        </div>
      </div>
    );
  }
