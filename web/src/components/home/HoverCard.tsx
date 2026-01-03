'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Plus, Info, Check } from 'lucide-react';
import styles from './HoverCard.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';
import Link from 'next/link';
import DelayedLink from '@/components/ui/DelayedLink';

interface HoverCardProps {
    movie: Movie;
    rect: DOMRect; // Source card position to calculate popup position
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function HoverCard({ movie, rect, onMouseEnter, onMouseLeave }: HoverCardProps) {
    const [mounted, setMounted] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0 }); // Start hidden to measure
    const cardRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Layout Effect to measure and position before paint (or immediately after render)
    React.useLayoutEffect(() => {
        if (!cardRef.current || !rect) return;

        const popupWidth = 340;
        // Measure actual height
        const popupHeight = cardRef.current.offsetHeight || 300;

        const currentScrollX = window.scrollX;
        const currentScrollY = window.scrollY;
        const viewportHeight = window.innerHeight;

        // --- Horizontal Logic ---
        // "Mais pra direita". 
        // Anchor: Center of popup aligns with Right Edge of Card?
        // Let's try: Left = Card Right - (PopupWidth / 2) + 40
        let left = (rect.right + currentScrollX) - (popupWidth / 2) + 40;

        // Boundary Check (Left/Right)
        if (left < 10) left = 10;
        // Prevent right overflow
        const maxLeft = (window.innerWidth + currentScrollX) - popupWidth - 20;
        if (left > maxLeft) left = maxLeft;


        // --- Vertical Logic ---
        // "Desce um pouco mais"
        // Base Anchor: Card Bottom + Scroll
        // Let's center popup vertically on the bottom edge of the card, then shift down slightly.
        // Card Bottom Y = rect.bottom + currentScrollY
        // Popup Center Y = top + (height/2)
        // Desired: Popup Center Y = Card Bottom Y + 10px?
        // top = (rect.bottom + currentScrollY) - (popupHeight / 2) + 10;
        // User complained it was too high before.
        // Before was: (rect.bottom + currentScrollY) - (popupHeight / 2) - 10;
        // Let's drop it lower.

        let top = (rect.bottom + currentScrollY) - (popupHeight / 2) + 20;

        // --- Vertical Boundary / "Borda" Logic ---
        // Check if bottom of popup exceeds viewport bottom
        // Popup Bottom (Absolute) = top + popupHeight
        // Viewport Bottom (Absolute) = currentScrollY + viewportHeight

        const popupBottomAbs = top + popupHeight;
        const viewportBottomAbs = currentScrollY + viewportHeight;
        const padding = 20;

        if (popupBottomAbs > viewportBottomAbs - padding) {
            // Collision detected!
            // Shift UP to match viewport bottom
            top = viewportBottomAbs - popupHeight - padding;
        }

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
            opacity: 1 // Reveal
        });

    }, [rect, mounted]); // dependency on rect ensures update on hover

    if (!mounted) return null;

    // Type coercion for Supabase ID (known to exist if from CatalogItem/movie table)
    const itemLink = `/details/${(movie as any).supabase_id || movie.id}`;
    const logoUrl = (movie as any).logo_url;

    // Use a portal to attach to document.body so it floats over everything
    return createPortal(
        <div
            ref={cardRef}
            className={styles.hoverCardContainer}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Banner Section */}
            <div className={styles.imageSection}>
                <img
                    src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w500')}
                    alt={movie.title || movie.name}
                    className={styles.image}
                />
                <div className={styles.overlay} />

                {/* Logo or Text Fallback */}
                {logoUrl ? (
                    <img
                        src={getImageUrl(logoUrl, 'w500')} // Reverted to w500 as requested
                        alt={movie.title || movie.name}
                        className={styles.logo}
                    />
                ) : (
                    <h4 className={styles.title}>{movie.title || movie.name}</h4>
                )}
            </div>

            {/* Content Section */}
            <div className={styles.content}>
                {/* Controls */}
                <div className={styles.controls}>
                    <DelayedLink href={itemLink} className={`${styles.circleBtn} ${styles.playBtn}`}>
                        <Play size={20} fill="black" />
                    </DelayedLink>
                    <button className={styles.circleBtn}>
                        <Plus size={20} />
                    </button>
                    <DelayedLink href={itemLink} className={styles.circleBtn}>
                        <Info size={20} />
                    </DelayedLink>
                </div>

                {/* Metadata */}
                <div className={styles.metaRow}>
                    <span className={styles.qualityBadge}>HD</span>
                    <span className={styles.ageRating}>14+</span>
                    <span className={styles.duration}>
                        {new Date(movie.release_date || movie.first_air_date || Date.now()).getFullYear()}
                    </span>
                </div>

                {/* Genres (Mocked/Simplified if not available in basic object) */}
                <div className={styles.genres}>
                    <span className={styles.genre}>Mistério</span>
                    <span className={styles.dot} />
                    <span className={styles.genre}>Sci-Fi</span>
                    <span className={styles.dot} />
                    <span className={styles.genre}>Outros</span>
                    {/* In a real app we'd map movie.genre_ids to names */}
                </div>
            </div>
        </div>,
        document.body
    );
}
