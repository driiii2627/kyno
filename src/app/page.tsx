import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';

// Force dynamic rendering to ensure randomization happens on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Mixed "Trending" Row (Recent adds from both) - Start AFTER Hero to avoid duplicates
  const mixedTrending = shuffled.slice(10, 30);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* STRICT: Only show Hero if we have DB content. */}
      {heroMovies.length > 0 && <Hero movies={heroMovies} />}

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>

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
