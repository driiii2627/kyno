'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DetailsTabs.module.css';
import seasonStyles from './SeasonBrowser.module.css'; // Reusing card styles

interface DetailsTabsProps {
    seasonBrowser?: React.ReactNode;
    recommendations: any[]; // Accepts CatalogItems now
    uuid: string; // Current item UUID
}

export default function DetailsTabs({ seasonBrowser, recommendations, uuid }: DetailsTabsProps) {
    // If seasonBrowser is provided, default to 'episodes', else 'recommendations'
    const [activeTab, setActiveTab] = useState<'episodes' | 'recommendations'>(seasonBrowser ? 'episodes' : 'recommendations');
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            // Scroll by one full page
            const scrollAmount = current.clientWidth;
            const directionMultiplier = direction === 'left' ? -1 : 1;
            current.scrollBy({ left: scrollAmount * directionMultiplier, behavior: 'smooth' });
        }
    };

    return (
        <div className={styles.container}>
            {/* Tabs Navigation */}
            <div className={styles.tabs}>
                {seasonBrowser && (
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`${styles.tabButton} ${activeTab === 'episodes' ? styles.activeTab : ''}`}
                    >
                        Episódios
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`${styles.tabButton} ${activeTab === 'recommendations' ? styles.activeTab : ''}`}
                >
                    Recomendações
                </button>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {activeTab === 'episodes' && seasonBrowser && (
                    <div className={styles.tabContent}>
                        {seasonBrowser}
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className={styles.tabContent}>
                        {recommendations.length > 0 ? (
                            <div className={seasonStyles.scrollContainer}>
                                <button
                                    className={`${seasonStyles.navButton} ${seasonStyles.navLeft}`}
                                    onClick={() => scroll('left')}
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <div ref={scrollRef} className={seasonStyles.grid}>
                                    {recommendations.map(rec => (
                                        <Link
                                            key={rec.id}
                                            href={`/details/${rec.supabase_id}`}
                                            className={seasonStyles.card}
                                        >
                                            <div className={seasonStyles.thumbnailWrapper}>
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w500${rec.backdrop_path || rec.poster_path}`}
                                                    alt={rec.title || rec.name || 'Title'}
                                                    fill
                                                    className={seasonStyles.thumbnailImage}
                                                    unoptimized
                                                />
                                                <div className={seasonStyles.playOverlay}>
                                                    <div className={seasonStyles.playIcon}>
                                                        <Play fill="currentColor" size={20} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={seasonStyles.cardInfo}>
                                                <div className={seasonStyles.cardHeader}>
                                                    <h4 className={seasonStyles.episodeTitle}>
                                                        {rec.title || rec.name}
                                                    </h4>
                                                    <span className={seasonStyles.duration}>
                                                        {rec.vote_average ? `★ ${rec.vote_average.toFixed(1)}` : ''}
                                                    </span>
                                                </div>
                                                <p className={seasonStyles.overview}>
                                                    {rec.overview || 'Sem descrição.'}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <button
                                    className={`${seasonStyles.navButton} ${seasonStyles.navRight}`}
                                    onClick={() => scroll('right')}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-zinc-500 py-8">Nenhuma recomendação disponível no momento.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
