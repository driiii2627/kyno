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

import HeroTrailer from './HeroTrailer';

export default function Hero({ movies }: HeroProps) {
    // ... existing state

    // MAINTENANCE: Auto-repair images once
    useEffect(() => {
        // ... (Keep existing)
    }, []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [movieDetails, setMovieDetails] = useState<MovieDetails | null>(null);
    const [logoPath, setLogoPath] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Trailer State
    const [trailerId, setTrailerId] = useState<string | null>(null);
    const [showImageFallback, setShowImageFallback] = useState(false);

    // Helper to fetch data
    const fetchAndSetData = async (movie: CatalogItem, index: number) => {
        try {
            const isTv = !!movie.first_air_date;
            const type = isTv ? 'tv' : 'movie';

            // Reset trailer state for new slide
            setTrailerId(null);
            setShowImageFallback(false);

            const [details, images, videos] = await Promise.all([
                tmdb.getDetails(movie.id, type),
                tmdb.getImages(movie.id, type),
                tmdb.getVideos(movie.id, type)
            ]);

            // Filter Videos: Strict PT-BR Preference
            // User: "Só daremos preferência a trailers em pt-br, não tem tem pt-br? Continua apenas com a imagem"
            const ptTrailer = videos.results.find(v =>
                v.iso_639_1 === 'pt' &&
                v.site === 'YouTube' &&
                v.type === 'Trailer'
            );

            // If PT trailer found, set it. Else, null (remains null -> image only)
            if (ptTrailer) {
                setTrailerId(ptTrailer.key);
            }

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

    // Video End Handler
    const handleVideoEnd = () => {
        // Force rotation
        const nextIndex = (currentIndex + 1) % movies.length;
        fetchAndSetData(movies[nextIndex] as CatalogItem, nextIndex);
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
            // If trailer is playing, DO NOT rotate automatically.
            // The HeroTrailer onEnded event will handle the rotation.
            if (trailerId && !showImageFallback) {
                return;
            }

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
    }, [currentIndex, movies, movieDetails, trailerId, showImageFallback]); // Added trailer dependencies

    if (!movies[currentIndex]) return null;

    // ... existing variable definitions ...

    // ... (Use same constants) ...
    const movie = movies[currentIndex] as CatalogItem;
    const year = new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear();
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const title = movie.title || movie.name || '';
    const genres = movieDetails?.genres?.slice(0, 2).map(g => g.name).join(', ') || 'Variados';
    const MAX_LENGTH = 200;
    const text = movie.overview || '';
    const displayText = text.length > MAX_LENGTH ? text.slice(0, MAX_LENGTH) + '...' : text;
    const isTv = !!movie.first_air_date;
    const linkHref = isTv ? `/serie/${movie.supabase_id}` : `/filme/${movie.supabase_id}`;

    return (
        <section className={styles.hero}>
            {/* Background logic in other replace call */}
            {/* Background with Crossfade Images */}
            <div className={styles.heroBackground}>
                {movies.map((m, index) => (
                    <div
                        key={m.id}
                        className={`${styles.heroImage} ${index === currentIndex ? styles.active : ''}`}
                    >
                        {/* 
                           FEATURE TEST: Background Trailer
                           Only show for current index AND if we have a trailerId AND not showing image fallback 
                        */}
                        {index === currentIndex && trailerId && !showImageFallback ? (
                            <HeroTrailer
                                videoId={trailerId}
                                onEnded={handleVideoEnd}
                                onError={() => setShowImageFallback(true)}
                            />
                        ) : null}

                        {/* Image Fallback (Always rendered behind or if trailer fails) */}
                        <OptimizedImage
                            src={getImageUrl(m.backdrop_path || '', 'original')}
                            tinySrc={getImageUrl(m.backdrop_path || '', 'w92')}
                            alt={m.title || m.name || 'Hero Background'}
                            fill
                            className={styles.image}
                            priority={index === 0} // Only prioritize the first one
                            sizes="100vw"
                            quality={100} // Force maximum quality to avoid compression artifacts
                            style={{
                                objectFit: 'cover',
                                // If trailer is playing, hide image? Or keep behind? 
                                // Keep behind strictly to avoid flicker. 
                                // But if trailer is opaque, fine.
                                // If trailer is playing, we might want to fade image out? 
                                // For now, simple stacking.
                                zIndex: (index === currentIndex && trailerId && !showImageFallback) ? 0 : 1
                            }}
                        />
                    </div>
                ))}
                <div className={styles.gradientOverlay} />
                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            <div className={styles.content}>
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

                {/* Counter Badge Removed - Replaced by Video Progress in HeroTrailer */}
                {/* <div className={styles.counterBadge}> ... </div> */}

                <div className={styles.meta}>

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
