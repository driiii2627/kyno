'use client';

import { Play, Plus, Tv } from 'lucide-react';
import styles from './Hero.module.css';
import Image from 'next/image';
import { Movie, MovieDetails, getImageUrl, tmdb } from '@/services/tmdb';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalogItem } from '@/services/content'; // Import CatalogItem to know about supabase_id

interface HeroProps {
    movies: Movie[]; // In practice, these are CatalogItems
}

export default function Hero({ movies }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);

    const movie = movies[currentIndex] as CatalogItem; // Cast for TS

    // Auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 8000); // 8 seconds per slide
        return () => clearInterval(interval);
    }, [movies.length]);

    // Fetch details when movie changes
    useEffect(() => {
        if (!movie) return;

        const fetchDetails = async () => {
            try {
                // Determine type based on properties (fallback logic)
                const isTv = !!movie.first_air_date;
                const type = isTv ? 'tv' : 'movie';
                const details = await tmdb.getDetails(movie.id, type);
                setMovieDetails(details);
            } catch (error) {
                console.error("Failed to fetch details", error);
            }
        };

        fetchDetails();
    }, [movie]);

    if (!movie) return null;

    const year = new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear();
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const title = movie.title || movie.name || '';

    // Meta Logic
    const genres = movieDetails?.genres?.slice(0, 2).map(g => g.name).join(', ') || 'Variados';

    let duration = '';
    if (movieDetails?.runtime) {
        const h = Math.floor(movieDetails.runtime / 60);
        const m = movieDetails.runtime % 60;
        duration = `${h}h ${m} m`;
    } else if (movieDetails?.episode_run_time && movieDetails.episode_run_time.length > 0) {
        duration = `${movieDetails.episode_run_time[0]} m(Ep)`;
    }

    // Truncate logic
    const MAX_LENGTH = 200;
    const text = movie.overview || '';
    const displayText = text.length > MAX_LENGTH ? text.slice(0, MAX_LENGTH) + '...' : text;

    // Link Logic
    const isTv = !!movie.first_air_date;
    const linkHref = isTv
        ? `/serie/${movie.supabase_id}`
        : `/filme/${movie.supabase_id}`;

    return (
        <section className={styles.hero}>
            {/* Background with Vignette */}
            {/* Background with Crossfade Images */}
            <div className={styles.heroBackground}>
                {movies.map((m, index) => (
                    <div
                        key={m.id}
                        className={`${styles.heroImage} ${index === currentIndex ? styles.active : ''}`}
                    >
                        <Image
                            src={getImageUrl(m.backdrop_path || '', 'w1280')}
                            alt={m.title || m.name || 'Hero Background'}
                            fill
                            className={styles.image}
                            priority={index === 0} // Only prioritize the first one
                            loading={index === 0 ? 'eager' : 'lazy'}
                            // "unoptimized" is global in next.config.ts, but explicit here doesn't hurt if we want to be sure
                            sizes="100vw"
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                ))}
                <div className={styles.gradientOverlay} />
                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            <div className={styles.content}>
                <div className={styles.originalLabel}>Kyno+ Destaques</div>

                <h1 className={`${styles.title} ${title.length > 25 ? styles.titleLong : ''}`}>
                    {title}
                </h1>

                <div className={styles.meta}>
                    <span className={styles.year}>{year}</span>
                    <div className={styles.separator}>•</div>
                    <span className={styles.genresText}>{genres}</span>
                    {duration && (
                        <>
                            <div className={styles.separator}>•</div>
                            <span className={styles.duration}>{duration}</span>
                        </>
                    )}
                    <div className={styles.separator}>•</div>
                    <span className={styles.rating}>
                        <span className={styles.star}>★</span> {rating}
                    </span>
                </div>

                <div className={styles.buttons}>
                    <Link href={linkHref} passHref>
                        <button className={styles.watchBtn}>
                            <Play className="fill-black" size={20} />
                            Assistir
                        </button>
                    </Link>

                    <button className={styles.actionBtn}>
                        <Plus size={24} />
                        <span>Minha Lista</span>
                    </button>

                    <button className={styles.actionBtn}>
                        <Tv size={24} />
                        <span>Trailer</span>
                    </button>
                </div>

                <div className={styles.description}>
                    {displayText}
                </div>
            </div>
        </section>
    );
}
