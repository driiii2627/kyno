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
    // Optimized: Only fetch what is in the database for display. 
    // No external TMDB calls on render.
    try {
      [catalogMovies, catalogSeries] = await Promise.all([
        contentService.getCatalogMovies(),
        contentService.getCatalogSeries()
      ]);
    } catch (e) {
      console.error("Failed to fetch catalog", e);
    }

  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  // --- Dynamic Categorization Logic ---

  // 1. Hero: Balanced Mix (3 Movies + 3 Series) for Variety
  const allContent = [...catalogMovies, ...catalogSeries];

  const heroMovieCandidates = catalogMovies.filter(item => {
    const date = item.release_date;
    const year = date ? new Date(date).getFullYear() : 0;
    const rating = item.vote_average || 0;
    return year >= 2005 && rating >= 5.5; // Slightly stricter criteria for Hero
  });

  const heroSeriesCandidates = catalogSeries.filter(item => {
    const date = item.first_air_date;
    const year = date ? new Date(date).getFullYear() : 0;
    const rating = item.vote_average || 0;
    return year >= 2005 && rating >= 5.5;
  });

  // Take 3 from each pool randomly
  const selectedMovies = randomShuffle(heroMovieCandidates).slice(0, 3);
  const selectedSeries = randomShuffle(heroSeriesCandidates).slice(0, 3);

  // Combine and final shuffle so they aren't grouped (e.g. all movies first)
  const heroMovies = randomShuffle([...selectedMovies, ...selectedSeries]);

  // 2. "Filmes" (Movies): Changes every 6 hours
  // Use hashedSort so adding new movies doesn't reshuffle the old ones completely
  // Changed salt to '_v2' to force a fresh rotation for the user
  const moviesSeed = getTimeSeed(6, 'movies_v2');
  const dynamicMovies = hashedSort(catalogMovies, moviesSeed);

  // 3. "Séries" (Series): Changes every 5 hours
  const seriesSeed = getTimeSeed(5, 'series_v2');
  const dynamicSeries = hashedSort(catalogSeries, seriesSeed);

  // 4. "Recomendações" (Recommendations): Smart Weighted Random
  // Goal: Prioritize "Good" content (Rule of thumb: Rating > 6) to avoid "bad" random picks (e.g. obscure/low quality)
  // User feedback: "melhora a randomização... sem filmes realmente bons"

  const highQuality = allContent.filter(item => (item.vote_average || 0) >= 7.0);
  const midQuality = allContent.filter(item => (item.vote_average || 0) >= 5.0 && (item.vote_average || 0) < 7.0);

  // Mix: 70% High Quality, 30% Mid Quality (Variety)
  // We shuffle both pools first
  const shuffledHigh = randomShuffle(highQuality);
  const shuffledMid = randomShuffle(midQuality);

  // Take mostly good stuff, sprinkle some mid for discovery
  const recommendations = [
    ...shuffledHigh.slice(0, 14),
    ...shuffledMid.slice(0, 6)
  ];

  // Final shuffle of the mix so clarity isn't obvious (e.g. all good first)
  const finalRecommendations = randomShuffle(recommendations);

  // 5. "Top 10" (Weekly): Changes every 7 days (168 hours)
  // We first take the actual top rated (Quality Control)
  // Then we shuffle those top 50 so the Top 10 display rotates among the best
  const topRatedSource = [...catalogMovies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10Seed = getTimeSeed(168, 'top10movies');
  const top10Movies = hashedSort(topRatedSource, top10Seed).slice(0, 10);

  const topSeriesSource = [...catalogSeries].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 50);
  const top10SeriesSeed = getTimeSeed(168, 'top10series');
  const top10Series = hashedSort(topSeriesSource, top10SeriesSeed).slice(0, 10);

  // 6. Genres Filtering (From DB Data)
  // Check both 'genre' string (Database fallback) and 'genres' array (TMDB Hydrated)
  const filterByGenre = (items: import('@/services/content').CatalogItem[], keywords: string[]) => {
    return items.filter(m => {
      const dbGenre = m.genre?.toLowerCase() || '';
      const tmdbGenres = m.genres?.map(g => g.name.toLowerCase()).join(' ') || '';
      const combined = `${dbGenre} ${tmdbGenres}`;
      return keywords.some(k => combined.includes(k));
    });
  };

  const actionMovies = filterByGenre(catalogMovies, ['ação', 'action']).slice(0, 15);
  const comedyMovies = filterByGenre(catalogMovies, ['comédia', 'comedy']).slice(0, 15);
  const horrorMovies = filterByGenre(catalogMovies, ['terror', 'horror']).slice(0, 15);


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

        {/* Genres */}
        {actionMovies.length > 0 && (
          <MovieRow title="Ação e Aventura" movies={actionMovies} viewAllLink="/category/acao" />
        )}

        {comedyMovies.length > 0 && (
          <MovieRow title="Comédia" movies={comedyMovies} viewAllLink="/category/comedia" />
        )}

        {horrorMovies.length > 0 && (
          <MovieRow title="Terror" movies={horrorMovies} viewAllLink="/category/terror" />
        )}
      </div>
    </div>
  );
}
