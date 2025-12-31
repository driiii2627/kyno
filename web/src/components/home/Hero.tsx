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
    movies: CatalogItem[]; // In practice, these are CatalogItems
}

import HeroTrailer from './HeroTrailer';



export default function Hero({ movies }: HeroProps) {
    // ... existing state

    // MAINTENANCE: Auto-repair images once
    useEffect(() => {
        // ... (Keep existing)
    }, []);

    // Optimized Hero Component (No Async Fetching in Loop)
    const [shuffledMovies, setShuffledMovies] = useState<CatalogItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Trailer State
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [showImageFallback, setShowImageFallback] = useState(false);
    const [trailerProgress, setTrailerProgress] = useState(0);

    // User Preference
    const [userTrailerPref, setUserTrailerPref] = useState<boolean>(true); // Default true for desktop

    // Preference Notification State


    // INIT: Shuffle & Preferences
    useEffect(() => {
        // 1. Shuffle Movies (Fisher-Yates) on Mount
        // Filter out items without images to ensure high visual quality
        const validMovies = movies.filter(m => m.backdrop_path || m.poster_path);

        let array = [...validMovies];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        setShuffledMovies(array);

        // 2. Check Device/Pref
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        // Default: Image on touch, Trailer on PC
        setUserTrailerPref(!isTouch);
    }, [movies]);

    // Derived State (Instant, No Async)
    const currentMovie = shuffledMovies[currentIndex];
    const hasTrailer = !!(currentMovie?.trailer_url && userTrailerPref);

    // Parse YouTube ID directly from URL
    const trailerId = currentMovie?.trailer_url
        ? (currentMovie.trailer_url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) || [])[1]
        : null;

    // Reset state on slide change
    useEffect(() => {
        setShowImageFallback(false);
        setTrailerProgress(0);

        // Always start playing new slide (Default behavior)
        setIsPlaying(true);

        // Mute state persists across slides
    }, [currentIndex]);

    // Handlers
    const handleNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % shuffledMovies.length);
    }, [shuffledMovies]);

    const handleVideoEnd = useCallback(() => {
        // Auto-advance when video ends
        handleNext();
    }, [handleNext]);

    const handleVideoError = useCallback(() => {
        setShowImageFallback(true);
    }, []);

    // Auto-Rotation Timer (Only if no video or video disabled/fallback)
    useEffect(() => {
        if (!currentMovie) return;

        // If a trailer IS supposed to play, don't rotate on timer (wait for onEnded)
        const isVideoActive = trailerId && userTrailerPref && !showImageFallback;
        // Also don't rotate if user actively paused it (isPlaying === false) and is watching the banner
        if (isVideoActive && isPlaying) return;

        const delay = 7000; // 7 seconds for images
        const timer = setTimeout(handleNext, delay);
        return () => clearTimeout(timer);
    }, [currentIndex, trailerId, userTrailerPref, showImageFallback, currentMovie, handleNext, isPlaying]);

    // Scroll Logic (Pause on scroll)
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > window.innerHeight * 0.5) {
                if (isPlaying) setIsPlaying(false);
            } else {
                // Simplified auto-resume: if we scroll back up, just resume.
                // Since we don't have persistence, we can't know if the user "explicitly" paused it 
                // vs just auto-paused. So this behavior is acceptable for "default" mode.
                if (!isPlaying && !isAutoPausedRef.current) setIsPlaying(true);
            }
        };
        // Debounce or simplistic check
        const isAutoPausedRef = { current: false }; // Simplified for this scope
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isPlaying]);



    const togglePlay = () => {
        const newState = !isPlaying;
        setIsPlaying(newState);


    };

    if (!currentMovie) return null;

    // Data Presentation
    const year = new Date(currentMovie.release_date || currentMovie.first_air_date || Date.now()).getFullYear();
    const rating = currentMovie.vote_average ? currentMovie.vote_average.toFixed(1) : 'N/A';
    const title = currentMovie.title || currentMovie.name || '';
    const genres = currentMovie.genres?.map(g => g.name).join(', ') || currentMovie.genre || 'Filme';
    const isTv = !!currentMovie.first_air_date;
    const linkHref = isTv ? `/serie/${currentMovie.supabase_id}` : `/filme/${currentMovie.supabase_id}`;

    // Background Image
    const backdropUrl = getImageUrl(currentMovie.backdrop_path || '', 'original');

    return (
        <section className={styles.hero}>
            <div className={styles.heroBackground}>
                {/* 
                    Trailer Layer 
                    Condition: ID exists + User Wants + No Error
                */}
                {trailerId && userTrailerPref && !showImageFallback && (
                    <HeroTrailer
                        key={trailerId} // Force remount on ID change
                        videoId={trailerId}
                        isMuted={isMuted}
                        isPlaying={isPlaying}
                        onProgress={setTrailerProgress}
                        onEnded={handleVideoEnd}
                        onError={handleVideoError}
                    />
                )}

                {/* 
                    Image Layer (Fade Transition) with Stable Z-Index Strategy
                    - trailerActive: Lifts image to Z-5 (above video)
                    - trailerPlaying: Sets opacity to 0 (shows video)
                    - Removing trailerPlaying: Sets opacity to 1 (shows image)
                */}
                <div
                    key={currentMovie.id}
                    className={`
                        ${styles.heroImage} 
                        ${styles.active} 
                        ${(trailerId && userTrailerPref && !showImageFallback) ? styles.trailerActive : ''}
                        ${(trailerId && userTrailerPref && !showImageFallback && isPlaying) ? styles.trailerPlaying : ''}
                    `}
                >
                    <OptimizedImage
                        src={backdropUrl}
                        tinySrc={getImageUrl(currentMovie.backdrop_path || '', 'w92')}
                        alt={title}
                        fill
                        className={styles.image}
                        priority={true} // Always prioritize the active hero
                        quality={90}
                        style={{ objectFit: 'cover', zIndex: 0 }}
                    />
                </div>

                <div className={`${styles.gradientOverlay} ${(trailerId && userTrailerPref && !showImageFallback) ? styles.videoMode : ''}`} />

                {/* Paused Overlay: Darkens the screen when video is paused for better readability */}
                <div className={`${styles.pausedOverlay} ${(!isPlaying && trailerId && userTrailerPref && !showImageFallback) ? styles.visible : ''}`} />

                <div className={styles.leftVignette} />
                <div className={styles.bottomVignette} />
            </div>

            {/* Controls Layer */}
            {trailerId && userTrailerPref && !showImageFallback && (
                <div className={styles.trailerControls}>
                    <div className={styles.controlBar}>
                        {/* Dubbed Badge (If title suggests) - Simple heuristic */}
                        {(trailerId && (title.includes('(Dub)') || currentMovie.trailer_url?.toLowerCase().includes('dublado'))) && (
                            <div className={styles.dubBadge}>DUB</div>
                        )}

                        <button onClick={togglePlay} className={styles.controlBtnMain}>
                            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                        </button>

                        <div className={styles.progressBarWrapper}>
                            <div className={styles.progressFill} style={{ width: `${trailerProgress}%` }} />
                        </div>

                        <div className={styles.secondaryControls}>
                            <button onClick={() => setIsMuted(!isMuted)} className={styles.iconBtn}>
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <button onClick={handleNext} className={styles.iconBtn}>
                                <FastForward size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Layer */}
            <div className={`${styles.content} ${(trailerId && userTrailerPref && !showImageFallback && isPlaying) ? styles.minimize : ''}`}>
                {currentMovie.logo_url ? (
                    <div className={styles.logoContainer}>
                        <img src={getImageUrl(currentMovie.logo_url, 'w500')} alt={title} className={styles.heroLogo} />
                    </div>
                ) : (
                    <h1 className={styles.title}>{title}</h1>
                )}

                <div className={styles.meta}>
                    <span className={styles.year}>{year}</span>
                    <div className={styles.separator}>•</div>
                    <span className={styles.rating}><span className={styles.star}>★</span> {rating}</span>
                    <div className={styles.separator}>•</div>
                    <span className={styles.genresText}>{genres}</span>
                </div>

                {/* Description MOVED ABOVE BUTTONS */}
                <div className={styles.description}>
                    {currentMovie.overview && currentMovie.overview.length > 200
                        ? currentMovie.overview.slice(0, 200) + '...'
                        : currentMovie.overview}
                </div>

                <div className={styles.buttons}>
                    <TrackedLink href={linkHref} genres={currentMovie.genres?.map(g => g.name) || []}>
                        <button className={styles.watchBtn}>
                            <Play className="fill-black" size={24} color="black" />
                            Assistir
                        </button>
                    </TrackedLink>
                    <Link href={`/details/${currentMovie.supabase_id}`} className={styles.infoBtn}>
                        <Info size={24} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
