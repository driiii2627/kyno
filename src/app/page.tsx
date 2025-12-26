import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { seededShuffle, getTimeSeed } from '@/lib/utils';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Removed to fix build
// import { cookies } from 'next/headers';

// Force dynamic rendering to ensure randomization happens on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // Simulating user ID or just using 'guest' for now to avoid Auth complexity on Vercel build
  const userId = 'guest';

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

  // --- Dynamic Categorization Logic ---

  // 1. Hero: Pure Random (Changes on every refresh for "New" feel, or we can make it hourly)
  // Let's keep Hero random on refresh for that "Dynamic" feel the user likes? 
  // User asked for "Categories" to be fixed time. Hero is usually "Destaque".
  // Let's make Hero "Hourly" to be stable but fresh.
  const allContent = [...catalogMovies, ...catalogSeries];
  const heroSeed = getTimeSeed(1, 'hero'); // Changes every 1 hour
  const heroMovies = seededShuffle(allContent, heroSeed).slice(0, 10);

  // 2. "Filmes" (Movies): Changes every 6 hours
  const moviesSeed = getTimeSeed(6, 'movies');
  const dynamicMovies = seededShuffle(catalogMovies, moviesSeed);

  // 3. "Séries" (Series): Changes every 5 hours
  const seriesSeed = getTimeSeed(5, 'series');
  const dynamicSeries = seededShuffle(catalogSeries, seriesSeed);

  // 4. "Recomendações" (Recommendations): Personalized, changes every 24h
  // We use UserID string chars sum as part of the seed
  let userSalt = 0;
  for (let i = 0; i < userId.length; i++) userSalt += userId.charCodeAt(i);
  const recSeed = getTimeSeed(24, 'recommendations') + userSalt;
  const recommendations = seededShuffle(allContent, recSeed).slice(0, 20);

  // 5. "Top 10" (Weekly): Changes every 7 days (168 hours)
  // Ideally this should be based on Rating, but user said "Top 10" and "changes every 7 days".
  // So we take the HIGHEST RATED items, and then maybe shuffle slightly or just show them?
  // Use a stable sort first by rating, then slice top 50, then shuffle weekly to rotate the "Top 10" display?
  // Or just show Top 10 Rated. The user said "troca a cada 7 dias", implying rotation.
  // So: Take top 50 rated -> Shuffle with 7-day seed -> Take 10.
  const topRatedSource = [...catalogMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10Seed = getTimeSeed(168, 'top10movies');
  const top10Movies = seededShuffle(topRatedSource, top10Seed).slice(0, 10);

  const topSeriesSource = [...catalogSeries].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10SeriesSeed = getTimeSeed(168, 'top10series');
  const top10Series = seededShuffle(topSeriesSource, top10SeriesSeed).slice(0, 10);


  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero */}
      {heroMovies.length > 0 && <Hero movies={heroMovies} />}

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>

        {/* Recomendações (Personalized) */}
        {recommendations.length > 0 && (
          <MovieRow title="Recomendados para Você" movies={recommendations} priority={true} />
        )}

        {/* Top 10 Filmes */}
        {top10Movies.length > 0 && (
          <MovieRow title="Top 10 Filmes da Semana" movies={top10Movies} />
        )}

        {/* Top 10 Séries */}
        {top10Series.length > 0 && (
          <MovieRow title="Top 10 Séries da Semana" movies={top10Series} />
        )}

        {/* Rotational Categories */}
        {dynamicMovies.length > 0 && (
          <MovieRow title="Filmes" movies={dynamicMovies} />
        )}

        {dynamicSeries.length > 0 && (
          <MovieRow title="Séries" movies={dynamicSeries} />
        )}
      </div>
    </div>
  );
}
