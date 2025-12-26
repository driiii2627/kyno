'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowLeft, Star } from 'lucide-react';
import { CatalogItem } from '@/services/content';
import { getImageUrl } from '@/services/tmdb';
import styles from './CategoryClient.module.css';

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
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <Link href="/" className={styles.backBtn}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className={styles.pageTitle}>
                        {title}
                    </h1>
                    <span className={styles.countBadge}>
                        {filteredItems.length}
                    </span>
                </div>

                {/* Search Bar */}
                <div className={styles.searchWrapper}>
                    <input
                        type="text"
                        placeholder={`Buscar...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <Search size={18} className={styles.searchIcon} />
                </div>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        className={styles.cardWrapper}
                    >
                        <Link
                            href={`/details/${item.supabase_id || item.id}`}
                            className={styles.cardContent}
                        >
                            {/* Image */}
                            <Image
                                src={getImageUrl(item.poster_path, 'w342')}
                                alt={item.title || item.name || 'Cover'}
                                fill
                                className={styles.image}
                                sizes="(max-width: 768px) 50vw, 20vw"
                            />

                            {/* Gradient Overlay */}
                            <div className={styles.overlay}>
                                <h3 className={styles.itemTitle}>{item.title || item.name}</h3>
                                <div className={styles.meta}>
                                    <div className={styles.rating}>
                                        <Star size={12} fill="currentColor" />
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
                <div className={styles.emptyState}>
                    <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p className="text-lg">Nenhum resultado encontrado.</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className={styles.clearBtn}
                    >
                        Limpar busca
                    </button>
                </div>
            )}
        </div>
    );
}
