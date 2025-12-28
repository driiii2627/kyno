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

export default function Hero({ movies }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
    const [logoPath, setLogoPath] = useState<string | null>(null);

    const movie = movies[currentIndex] as CatalogItem; // Cast for TS

    // Auto-rotation with variable timer
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const rotate = () => {
            const delay = Math.floor(Math.random() * (8000 - 5000 + 1) + 5000); // 5s to 8s
            timeoutId = setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % movies.length);
                rotate(); // Schedule next
            }, delay);
        };

        rotate(); // Start loop

        return () => clearTimeout(timeoutId);
    }, [movies.length]);

    // Fetch details and LOGO when movie changes
    useEffect(() => {
        if (!movie) return;

        // Reset state immediately to prevent "desync" (showing old logo on new bg)
        setLogoPath(null);
        // setMovieDetails(null); // Optional: keep old details or reset? Resetting avoids mismatch but causes blink.
        // Let's reset details too for correctness, or at least be aware. 
        // Better to have a 'loading' flash than wrong data.

        const fetchDetails = async () => {
            try {
                // Determine type based on properties (fallback logic)
                const isTv = !!movie.first_air_date;
                const type = isTv ? 'tv' : 'movie';

                const [details, images] = await Promise.all([
                    tmdb.getDetails(movie.id, type),
                    tmdb.getImages(movie.id, type)
                ]);

                setMovieDetails(details);

                // Find best logo: PT > EN > First
                const ptLogo = images.logos.find(l => l.iso_639_1 === 'pt');
                const enLogo = images.logos.find(l => l.iso_639_1 === 'en');
                const bestLogo = ptLogo || enLogo || images.logos[0];

                setLogoPath(bestLogo ? bestLogo.file_path : null);

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
