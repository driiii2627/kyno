import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getImageUrl } from '@/services/tmdb';
import styles from './Search.module.css';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
    const { q } = await searchParams;
    const query = typeof q === 'string' ? q : '';

    let results: any[] = [];

    if (query) {
        const [allMovies, allSeries] = await Promise.all([
            contentService.getCatalogMovies(),
            contentService.getCatalogSeries()
        ]);

        const lowerQ = query.toLowerCase();

        const filteredMovies = allMovies.filter(m =>
            m.title?.toLowerCase().includes(lowerQ) ||
            m.overview?.toLowerCase().includes(lowerQ) ||
            m.genre?.toLowerCase().includes(lowerQ)
        ).map(m => ({ ...m, type: 'movie' }));

        const filteredSeries = allSeries.filter(s =>
            s.name?.toLowerCase().includes(lowerQ) ||
            s.overview?.toLowerCase().includes(lowerQ) ||
            s.genre?.toLowerCase().includes(lowerQ)
        ).map(s => ({ ...s, type: 'series' }));

        results = [...filteredMovies, ...filteredSeries];
    }

    return (
        <div className="min-h-screen bg-[#141414] pt-24 px-4 md:px-12 pb-12">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-3xl font-bold">
                    {query ? `Busca: "${query}"` : 'Buscar'}
                </h1>
            </div>

            {/* Grid Results */}
            {query && (
                <>
                    {results.length > 0 ? (
                        <div className={styles.searchGrid}>
                            {results.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.type === 'movie' ? `/details/${item.supabase_id || item.id}` : `/details/${item.supabase_id || item.id}`}
                                    className={styles.card}
                                >
                                    <div className="relative w-full h-full">
                                        <OptimizedImage
                                            src={getImageUrl(item.poster_path, 'w500')}
                                            tinySrc={getImageUrl(item.poster_path, 'w92')}
                                            alt={item.title || item.name}
                                            fill
                                            className={styles.image}
                                        />
                                    </div>
                                    <div className={styles.overlay}>
                                        <div className={styles.title}>{item.title || item.name}</div>
                                        <div className={styles.meta}>
                                            <span>{new Date(item.release_date || item.first_air_date || Date.now()).getFullYear()}</span>
                                            <span className="mx-2">•</span>
                                            <span className="bg-white/20 px-1 rounded text-xs flex items-center gap-1">
                                                ★ {item.vote_average?.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-zinc-500 py-20">
                            <p className="text-xl">Nada encontrado para "{query}".</p>
                        </div>
                    )}
                </>
            )}

            {!query && (
                <div className="text-center text-zinc-500 py-20 flex flex-col items-center">
                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                    <p className="text-xl">O que você quer assistir hoje?</p>
                </div>
            )}
        </div>
    );
}
