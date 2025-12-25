'use client';

import { Play, Plus, Tv } from 'lucide-react';
import styles from './Hero.module.css';
import { Movie, MovieDetails, getImageUrl, tmdb } from '@/services/tmdb';
import { useState, useEffect } from 'react';

interface HeroProps {
    movies: Movie[];
}

export default function Hero({ movies }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);

    const movie = movies[currentIndex];

    // Auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            handleNext();
        }, 8000); // 8 seconds per slide
        return () => clearInterval(interval);
    }, [currentIndex, movies.length]); // Added movies.length to dependencies

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

    // Auto-rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 8000); // 8 seconds per slide
        return () => clearInterval(interval);
    }, [currentIndex, movies.length]);

    if (!movie) return null;

    const year = new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear();
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const title = movie.title || movie.name;

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

    return (
        <section className={styles.hero}>
            {/* Background with Vignette */}
            {/* Background with Crossfade Images */}
            <div className={styles.heroBackground}>
                {movies.map((m, index) => (
                    <div
                        key={m.id}
                        className={`${styles.heroImage} ${index === currentIndex ? styles.active : ''}`}
                        style={{
                            backgroundImage: `url(${getImageUrl(m.backdrop_path || '', 'original')})`,
                            zIndex: index === currentIndex ? 1 : 0
                        }}
                    />
                ))}
                <div className={styles.gradientOverlay} />
                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            <div className={styles.content}>
                <div className={styles.originalLabel}>Kyno+ Destaques</div>

                <h1 className={styles.title}>{title}</h1>

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
            </div>
        </section>
    );
}
