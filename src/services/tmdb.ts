const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = 'e407e3f55ac924320df3192273006442';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export const getImageUrl = (path: string | null, size: 'original' | 'w500' = 'original') => {
  if (!path) return '/placeholder.png';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', API_KEY);
  url.searchParams.append('language', 'pt-BR');

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  console.log(`[TMDB Request] ${url.toString()}`);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[TMDB Error] ${res.status} ${res.statusText}: ${errorBody}`);
      throw new Error(`TMDB Error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("[TMDB Fetch Error]", error);
    throw error;
  }
};

export const tmdb = {
  getTrending: async (type: 'movie' | 'tv' = 'movie') => {
    return fetchFromTMDB<{ results: Movie[] }>(`/trending/${type}/week`);
  },
  getPopular: async (type: 'movie' | 'tv' = 'movie') => {
    return fetchFromTMDB<{ results: Movie[] }>(`/${type}/popular`);
  },
  getTopRated: async (type: 'movie' | 'tv' = 'movie') => {
    return fetchFromTMDB<{ results: Movie[] }>(`/${type}/top_rated`);
  },
  getByGenre: async (genreId: number, type: 'movie' | 'tv' = 'movie') => {
    return fetchFromTMDB<{ results: Movie[] }>(`/discover/${type}`, { with_genres: genreId.toString() });
  }
};
