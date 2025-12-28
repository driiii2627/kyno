'use client';

import { Play, Pause, FastForward, Info, Volume2, VolumeX } from 'lucide-react';
import styles from './Hero.module.css';

import OptimizedImage from '@/components/ui/OptimizedImage';
import { Movie, MovieDetails, getImageUrl, tmdb } from '@/services/tmdb';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CatalogItem } from '@/services/content'; // Import CatalogItem to know about supabase_id
import TrackedLink from '@/components/ui/TrackedLink';

interface HeroProps {
    movies: Movie[]; // In practice, these are CatalogItems
}

import HeroTrailer from './HeroTrailer';

const PREFERENCE_KEY = 'kyno_hero_trailer_pref';

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
    const [isMuted, setIsMuted] = useState(true);
    const [trailerProgress, setTrailerProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isAutoPaused, setIsAutoPaused] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [userTrailerPref, setUserTrailerPref] = useState<boolean | null>(null);
    const [isDubbed, setIsDubbed] = useState(false);

    // Initial hardware/preference check
    useEffect(() => {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        setIsTouchDevice(isTouch);

        const savedPref = localStorage.getItem(PREFERENCE_KEY);
        if (savedPref !== null) {
            setUserTrailerPref(savedPref === 'true');
        } else {
            // Default: Image on touch, Trailer on PC
            setUserTrailerPref(!isTouch);
        }
    }, []);

    const toggleTrailerPreference = () => {
        const newPref = !userTrailerPref;
        setUserTrailerPref(newPref);
        localStorage.setItem(PREFERENCE_KEY, String(newPref));

        // If enabling, reset fallback
        if (newPref) setShowImageFallback(false);
    };

    // Skip to next slide
    const handleSkip = useCallback(() => {
        const nextIndex = (currentIndex + 1) % movies.length;
        fetchAndSetData(movies[nextIndex] as CatalogItem, nextIndex);
    }, [currentIndex, movies]);

    // Scroll-to-pause logic
    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = window.innerHeight * 1.05; // 105vh
            const threshold = heroHeight * 0.35;
            const scrollPos = window.scrollY;

            if (scrollPos > threshold && isPlaying && !isAutoPaused) {
                setIsPlaying(false);
                setIsAutoPaused(true);
            } else if (scrollPos <= threshold && isAutoPaused) {
                setIsPlaying(true);
                setIsAutoPaused(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isPlaying, isAutoPaused]);

    // Stable Handlers to prevent HeroTrailer re-renders (Fixes Looping)
    const handleVideoEnd = useCallback(() => {
        const nextIndex = (currentIndex + 1) % movies.length;
        fetchAndSetData(movies[nextIndex] as CatalogItem, nextIndex);
    }, [currentIndex, movies]);

    const handleVideoError = useCallback(() => {
        setShowImageFallback(true);
    }, []);

    const handleProgress = useCallback((p: number) => {
        setTrailerProgress(p);
    }, []);

    // Helper to fetch data
    const fetchAndSetData = async (movie: CatalogItem, index: number) => {
        try {
            const isTv = !!movie.first_air_date;
            const type = isTv ? 'tv' : 'movie';

            // Reset state
            setTrailerId(null);
            setShowImageFallback(false);
            setTrailerProgress(0);

            const [details, images, videos] = await Promise.all([
                tmdb.getDetails(movie.id, type),
                tmdb.getImages(movie.id, type),
                tmdb.getVideos(movie.id, type)
            ]);

            // Filter Videos: Strict "Dublado" Preference
            // User complained that generic 'pt' videos are often just subtitled.
            // We search explicitly for "Dublado" in the title.
            // Filter and Score Videos: Prioritize PT-BR with Quality
            const candidates = videos.results
                .filter(v => v.iso_639_1 === 'pt' && v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
                .map(v => {
                    let score = 0;
                    const name = v.name.toLowerCase();

                    if (name.includes('dublado')) score += 100;
                    if (name.includes('[dub]') || name.includes('| dub') || name.includes('(dub)') || name.includes('dub ')) score += 90;
                    if (v.official) score += 50;
                    if (name.includes('brasil') || name.includes(' br ') || name.endsWith(' br')) score += 40;
                    if (name.includes('oficial') || name.includes('official')) score += 30;
                    if (name.includes('4k') || name.includes('1080')) score += 20;
                    if (v.type === 'Trailer') score += 10;
                    if (name.includes('legendado')) score -= 100; // Even heavier penalty for subtitles

                    return { ...v, score };
                })
                .sort((a, b) => b.score - a.score);

            const bestTrailer = candidates[0];

            // Stricter Guard: Only set trailer if it has a decent score (likely PT-BR or high quality)
            // If the best candidate is still weak (e.g. score < 30), we might be looking at a random EN result
            if (bestTrailer && bestTrailer.score >= 30) {
                setTrailerId(bestTrailer.key);
                setIsDubbed(bestTrailer.score >= 90);
            } else {
                setTrailerId(null);
                setIsDubbed(false);
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
            {/* Background with Crossfade Images */}
            <div className={styles.heroBackground}>
                {/* 
                    SINGLETON TRAILER PLAYER
                    Moved outside the map to prevent re-mounting/looping bugs during state changes.
                    Key added to force remount ONLY when video changes.
                */}
                {/* 
                    SINGLETON TRAILER PLAYER
                    Show only if:
                    1. We have a trailerId
                    2. User preference allows it (on PC default true, on Mobile default false)
                    3. No error fallback
                */}
                {trailerId && userTrailerPref && !showImageFallback && (
                    <HeroTrailer
                        key={trailerId}
                        videoId={trailerId}
                        isMuted={isMuted}
                        isPlaying={isPlaying}
                        onProgress={handleProgress}
                        onEnded={handleVideoEnd}
                        onError={handleVideoError}
                    />
                )}

                {movies.map((m, index) => (
                    <div
                        key={m.id}
                        className={`${styles.heroImage} ${index === currentIndex ? styles.active : ''}`}
                    >
                        {/* Image Fallback (Always rendered behind) */}
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
                                // If trailer is playing, image stays behind (z-index 0)
                                zIndex: 0
                            }}
                        />
                    </div>
                ))}

                {/* Overlay with dynamic class for video mode */}
                <div
                    className={`${styles.gradientOverlay} ${(trailerId && userTrailerPref && !showImageFallback) ? styles.videoMode : ''}`}
                />

                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            {/* TRAILER CONTROLS (Lifted to Parent for Z-Index Fix) */}
            {trailerId && userTrailerPref && !showImageFallback && (
                <div className={styles.trailerControls}>
                    {/* Glassmorphism Logic in CSS */}
                    <div className={styles.controlBar}>
                        {/* Status Badge */}
                        {isDubbed && <div className={styles.dubBadge}>DUB</div>}

                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={styles.controlBtnMain}
                            title={isPlaying ? "Pausar" : "Reproduzir"}
                        >
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                        </button>

                        {/* Progress Bar (Integrated) */}
                        <div className={styles.progressBarWrapper}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${trailerProgress}%` }}
                            />
                        </div>

                        <div className={styles.secondaryControls}>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={styles.iconBtn}
                                title={isMuted ? "Ativar Áudio" : "Mutar"}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>

                            <button
                                onClick={handleSkip}
                                className={styles.iconBtn}
                                title="Próximo"
                            >
                                <FastForward size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
