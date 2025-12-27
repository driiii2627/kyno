const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY || 'e407e3f55ac924320df3192273006442'; // Fallback for safety, but env var takes precedence

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

export const getImageUrl = (path: string | null, size: 'original' | 'w500' | 'w342' | 'w780' | 'w1280' | 'w154' | 'w92' = 'original') => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path; // Already a full URL (from DB)
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

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  seasons?: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
    vote_average: number;
  }[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  runtime?: number;
}

export interface SeasonDetails {
  _id: string;
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string | null;
  season_number: number;
}

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
  },
  getDetails: async (id: number, type: 'movie' | 'tv') => {
    return fetchFromTMDB<MovieDetails>(`/${type}/${id}`);
  },
  getCredits: async (id: number, type: 'movie' | 'tv') => {
    return fetchFromTMDB<Credits>(`/${type}/${id}/credits`);
  },
  getSeasonDetails: async (tvId: number, seasonNumber: number) => {
    return fetchFromTMDB<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);
  },
  getRecommendations: async (id: number, type: 'movie' | 'tv') => {
    const response = await fetchFromTMDB<{ results: Movie[] }>(`/${type}/${id}/recommendations`);
    return response.results || [];
  },
  getCollectionDetails: async (collectionId: number) => {
    return fetchFromTMDB<{ parts: Movie[] }>(`/collection/${collectionId}`);
  }
};

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Credits {
  id: number;
  cast: Cast[];
  crew: any[];
}
