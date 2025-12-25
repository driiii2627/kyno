import Hero from '@/components/home/Hero';
import MovieRow from '@/components/home/MovieRow';
import { tmdb } from '@/services/tmdb';

export default async function Home() {
  // Fetch real data in parallel
  // We use try/catch to prevent the whole page from crashing if API fails
  let trendingMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
  let popularMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
  let topRatedMovies: { results: import('@/services/tmdb').Movie[] } = { results: [] };
  let trendingSeries: { results: import('@/services/tmdb').Movie[] } = { results: [] };

  try {
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
  } catch (error) {
    console.error("Failed to fetch TMDB data:", error);
    // Continue with empty lists (components handle this or we could show an error)
  }

  // Select a random movie from trending to show on Hero
  const heroMovie = trendingMovies.results.length > 0
    ? trendingMovies.results[Math.floor(Math.random() * Math.min(5, trendingMovies.results.length))]
    : null;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Pass top 10 movies/series for the carousel */}
      <Hero movies={[...trendingMovies.results, ...trendingSeries.results].slice(0, 10)} />

      <div style={{ position: 'relative', zIndex: 10, marginTop: '1.5rem' }}>
        <MovieRow title="Tendências de Hoje" movies={trendingMovies.results} priority={true} />
        <MovieRow title="Séries em Alta" movies={trendingSeries.results} />
        <MovieRow title="Populares da Semana" movies={popularMovies.results} />
        <MovieRow title="Melhores Avaliados" movies={topRatedMovies.results} />
      </div>
    </div>
  );
}
