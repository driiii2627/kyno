'use client';

import { Play, Plus, Tv, Info } from 'lucide-react';
import styles from './Hero.module.css';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { Movie, MovieDetails, getImageUrl, tmdb } from '@/services/tmdb';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalogItem } from '@/services/content'; // Import CatalogItem to know about supabase_id
import TrackedLink from '@/components/ui/TrackedLink';

interface HeroProps {
    movies: Movie[]; // In practice, these are CatalogItems
}

import { repairImagePaths } from '@/app/actions/maintenance';

export default function Hero({ movies }: HeroProps) {
    // ... existing state

    // MAINTENANCE: Auto-repair images once
    useEffect(() => {
        const hasRepaired = localStorage.getItem('kyno_img_repair_v1');
        if (!hasRepaired) {
            console.log("Running one-time image DB repair...");
            repairImagePaths().then(() => {
                console.log("DB Repair finished.");
                localStorage.setItem('kyno_img_repair_v1', 'true');
            });
        }
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Helper to fetch data
    const fetchAndSetData = async (movie: CatalogItem, index: number) => {
        try {
            const isTv = !!movie.first_air_date;
            const type = isTv ? 'tv' : 'movie';

            const [details, images] = await Promise.all([
                tmdb.getDetails(movie.id, type),
                tmdb.getImages(movie.id, type)
            ]);

            const ptLogo = images.logos.find(l => l.iso_639_1 === 'pt');
            const enLogo = images.logos.find(l => l.iso_639_1 === 'en');
            const bestLogo = ptLogo || enLogo || images.logos[0];

            // Batch updates (React 18 does this auto, but careful order helps mental model)
            setMovieDetails(details);
            setLogoPath(bestLogo ? bestLogo.file_path : null);
            setCurrentIndex(index);
        } catch (error) {
            console.error("Failed to fetch data", error);
            // Even if details fail, switching index ensures we don't get stuck
            setCurrentIndex(index);
        }
    };

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            if (movies.length > 0) {
                await fetchAndSetData(movies[0] as CatalogItem, 0);
            }
        };
        loadInitial();
    }, [movies]); // Run once on mount/movies change

    // Auto-rotation with pre-fetch
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const rotate = async () => {
            const delay = Math.floor(Math.random() * (8000 - 5000 + 1) + 5000);

            timeoutId = setTimeout(async () => {
                const nextIndex = (currentIndex + 1) % movies.length;
                await fetchAndSetData(movies[nextIndex] as CatalogItem, nextIndex);
                rotate(); // Schedule next
            }, delay);
        };

        // Only start rotation if movies are loaded and we're not in the middle of an initial load
        if (movies.length > 0 && movieDetails) {
            rotate();
        }

        return () => clearTimeout(timeoutId);
    }, [currentIndex, movies, movieDetails]); // Re-run when index changes to schedule NEXT step, or movies/movieDetails change

    if (!movies[currentIndex]) return null;

    const movie = movies[currentIndex] as CatalogItem;

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
            {/* Background with Crossfade Images */}
            <div className={styles.heroBackground}>
                {movies.map((m, index) => (
                    <div
                        key={m.id}
                        className={`${styles.heroImage} ${index === currentIndex ? styles.active : ''}`}
                    >
                        <OptimizedImage
                            src={getImageUrl(m.backdrop_path || '', 'original')}
                            tinySrc={getImageUrl(m.backdrop_path || '', 'w92')}
                            alt={m.title || m.name || 'Hero Background'}
                            fill
                            className={styles.image}
                            priority={index === 0} // Only prioritize the first one
                            sizes="100vw"
                            quality={100} // Force maximum quality to avoid compression artifacts
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                ))}
                <div className={styles.gradientOverlay} />
                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            <div className={styles.content}>
                <div className={styles.topBadges}>
                    <div className={styles.originalLabel}>Kyno+ Destaques</div>
                    {/* Progress Indicator */}
                    <div className={styles.counterBadge}>
                        {currentIndex + 1} / {movies.length}
                    </div>
                </div>

                {/* LOGO or Title */}
                {logoPath ? (
                    <div className={styles.logoContainer}>
                        <img
                            src={getImageUrl(logoPath, 'w500')}
                            alt={title}
                            className={styles.heroLogo}
                        />
                    </div>
                ) : (
                    <h1 className={`${styles.title} ${title.length > 25 ? styles.titleLong : ''}`}>
                        {title}
                    </h1>
                )}

                <div className={styles.meta}>
                    <span className={styles.year}>{year}</span>
                    <div className={styles.separator}>•</div>
                    <span className={styles.rating}>
                        <span className={styles.star}>★</span> {rating}
                    </span>
                    <div className={styles.separator}>•</div>
                    <span className={styles.genresText}>{genres}</span>
                </div>

                <div className={styles.buttons}>
                    <TrackedLink
                        href={linkHref}
                        genres={movieDetails?.genres?.map(g => g.name) || []}
                    >
                        <button className={styles.watchBtn}>
                            <Play className="fill-black" size={24} color="black" />
                            Assistir
                        </button>
                    </TrackedLink>

                    <Link href={linkHref} className={styles.infoBtn}>
                        <Info size={24} />
                    </Link>
                </div>

                <div className={styles.description}>
                    {displayText}
                </div>
            </div>
        </section>
    );
}
