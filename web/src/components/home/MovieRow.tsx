'use client';

import { ChevronRight } from 'lucide-react';
import { useRef } from 'react';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { ChevronLeft, Star } from 'lucide-react';
import styles from './MovieRow.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';
import Link from 'next/link';
import { CatalogItem } from '@/services/content';

import RankNumber from './RankNumber';
import MovieCard from './MovieCard';


interface MovieRowProps {
    title: string;
    movies: Movie[];
    priority?: boolean;
    variant?: 'default' | 'top10';
    viewAllLink?: string;
}

export default function MovieRow({ title, movies, priority = false, variant = 'default', viewAllLink }: MovieRowProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const isTop10 = variant === 'top10';

    // If no movies, don't render the row
    if (!movies || movies.length === 0) return null;

    const handleScroll = (direction: 'left' | 'right') => {
        if (listRef.current) {
            const { current } = listRef;
            const scrollAmount = window.innerWidth / 2 > 600 ? 800 : window.innerWidth - 100;

            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className={styles.row}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    {isTop10 && <span className={styles.top10Prefix}>TOP 10 </span>}
                    {title}
                </h2>
                {!isTop10 && viewAllLink && (
                    <Link href={viewAllLink} className={styles.viewAll}>
                        Ver todos <ChevronRight size={16} />
                    </Link>
                )}
            </div>

            <div className={styles.container}>
                {/* Navigation Buttons */}
                <div className={`${styles.navBtn} ${styles.leftBtn}`} onClick={() => handleScroll('left')}>
                    <ChevronLeft size={32} />
                </div>
                <div className={`${styles.navBtn} ${styles.rightBtn}`} onClick={() => handleScroll('right')}>
                    <ChevronRight size={32} />
                </div>

                <div
                    className={`${styles.listContainer} ${isTop10 ? styles.top10List : ''}`}
                    ref={listRef}
                >
                    {movies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            index={index}
                            isTop10={isTop10}
                            priority={priority}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
