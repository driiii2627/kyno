'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Plus, Info, Check } from 'lucide-react';
import styles from './HoverCard.module.css';
import { Movie, getImageUrl } from '@/services/tmdb';
import Link from 'next/link';

interface HoverCardProps {
    movie: Movie;
    rect: DOMRect; // Source card position to calculate popup position
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function HoverCard({ movie, rect, onMouseEnter, onMouseLeave }: HoverCardProps) {
    const [mounted, setMounted] = useState(false);
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        setMounted(true);
        // Calculate Position
        const popupWidth = 360; // Larger size
        const currentScrollX = window.scrollX;
        const currentScrollY = window.scrollY;

        // Center Horizontally:
        // Card Center = rect.left + rect.width / 2
        // Popup Left = Card Center - popupWidth / 2
        let left = (rect.left + currentScrollX) + (rect.width / 2) - (popupWidth / 2);

        // Position Vertically:
        // Start from card top, but shift up slightly to hover nicely
        // rect.top + currentScrollY -> Card Top in document
        // - 60px -> Shift up
        let top = (rect.top + currentScrollY) - 60;

        // Boundary Check (Viewport)
        // If it goes too far left?
        if (left < 10) left = 10;
        // If it goes too far right?
        const maxLeft = window.innerWidth - popupWidth - 10;
        if (left > maxLeft) left = maxLeft;

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
        });

    }, [rect]);

    if (!mounted) return null;

    // Use a portal to attach to document.body so it floats over everything
    return createPortal(
        <div
            className={styles.hoverCardContainer}
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Banner Section */}
            <div className={styles.imageSection}>
                <img
                    src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w780')}
                    alt={movie.title || movie.name}
                    className={styles.image}
                />
                <div className={styles.overlay} />
                <h4 className={styles.title}>{movie.title || movie.name}</h4>
            </div>

            {/* Content Section */}
            <div className={styles.content}>
                {/* Controls */}
                <div className={styles.controls}>
                    <Link href={`/details/${movie.id}`} className={`${styles.circleBtn} ${styles.playBtn}`}>
                        <Play size={20} fill="black" />
                    </Link>
                    <button className={styles.circleBtn}>
                        <Plus size={20} />
                    </button>
                    <Link href={`/details/${movie.id}`} className={styles.circleBtn}>
                        <Info size={20} />
                    </Link>
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
