const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY || 'e407e3f55ac924320df3192273006442';

export interface TmdbMovie {
    id: number;
    title?: string; // Movie
    name?: string; // TV
    overview: string;
    backdrop_path: string | null;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids?: number[];
    media_type?: 'movie' | 'tv' | 'person';
}

export interface TmdbDetails extends TmdbMovie {
    genres: { id: number; name: string }[];
    runtime?: number;
    number_of_seasons?: number;
    seasons?: {
        air_date: string;
        episode_count: number;
        id: number;
        name: string;
        overview: string;
        poster_path: string;
        season_number: number;
    }[];
    // Collection (Belongs to collection)
    belongs_to_collection?: {
        id: number;
        name: string;
        poster_path: string;
        backdrop_path: string;
    };
    status?: string;
}

export const fetchFromTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    url.searchParams.append('language', 'pt-BR');

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    try {
        const res = await fetch(url.toString(), {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            if (res.status === 404) throw new Error(`TMDB 404: Not Found (${endpoint})`);
            throw new Error(`TMDB Error: ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error("[TMDB Fetch Error]", error);
        throw error;
    }
};

export const tmdb = {
    searchMulti: async (query: string) => {
        // Multi search includes movies, tv, and people. effective for general search.
        return fetchFromTMDB<{ results: TmdbMovie[] }>(`/search/multi`, { query });
    },
    getDetails: async (id: number, type: 'movie' | 'tv') => {
        return fetchFromTMDB<TmdbDetails>(`/${type}/${id}`);
    },
    getCollection: async (collectionId: number) => {
        return fetchFromTMDB<{ parts: TmdbMovie[] }>(`/collection/${collectionId}`);
    },
    getSeasonDetails: async (tvId: number, seasonNumber: number) => {
        return fetchFromTMDB<any>(`/tv/${tvId}/season/${seasonNumber}`);
    },
    getTrending: async (type: 'all' | 'movie' | 'tv', timeWindow: 'day' | 'week' = 'day') => {
        return fetchFromTMDB<{ results: TmdbMovie[] }>(`/trending/${type}/${timeWindow}`);
    },
    getList: async (type: 'movie' | 'tv', category: 'popular' | 'top_rated' | 'upcoming' | 'on_the_air') => {
        return fetchFromTMDB<{ results: TmdbMovie[] }>(`/${type}/${category}`);
    },
    getImages: async (id: number, type: 'movie' | 'tv') => {
        return fetchFromTMDB<{ logos: { file_path: string, iso_639_1: string }[] }>(`/${type}/${id}/images?include_image_language=pt,en,null`);
    }
};
