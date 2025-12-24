'use client';

import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import styles from './MovieRow.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';

interface MovieRowProps {
    title: string;
    movies: Movie[];
}

export default function MovieRow({ title, movies }: MovieRowProps) {
    // If no movies, don't render the row
    if (!movies || movies.length === 0) return null;

    return (
        <div className={styles.row}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <button className={styles.viewAll}>
                    Ver todos <ChevronRight size={16} />
                </button>
            </div>

            <div className={styles.listContainer}>
                {movies.map((movie) => (
                    <div key={movie.id} className={styles.card}>
                        <div className={styles.imageWrapper}>
                            {/* Image */}
                            <Image
                                src={getImageUrl(movie.poster_path, 'w500')}
                                alt={movie.title || movie.name || 'Movie'}
                                fill
                                className={styles.cardImage}
                                unoptimized
                            />

                            {/* Overlay on Hover */}
                            <div className={styles.overlay}>
                                <span className={styles.cardTitle}>{movie.title || movie.name}</span>
                                <span className={styles.cardMeta}>
                                    {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()} •
                                    ★ {movie.vote_average.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {movie.vote_average > 8 && (
                            <div className={styles.newBadge}>
                                TOP
                            </div>
                        )}

                        <p className={styles.cardTitleStatic}>{movie.title || movie.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
