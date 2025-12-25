import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';

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

  // Select a random movie from the CATALOG to show on Hero
  // This ensures we only show what we have in DB
  const heroMovies = catalogMovies.slice(0, 10);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Pass top 10 movies/series for the carousel from CATALOG */}
      <Hero movies={heroMovies.length > 0 ? heroMovies : trendingMovies.results.slice(0, 10)} />

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>

        {catalogMovies.length > 0 ? (
          <>
            <MovieRow title="Filmes no Catálogo" movies={catalogMovies} priority={true} />
            {/* Future: We can slice/differentiate if we had genres */}
          </>
        ) : (
          /* Fallback if DB is empty (first load before sync finishes or error) */
          <MovieRow title="Tendências de Hoje" movies={trendingMovies.results} priority={true} />
        )}

        {catalogSeries.length > 0 ? (
          <MovieRow title="Séries no Catálogo" movies={catalogSeries} />
        ) : (
          <MovieRow title="Séries em Alta" movies={trendingSeries.results} />
        )}
      </div>
    </div>
  );
}
