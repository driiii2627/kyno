'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import DelayedLink from '@/components/ui/DelayedLink';
import { Star } from 'lucide-react';
import styles from './MovieCard.module.css';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Movie, getImageUrl } from '@/services/tmdb';
import { CatalogItem } from '@/services/content';
import RankNumber from './RankNumber';
import HoverCard from './HoverCard';

interface MovieCardProps {
    movie: Movie;
    index: number;
    isTop10?: boolean;
    priority?: boolean;
}

export default function MovieCard({ movie, index, isTop10 = false, priority = false }: MovieCardProps) {
    const item = movie as CatalogItem;
    const linkHref = `/details/${item.supabase_id || item.id}`;

    // Hover Logic
    const [isHovered, setIsHovered] = useState(false);
    const [showPopup, setShowPopup] = useState(false);

    // Timeouts
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cardRef = useRef<HTMLAnchorElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    // Open: Triggered by hovering the card
    const handleMouseEnter = () => {
        // Mobile/Touch Detection Guard
        // 1. Check if device supports true hover (not emulated by touch)
        // 2. Check screen width (Popup is ~340px, needs space)
        const isTouch = window.matchMedia('(hover: none)').matches;
        const isMobile = window.innerWidth < 1024; // Disabling on tablets/mobiles for better UX

        if (isTouch || isMobile) return;

        setIsHovered(true);

        // If we were about to close, cancel it (user moved back to card)
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }

        // If already open, keep it open. If not, start the open timer.
        if (!showPopup) {
            hoverTimeoutRef.current = setTimeout(() => {
                if (cardRef.current) {
                    setRect(cardRef.current.getBoundingClientRect());
                    setShowPopup(true);
                }
            }, 600);
        }
    };

    // Close: Triggered by leaving the card OR the popup
    const handleMouseLeave = () => {
        setIsHovered(false);

        // Cancel any pending open action
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        // Start a grace period before actually closing
        // This allows the user to move from Card -> Popup or Popup -> Card
        closeTimeoutRef.current = setTimeout(() => {
            setShowPopup(false);
        }, 300); // 300ms grace period
    };

    // Keep Open: Triggered when entering the popup (cancels the close timer)
    const handlePopupEnter = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        };
    }, []);

    return (
        <>
            <DelayedLink
                ref={cardRef}
                href={linkHref}
                className={`${styles.card} ${isTop10 ? styles.top10Card : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {isTop10 && <RankNumber rank={index + 1} />}

                <div className={styles.imageWrapper}>
                    <OptimizedImage
                        src={getImageUrl(movie.poster_path, 'w780')}
                        tinySrc={getImageUrl(movie.poster_path, 'w92')}
                        alt={movie.title || movie.name || 'Movie'}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 150px, 300px"
                        quality={100}
                        priority={priority && index < 6}
                    />
                    {/* Internal Overlay (Only text, no popup here) */}
                    <div className={styles.overlay}>
                        <h3 className={styles.movieTitle}>{movie.title || movie.name}</h3>
                        <div className={styles.metaRow}>
                            <div className={styles.rating}>
                                <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                                <span>{movie.vote_average?.toFixed(1) || '0.0'}</span>
                            </div>
                            <span className={styles.year} suppressHydrationWarning>
                                {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                            </span>
                        </div>
                    </div>
                </div>
            </DelayedLink>

            {/* Render Popup via Portal if triggered */}
            {showPopup && rect && (
                <HoverCard
                    movie={movie}
                    rect={rect}
                    onMouseEnter={handlePopupEnter} // Bridge: Keep open when hovering popup
                    onMouseLeave={handleMouseLeave} // Bridge: Start close timer when leaving popup
                />
            )}
        </>
    );
}
