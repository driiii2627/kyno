'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { getSearchIndexAction } from '@/app/actions/search';
import Link from 'next/link';

interface SearchBarProps {
    isOpen: boolean;
    onClose: () => void;
    placeholder?: string;
}

export default function SearchBar({ isOpen, onClose, placeholder = 'O que você quer assistir?' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [index, setIndex] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fuse, setFuse] = useState<Fuse<any> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Fetch Index on Mount (Lightweight)
    useEffect(() => {
        const loadIndex = async () => {
            const { index: data } = await getSearchIndexAction();
            setIndex(data);

            // Initialize Fuse
            // If fuse isn't installed successfully, this might break. 
            // I'll add a fallback in case the import fails, but Next.js usually errors at build time.
            const fuseInstance = new Fuse(data, {
                keys: ['title', 'genre', 'keywords'],
                threshold: 0.3,
                distance: 100,
                minMatchCharLength: 2
            });
            setFuse(fuseInstance);
            setIsLoading(false);
        };
        loadIndex();
    }, []);

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
        const route = item.media_type === 'movie' ? `/filme/${item.id}` : `/serie/${item.id}`;
        router.push(route);
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-white/10 pt-safe-top">
                <Search className="text-gray-400" size={24} />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none h-12"
                />
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : query ? (
                    /* Search Results */
                    <div className="max-w-4xl mx-auto space-y-2">
                        {results.length > 0 ? (
                            results.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleNavigation(item)}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group border border-transparent hover:border-white/5"
                                >
                                    {/* Poster */}
                                    <div className="w-12 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0 relative shadow-lg">
                                        <img
                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://placehold.co/200x300'}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium text-lg leading-tight truncate group-hover:text-blue-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                            <span className={`uppercase tracking-wider font-bold text-[10px] px-1.5 py-0.5 rounded ${item.media_type === 'movie' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                            </span>
                                            <span>{item.release_year}</span>
                                            {item.genre && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span className="truncate max-w-[200px] opacity-75">{item.genre}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" size={20} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-500">
                                <p className="text-xl font-medium mb-2">🤔</p>
                                Nenhum resultado encontrado para "{query}"
                            </div>
                        )}
                    </div>
                ) : (
                    /* Default State: Popular Genres / Quick Links */
                    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 px-2">Explorar Gêneros</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {['Ação', 'Comédia', 'Terror', 'Ficção', 'Romance', 'Família', 'Animação', 'Drama'].map(genre => (
                                    <Link
                                        key={genre}
                                        href={`/category/${genre.toLowerCase().replace(/ /g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
                                        onClick={onClose}
                                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-center text-gray-300 hover:text-white transition-all font-medium text-sm"
                                    >
                                        {genre}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 px-2">Em Alta</h2>
                            <div className="flex gap-4 overflow-x-auto pb-4 px-2 custom-scrollbar snap-x">
                                {/* Suggest Top Items from Index if available, random 5 */}
                                {index.length > 0 && index.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 5).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleNavigation(item)}
                                        className="w-28 flex-shrink-0 cursor-pointer group snap-start"
                                    >
                                        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2 relative shadow-md">
                                            <img
                                                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 truncate group-hover:text-white transition-colors text-center">{item.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .pt-safe-top {
                    padding-top: env(safe-area-inset-top, 20px);
                }
            `}</style>
        </div>
    );
}
