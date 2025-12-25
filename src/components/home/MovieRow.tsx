'use client';

import { ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, Star } from 'lucide-react'; // Added ChevronLeft and Star
import styles from './MovieRow.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';

interface MovieRowProps {
    title: string;
    movies: Movie[];
}

export default function MovieRow({ title, movies }: MovieRowProps) {
    const listRef = useRef<HTMLDivElement>(null); // Added useRef

    // If no movies, don't render the row
    if (!movies || movies.length === 0) return null;

    const handleScroll = (direction: 'left' | 'right') => { // Added handleScroll
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
                <h2 className={styles.title}>{title}</h2>
                <a href="#" className={styles.viewAll}>Ver todos <ChevronRight size={16} /></a> {/* Changed to <a> */}
            </div>

            <div className={styles.container}> {/* New container div */}
                {/* Navigation Buttons */}
                <div className={`${styles.navBtn} ${styles.leftBtn}`} onClick={() => handleScroll('left')}>
                    <ChevronLeft size={32} />
                </div>
                <div className={`${styles.navBtn} ${styles.rightBtn}`} onClick={() => handleScroll('right')}>
                    <ChevronRight size={32} />
                </div>

                <div className={styles.listContainer} ref={listRef}> {/* Added ref */}
                    {movies.map((movie) => (
                        <div key={movie.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={getImageUrl(movie.poster_path, 'w500')}
                                    alt={movie.title || movie.name || 'Movie'}
                                    fill
                                    className={styles.image}
                                    sizes="(max-width: 768px) 150px, 200px"
                                />
                                {/* Overlay on Hover */}
                                <div className={styles.overlay}>
                                    <h3 className={styles.movieTitle}>{movie.title || movie.name}</h3>
                                    <div className={styles.metaRow}>
                                        <div className={styles.rating}>
                                            <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                                            <span>{movie.vote_average.toFixed(1)}</span>
                                        </div>
                                        <span className={styles.year}>
                                            {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Removed newBadge and cardTitleStatic from here as per instruction's implied structure */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
