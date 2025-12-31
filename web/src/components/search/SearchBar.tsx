'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { getSearchIndexAction } from '@/app/actions/search';
import Link from 'next/link';
import styles from './SearchBar.module.css';

interface SearchBarProps {
    isOpen: boolean;
    onClose: () => void;
    placeholder?: string;
}

export default function SearchBar({ isOpen, onClose, placeholder = 'O que você quer assistir?' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [index, setIndex] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false); // Start false, only true when fetching
    const [hasLoaded, setHasLoaded] = useState(false);
    const [fuse, setFuse] = useState<Fuse<any> | null>(null);
    const [mounted, setMounted] = useState(false); // New state for hydration
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [emptyState, setEmptyState] = useState({ emoji: '🤔', text: '' });

    // Funny Empty States
    const emptyStates = [
        { emoji: '🤷‍♂️', text: 'Nada por aqui... Será que o Thanos estalou os dedos?' },
        { emoji: '🕵️‍♂️', text: 'Tentei achar, mas se escondeu melhor que o Mestre dos Magos.' },
        { emoji: '🎬', text: 'Corta! Não achamos nada nessa cena.' },
        { emoji: '👽', text: 'Houston, temos um problema. Título não identificado.' },
        { emoji: '🧹', text: 'Vazio... tipo a minha carteira no final do mês.' },
        { emoji: '🧟', text: 'Parece que esse filme virou zumbi e sumiu.' },
        { emoji: '🤖', text: 'Bip Bop... Erro 404: Diversão não encontrada.' },
        { emoji: '🍿', text: 'A pipoca esfriou esperando você digitar algo certo.' },
        { emoji: '🦖', text: 'Extinto! Assim como os dinossauros.' }
    ];

    useEffect(() => {
        if (!query) {
            const random = emptyStates[Math.floor(Math.random() * emptyStates.length)];
            setEmptyState(random);
        }
    }, [query]);

    // Init Mounted state
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lazy Fetch Index on First Open
    useEffect(() => {
        if (isOpen && !hasLoaded) {
            const loadIndex = async () => {
                setIsLoading(true);
                const { index: data } = await getSearchIndexAction();
                setIndex(data);

                const fuseInstance = new Fuse(data, {
                    keys: ['title', 'keywords'],
                    threshold: 0.3,
                    distance: 100,
                    minMatchCharLength: 2
                });
                setFuse(fuseInstance);
                setHasLoaded(true);
                setIsLoading(false);
            };
            loadIndex();
        }
    }, [isOpen, hasLoaded]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Perform Search
    useEffect(() => {
        if (!query.trim() || !fuse) {
            setResults([]);
            return;
        }

        const fuseResults = fuse.search(query);
        setResults(fuseResults.map(r => r.item).slice(0, 10)); // Top 10
    }, [query, fuse]);

    const handleNavigation = (item: any) => {
        // Always navigate to the universal details page
        const route = `/details/${item.id}`;
        router.push(route);
        onClose();
        setQuery('');
    };

    // Only render on client and if open
    if (!mounted || !isOpen) return null;

    // Use Portal to break out of Navbar stacking context
    return createPortal(
        <div className={styles.overlay}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.inputWrapper}>
                    <Search size={20} color="#888" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className={styles.input}
                    />
                </div>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={24} />
                </button>
            </div>

            {/* Content Body */}
            <div className={styles.body}>
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : query ? (
                    /* Search Results */
                    <div className="space-y-2 max-w-4xl mx-auto">
                        {results.length > 0 ? (
                            results.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleNavigation(item)}
                                    className={styles.resultItem}
                                >
                                    {/* Poster */}
                                    <div className={styles.posterWrapper}>
                                        <img
                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://placehold.co/200x300'}
                                            alt={item.title}
                                            className={styles.poster}
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className={styles.info}>
                                        <h3 className={styles.title}>{item.title}</h3>
                                        <div className={styles.meta}>
                                            <span className={`${styles.badge} ${item.media_type === 'tv' ? styles.badgeTv : ''}`}>
                                                {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                            </span>
                                            <span>{item.release_year}</span>
                                            {item.genre && (
                                                <>
                                                    <div className={styles.dot} />
                                                    <span className={styles.genreText}>{item.genre}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight size={20} color="#666" />
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emoji}>{emptyState.emoji}</div>
                                <p className={styles.emptyText}>{emptyState.text}</p>
                                <p className="text-sm mt-2 text-gray-600">"{query}" não retornou nada.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default State */
                    <div className="max-w-4xl mx-auto space-y-12 fade-in">
                        <div>
                            <h2 className={styles.sectionTitle}>Explorar Gêneros</h2>
                            <div className={styles.genresGrid}>
                                {['Ação', 'Comédia', 'Terror', 'Ficção', 'Romance', 'Família', 'Animação', 'Drama'].map(genre => (
                                    <Link
                                        key={genre}
                                        href={`/category/${genre.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                        onClick={onClose}
                                        className={styles.genreCard}
                                    >
                                        {genre}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className={styles.sectionTitle}>Em Alta</h2>
                            <div className={styles.trendingRow}>
                                {index.length > 0 && index.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 5).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNavigation(item)}
                                        className={styles.trendingItem}
                                    >
                                        <div className={styles.trendingPoster}>
                                            <img
                                                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                                                className={styles.trendingImg}
                                            />
                                        </div>
                                        <p className={styles.trendingTitle}>{item.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
