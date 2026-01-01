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
        const popupWidth = 340;
        const popupHeight = 300; // Approx height based on content
        const currentScrollX = window.scrollX;
        const currentScrollY = window.scrollY;

        // "Canto Inferior Direito" Logic:
        // Align center of popup to bottom-right of card
        // Card Bottom Right X = rect.right
        // Card Bottom Right Y = rect.bottom

        // Left = Card Right - (Popup Width / 2)
        let left = (rect.right + currentScrollX) - (popupWidth / 2);

        // Top = Card Bottom - (Popup Height / 2)
        // Shifting it slightly up as requested ("um pouco pra cima")
        let top = (rect.bottom + currentScrollY) - (popupHeight / 2) - 40;

        // Boundary Check
        if (left < 10) left = 10;
        const maxLeft = window.innerWidth - popupWidth - 10;
        if (left > maxLeft) left = maxLeft;

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
        });

    }, [rect]);

    if (!mounted) return null;

    // Type coercion for Supabase ID (known to exist if from CatalogItem/movie table)
    const itemLink = `/details/${(movie as any).supabase_id || movie.id}`;
    const logoUrl = (movie as any).logo_url;

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
                    src={getImageUrl(movie.backdrop_path || movie.poster_path, 'w500')}
                    alt={movie.title || movie.name}
                    className={styles.image}
                />
                <div className={styles.overlay} />

                {/* Logo or Text Fallback */}
                {logoUrl ? (
                    <img
                        src={getImageUrl(logoUrl, 'w500')}
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
                    <Link href={itemLink} className={`${styles.circleBtn} ${styles.playBtn}`}>
                        <Play size={20} fill="black" />
                    </Link>
                    <button className={styles.circleBtn}>
                        <Plus size={20} />
                    </button>
                    <Link href={itemLink} className={styles.circleBtn}>
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
