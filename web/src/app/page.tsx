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
  let popularSeries: { results: import('@/services/tmdb').Movie[] } = { results: [] };

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

      // NEW: Fetch Real TMDB Popularity for Ranks 1-3
      // We perform this here to satisfy the new ranking requirement
      const pt = await tmdb.getPopular('movie');
      popularMovies = pt;
      const st = await tmdb.getPopular('tv'); // Use getPopular directly
      popularSeries = st;

    } catch (e) {
      console.error("Failed to fetch catalog/popular", e);
    }

  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  // --- Dynamic Categorization Logic ---

  // Helper to get Top 3 Popular that exist in our DB
  const getTop3Popular = (popularList: any[], dbList: import('@/services/content').CatalogItem[]) => {
    const top3: import('@/services/content').CatalogItem[] = [];
    const usedIds = new Set<number>();

    for (const pop of popularList) {
      if (top3.length >= 3) break;
      // Find corresponding item in our DB
      const match = dbList.find(dbItem => dbItem.tmdb_id === pop.id);
      if (match) {
        top3.push(match);
        usedIds.add(match.id);
      }
    }
    return { top3, usedIds };
  };

  // 1. Movies Ranking
  const { top3: top3Movies, usedIds: usedMoviesIds } = getTop3Popular(popularMovies.results || [], catalogMovies);

  // Ranks 4-10: Top Rated (High Quality) -> Shuffled Weekly
  const remainingMoviesSource = catalogMovies
    .filter(m => !usedMoviesIds.has(m.id)) // Exclude top 3
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 50); // Take top 50 rated candidates

  const top10MoviesSeed = getTimeSeed(168, 'top10movies_hybrid');
  // Shuffle candidates and take 7
  const next7Movies = hashedSort(remainingMoviesSource, top10MoviesSeed).slice(0, 7);
  // Combine
  const top10Movies = [...top3Movies, ...next7Movies];


  // 2. Series Ranking
  const { top3: top3Series, usedIds: usedSeriesIds } = getTop3Popular(popularSeries.results || [], catalogSeries);

  // Ranks 4-10
  const remainingSeriesSource = catalogSeries
    .filter(s => !usedSeriesIds.has(s.id))
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 50);

  const top10SeriesSeed = getTimeSeed(168, 'top10series_hybrid');
  const next7Series = hashedSort(remainingSeriesSource, top10SeriesSeed).slice(0, 7);
  const top10Series = [...top3Series, ...next7Series];


  // 3. Hero: Balanced Mix (3 Movies + 3 Series) for Variety
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

  // 6. Genres Filtering (From DB Data)
  // Check both 'genre' string (Database fallback) and 'genres' array (TMDB Hydrated)
  // 6. Genres Filtering (From DB Data)
  // Check both 'genre' string (Database fallback) and 'genres' array (TMDB Hydrated)
  const filterByGenre = (items: import('@/services/content').CatalogItem[], keywords: string[]) => {
    return items.filter(m => {
      const dbGenre = m.genre?.toLowerCase() || '';
      const tmdbGenres = m.genres?.map(g => g.name.toLowerCase()).join(' ') || '';

      // Normalize str to remove accents for better matching
      const combined = `${dbGenre} ${tmdbGenres}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return keywords.some(k => {
        const normK = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return combined.includes(normK);
      });
    });
  };

  const actionMovies = filterByGenre(catalogMovies, ['ação', 'action', 'aventura', 'adventure']).slice(0, 15);
  const comedyMovies = filterByGenre(catalogMovies, ['comédia', 'comedy', 'stand-up', 'stand up', 'comedia', 'humor', 'engraçado', 'familia']).slice(0, 15);
  const horrorMovies = filterByGenre(catalogMovies, ['terror', 'horror', 'suspense', 'thriller', 'medo', 'assustador'])
    .filter(m => {
      // Smart Filter: Exclude "Action Thrillers" that are not explicitly Horror
      // "Fast & Furious" (Action, Thriller) -> Exclude
      // "Alien" (Action, Horror) -> Keep
      const combined = (m.genre || '') + (m.genres?.map(g => g.name).join(' ') || '');
      const isAction = /ação|action|aventura|adventure/i.test(combined);
      const isHorror = /terror|horror/i.test(combined);
      if (isAction && !isHorror) return false;
      return true;
    })
    .slice(0, 15);
  const animationMovies = filterByGenre(catalogMovies, ['animação', 'animation', 'anime', 'animes', 'desenho', 'cartoon', 'infantil']).slice(0, 15);
  const scifiMovies = filterByGenre(catalogMovies, ['ficção', 'fiction', 'sci-fi', 'scifi', 'futuro', 'espaço', 'space']).slice(0, 15);


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
          <MovieRow title="Comédia e Família" movies={comedyMovies} viewAllLink="/category/comedia" />
        )}

        {animationMovies.length > 0 && (
          <MovieRow title="Animação" movies={animationMovies} viewAllLink="/category/animacao" />
        )}

        {scifiMovies.length > 0 && (
          <MovieRow title="Ficção Científica" movies={scifiMovies} viewAllLink="/category/ficcao" />
        )}

        {horrorMovies.length > 0 && (
          <MovieRow title="Terror e Suspense" movies={horrorMovies} viewAllLink="/category/terror" />
        )}
      </div>
    </div>
  );
}
