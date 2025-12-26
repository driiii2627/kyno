import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import { tmdb } from '@/services/tmdb';
import { contentService } from '@/services/content';
import { hashedSort, randomShuffle, getTimeSeed } from '@/lib/utils';
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

  // 1. Hero: Pure Random on Refresh (Requested "Aleatorio")
  const allContent = [...catalogMovies, ...catalogSeries];

  // Filters: Year >= 2001, Rating >= 5.
  const heroCandidates = allContent.filter(item => {
    const date = item.release_date || item.first_air_date;
    const year = date ? new Date(date).getFullYear() : 0;
    const rating = item.vote_average || 0;
    return year >= 2001 && rating >= 5;
  });

  // Use robust Fisher-Yates shuffle for Hero
  // This ensures better randomness than .sort(random - 0.5)
  // And it will change on every render (force-dynamic)
  const heroMovies = randomShuffle(heroCandidates).slice(0, 6);

  // 2. "Filmes" (Movies): Changes every 6 hours
  // Use hashedSort so adding new movies doesn't reshuffle the old ones completely
  const moviesSeed = getTimeSeed(6, 'movies');
  const dynamicMovies = hashedSort(catalogMovies, moviesSeed);

  // 3. "Séries" (Series): Changes every 5 hours
  const seriesSeed = getTimeSeed(5, 'series');
  const dynamicSeries = hashedSort(catalogSeries, seriesSeed);

  // 4. "Recomendações" (Recommendations): Personalized, changes every 24h
  // We use UserID string chars sum as part of the seed
  let userSalt = 0;
  for (let i = 0; i < userId.length; i++) userSalt += userId.charCodeAt(i);
  const recSeed = getTimeSeed(24, 'recommendations') + userSalt;
  const recommendations = hashedSort(allContent, recSeed).slice(0, 20);

  // 5. "Top 10" (Weekly): Changes every 7 days (168 hours)
  // We first take the actual top rated (Quality Control)
  // Then we shuffle those top 50 so the Top 10 display rotates among the best
  const topRatedSource = [...catalogMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10Seed = getTimeSeed(168, 'top10movies');
  const top10Movies = hashedSort(topRatedSource, top10Seed).slice(0, 10);

  const topSeriesSource = [...catalogSeries].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10SeriesSeed = getTimeSeed(168, 'top10series');
  const top10Series = hashedSort(topSeriesSource, top10SeriesSeed).slice(0, 10);


  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero */}
      {heroMovies.length > 0 && <Hero movies={heroMovies} />}

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>

        {/* Recomendações (Personalized) */}
        {recommendations.length > 0 && (
          <MovieRow
            title="Recomendados para Você"
            movies={recommendations.slice(0, 15)}
            priority={true}
            // Recommendations usually don't have a clean "View All" category, but we could link to 'filmes' or just leave it
            viewAllLink="/category/filmes"
          />
        )}

        {/* Top 10 Filmes */}
        {top10Movies.length > 0 && (
          <MovieRow title="Filmes no Brasil Hoje" movies={top10Movies} variant="top10" />
        )}

        {/* Top 10 Séries */}
        {top10Series.length > 0 && (
          <MovieRow title="Séries no Brasil Hoje" movies={top10Series} variant="top10" />
        )}

        {/* Rotational Categories */}
        {dynamicMovies.length > 0 && (
          <MovieRow
            title="Filmes"
            movies={dynamicMovies.slice(0, 15)}
            viewAllLink="/category/filmes"
          />
        )}

        {dynamicSeries.length > 0 && (
          <MovieRow
            title="Séries"
            movies={dynamicSeries.slice(0, 15)}
            viewAllLink="/category/series"
          />
        )}
      </div>
    </div>
  );
}
