import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getImageUrl } from '@/services/tmdb';
import styles from './Search.module.css';

export const dynamic = 'force-dynamic';

// Mapping for Brand "Fuzzy" Search
const BRAND_KEYWORDS: Record<string, string[]> = {
    'marvel': ['marvel', 'iron man', 'homem de ferro', 'captain america', 'capitão américa', 'thor', 'hulk', 'avengers', 'vingadores', 'spider-man', 'homem-aranha', 'black panther', 'pantera negra', 'doctor strange', 'doutor estranho', 'guardians of the galaxy', 'guardiões da galáxia', 'loki', 'wandavision', 'eternals', 'eternos'],
    'dc comics': ['dc', 'batman', 'superman', 'wonder woman', 'mulher maravilha', 'flash', 'aquaman', 'joker', 'coringa', 'justice league', 'liga da justiça', 'suicide squad', 'esquadrão suicida', 'shazam', 'black adam', 'adão negro', 'blue beetle', 'besouro azul', 'peacemaker', 'pacificador'],
    'star wars': ['star wars', 'jedi', 'sith', 'mandalorian', 'skywalker', 'vader', 'obi-wan', 'ahsoka', 'andor', 'boba fett', 'clone wars', 'bad batch'],
    'pixar': ['pixar', 'toy story', 'cars', 'carros', 'finding nemo', 'procurando nemo', 'incredibles', 'incríveis', 'soul', 'inside out', 'divertida mente', 'luca', 'coco', 'viva', 'wall-e', 'up', 'monsters', 'monstros'],
    'disney': ['disney', 'mickey', 'frozen', 'lion king', 'rei leão', 'aladdin', 'beauty and the beast', 'bela e a fera', 'cinderella', 'cinderela', 'moana', 'zootopia', 'encanto', 'tangled', 'enrolados', 'little mermaid', 'pequena sereia']
};

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

        const lowerQ = query.toLowerCase().trim();

        // Check if query matches a known brand key (e.g. "dc comics" or just "marvel")
        const brandKey = Object.keys(BRAND_KEYWORDS).find(k => k.includes(lowerQ) || lowerQ.includes(k));
        const searchTerms = brandKey ? BRAND_KEYWORDS[brandKey] : [lowerQ];

        const matches = (text: string | undefined) => {
            if (!text) return false;
            const t = text.toLowerCase();
            return searchTerms.some(term => t.includes(term));
        };

        const filteredMovies = allMovies.filter(m =>
            matches(m.title) || matches(m.overview) || matches(m.genre)
        ).map(m => ({ ...m, type: 'movie' }));

        const filteredSeries = allSeries.filter(s =>
            matches(s.name) || matches(s.overview) || matches(s.genre)
        ).map(s => ({ ...s, type: 'series' }));

        results = [...filteredMovies, ...filteredSeries];
    }

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Link href="/" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className={styles.title}>
                        {query ? `Busca: "${query}"` : 'Buscar'}
                    </h1>
                </div>
            </div>

            {/* Grid Results */}
            {query && (
                <>
                    {results.length > 0 ? (
                        <div className={styles.grid}>
                            {results.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/details/${item.supabase_id || item.id}`}
                                    className={styles.card}
                                >
                                    <div className={styles.imageWrapper}>
                                        <OptimizedImage
                                            src={getImageUrl(item.poster_path, 'w500')}
                                            tinySrc={getImageUrl(item.poster_path, 'w92')}
                                            alt={item.title || item.name}
                                            fill
                                            className={styles.image}
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className={styles.overlay}>
                                        <div className={styles.cardTitle}>{item.title || item.name}</div>
                                        <div className={styles.cardMeta}>
                                            <span>{new Date(item.release_date || item.first_air_date || Date.now()).getFullYear()}</span>
                                            <span>•</span>
                                            <span>★ {item.vote_average?.toFixed(1)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>Nenhum resultado encontrado para "{query}".</p>
                        </div>
                    )}
                </>
            )}

            {!query && (
                <div className={styles.emptyState}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                    <p>Digite o nome de um filme ou série.</p>
                </div>
            )}
        </div>
    );
}
