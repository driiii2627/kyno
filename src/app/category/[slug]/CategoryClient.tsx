'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowLeft, Star } from 'lucide-react';
import { CatalogItem } from '@/services/content';
import { getImageUrl } from '@/services/tmdb';

interface CategoryClientProps {
    title: string;
    items: CatalogItem[];
}

export default function CategoryClient({ title, items }: CategoryClientProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            (item.title || item.name || '').toLowerCase().includes(query)
        );
    }, [items, searchQuery]);

    return (
        <div className="min-h-screen bg-black text-white px-4 md:px-12 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 sticky top-0 bg-black/90 backdrop-blur-md z-50 py-4 border-b border-white/5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    <span className="text-sm text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-white/5">
                        {filteredItems.length}
                    </span>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-white transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder={`Buscar em ${title}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder-zinc-600"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        className="group relative aspect-[2/3] bg-zinc-900 rounded-lg overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10"
                    >
                        <Link
                            href={`/details/${item.supabase_id || item.id}`}
                            className="absolute inset-0 block w-full h-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            {/* Image */}
                            <Image
                                src={getImageUrl(item.poster_path, 'w500')}
                                alt={item.title || item.name || 'Cover'}
                                fill
                                className="object-cover transition-opacity duration-300 group-hover:opacity-100"
                                sizes="(max-width: 768px) 50vw, 20vw"
                            />

                            {/* Gradient Overlay (Visible on Hover) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                <h3 className="font-bold text-sm md:text-base leading-tight mb-1">{item.title || item.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-zinc-300">
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star size={10} fill="currentColor" />
                                        <span>{item.vote_average?.toFixed(1) || '0.0'}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{new Date(item.release_date || item.first_air_date || Date.now()).getFullYear()}</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-lg">Nenhum resultado encontrado para "{searchQuery}"</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-4 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
                    >
                        Limpar busca
                    </button>
                </div>
            )}
        </div>
    );
}
