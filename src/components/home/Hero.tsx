'use client';

import { Play, Plus, Tv } from 'lucide-react';
import styles from './Hero.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';

interface HeroProps {
    movie: Movie;
}

export default function Hero({ movie }: HeroProps) {
    if (!movie) return null;

    const year = new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear();
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const title = movie.title || movie.name;

    // Truncate logic (Static, no state)
    const MAX_LENGTH = 200;
    const text = movie.overview || '';
    const displayText = text.length > MAX_LENGTH ? text.slice(0, MAX_LENGTH) + '...' : text;

    return (
        <section className={styles.hero}>
            {/* Background with Vignette */}
            <div className={styles.heroBackground}>
                <div
                    className={styles.heroImage}
                    style={{ backgroundImage: `url('${getImageUrl(movie.backdrop_path, 'original')}')` }}
                />
                <div className={styles.gradientOverlay} />
                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            <div className={styles.content}>
                <div className={styles.originalLabel}>Kyno+ Original</div>

                <h1 className={styles.title}>{title}</h1>

                <div className={styles.meta}>
                    <span className={styles.newBadge}>New</span>
                    <span>{year}</span>
                    <span className={styles.rating}>★ {rating}</span>
                </div>

                <div className={styles.buttons}>
                    <button className={styles.watchBtn}>
                        <Play className="fill-black" size={20} />
                        Watch Now
                    </button>

                    <button className={styles.actionBtn}>
                        <Plus size={24} />
                        <span>My List</span>
                    </button>

                    <button className={styles.actionBtn}>
                        <Tv size={24} />
                        <span>Trailer</span>
                    </button>
                </div>

                <div className={styles.description}>
                    {displayText}
                </div>

                <div className={styles.genres}>
                    {/* Mock genres for now */}
                    Filmes • Séries
                </div>
            </div>
        </section>
    );
}
