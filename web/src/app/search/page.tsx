import { contentService } from '@/services/content';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import styles from './Search.module.css';

export const dynamic = 'force-dynamic';

// Expanded Keyword Map with Cross-Pollination
const BRAND_KEYWORDS: Record<string, string[]> = {
    'marvel': [
        'marvel', 'iron man', 'homem de ferro', 'captain america', 'capitão américa', 'thor', 'hulk', 'avengers', 'vingadores',
        'spider-man', 'homem-aranha', 'black panther', 'pantera negra', 'doctor strange', 'doutor estranho',
        'guardians of the galaxy', 'guardiões da galáxia', 'loki', 'wandavision', 'eternals', 'eternos', 'deadpool',
        'wolverine', 'x-men', 'daredevil', 'demolidor', 'punisher', 'justiceiro'
    ],
    'dc comics': [
        'dc', 'batman', 'superman', 'wonder woman', 'mulher maravilha', 'flash', 'aquaman', 'joker', 'coringa',
        'justice league', 'liga da justiça', 'suicide squad', 'esquadrão suicida', 'shazam', 'black adam', 'adão negro',
        'blue beetle', 'besouro azul', 'peacemaker', 'pacificador', 'harley quinn', 'alerquina', 'penguin', 'pinguim'
    ],
    'star wars': [
        'star wars', 'jedi', 'sith', 'mandalorian', 'skywalker', 'vader', 'obi-wan', 'ahsoka', 'andor', 'boba fett',
        'clone wars', 'bad batch', 'rogue one', 'han solo', 'empire strikes back', 'império contra-ataca',
        'return of the jedi', 'retorno de jedi', 'new hope', 'uma nova esperança', 'phantom menace', 'ameaça fantasma'
    ],
    'pixar': [
        'pixar', 'toy story', 'cars', 'carros', 'finding nemo', 'procurando nemo', 'incredibles', 'incríveis',
        'soul', 'inside out', 'divertida mente', 'luca', 'coco', 'viva', 'wall-e', 'up', 'monsters', 'monstros',
        'ratatouille', 'brave', 'valente'
    ],
    'disney': [
        'disney', 'mickey', 'frozen', 'lion king', 'rei leão', 'aladdin', 'beauty and the beast', 'bela e a fera',
        'cinderella', 'cinderela', 'moana', 'zootopia', 'encanto', 'tangled', 'enrolados', 'little mermaid', 'pequena sereia',
        'branca de neve', 'snow white', 'peter pan', 'pinocchio', 'pinóquio', 'mulan', 'tarzan',
        // Cross-pollinate Pixar hits because users expect them in Disney
        'toy story', 'cars', 'carros', 'finding nemo', 'procurando nemo', 'monsters', 'monstros'
    ]
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

        // Check if query matches a known brand key
        // Using "includes" here is okay for the key selection, e.g. "disney movies" -> "disney"
        const brandKey = Object.keys(BRAND_KEYWORDS).find(k => lowerQ.includes(k) || k.includes(lowerQ));
        const searchTerms = brandKey ? BRAND_KEYWORDS[brandKey] : [lowerQ];

        // Advanced Regex Matching with Word Boundaries
        const matches = (text: string | undefined): boolean => {
            if (!text) return false;
            // Iterate terms to create regexes (cacheing this outside would be better but Vercel lambda is ephemeral)
            return searchTerms.some(term => {
                // Escape special characters to avoid regex errors
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                // If term is very short (<= 3 chars), force strict word boundary
                // If term is longer, we can allow partials IF it's not a brand search, but for brands strict is better.
                // However, user might search "bat" for "batman"? No, brands are strict lists.
                // Let's use word boundary for EVERYTHING in the list to correct "encanto" matching "desencanto".
                // Note: \b in regex handles accents poorly in JS sometimes, so we cleaner approach:

                const regex = new RegExp(`(^|\\s|\\.|,|-)${escaped}($|\\s|\\.|,|-)`, 'i');
                return regex.test(text);
            });
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
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={(() => {
                                                const path = item.poster_path || item.backdrop_path;
                                                if (!path) return '/placeholder.png';
                                                const trimmed = path.trim();
                                                if (trimmed.startsWith('http')) return trimmed;
                                                return `https://image.tmdb.org/t/p/w500${trimmed}`;
                                            })()}
                                            alt={item.title || item.name || 'Cover'}
                                            className={styles.image}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className={styles.overlay}>
                                        <div className={styles.cardTitle}>{item.title || item.name}</div>
                                        <div className={styles.cardMeta}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#FFD700', fontWeight: 700 }}>
                                                <Star size={12} fill="currentColor" />
                                                <span>{item.vote_average?.toFixed(1) || '0.0'}</span>
                                            </div>
                                            <span>•</span>
                                            <span>{new Date(item.release_date || item.first_air_date || Date.now()).getFullYear()}</span>
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
