
import { contentService } from '@/services/content';
import MovieRow from '@/components/home/MovieRow';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
    const { q } = await searchParams;
    const query = typeof q === 'string' ? q : '';

    let movies: any[] = [];
    let series: any[] = [];

    if (query) {
        // Fetch matching content
        const [allMovies, allSeries] = await Promise.all([
            contentService.getCatalogMovies(),
            contentService.getCatalogSeries()
        ]);

        // Simple client-side fuzzy search (since we load catalog in bulk for now)
        // In a real large-scale app, this should be a DB query.
        const lowerQ = query.toLowerCase();

        movies = allMovies.filter(m =>
            m.title.toLowerCase().includes(lowerQ) ||
            m.overview?.toLowerCase().includes(lowerQ) ||
            m.genre?.toLowerCase().includes(lowerQ)
        );

        series = allSeries.filter(s =>
            s.name.toLowerCase().includes(lowerQ) ||
            s.overview?.toLowerCase().includes(lowerQ) ||
            s.genre?.toLowerCase().includes(lowerQ)
        );
    }

    return (
        <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-12 pb-12">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">
                    {query ? `Resultados para "${query}"` : 'Buscar'}
                </h1>
            </div>

            {/* Results */}
            {query && (
                <div className="space-y-12">
                    {movies.length > 0 && (
                        <MovieRow title="Filmes Encontrados" movies={movies} />
                    )}

                    {series.length > 0 && (
                        <MovieRow title="Séries Encontradas" movies={series} />
                    )}

                    {movies.length === 0 && series.length === 0 && (
                        <div className="text-center text-zinc-500 py-20">
                            <p className="text-xl">Nenhum resultado encontrado para "{query}".</p>
                        </div>
                    )}
                </div>
            )}

            {!query && (
                <div className="text-center text-zinc-500 py-20">
                    <p className="text-xl">Digite algo para buscar.</p>
                </div>
            )}
        </div>
    );
}
