'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
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
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const cardRef = useRef<HTMLAnchorElement>(null);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Delay popup by 600ms to avoid flashing while scrolling
        hoverTimeoutRef.current = setTimeout(() => {
            if (cardRef.current) {
                setRect(cardRef.current.getBoundingClientRect());
                setShowPopup(true);
            }
        }, 600);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowPopup(false);
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    return (
        <>
            <Link
                ref={cardRef}
                href={linkHref}
                className={`${styles.card} ${isTop10 ? styles.top10Card : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {isTop10 && <RankNumber rank={index + 1} />}

                <div className={styles.imageWrapper}>
                    <OptimizedImage
                        src={getImageUrl(movie.poster_path, 'original')}
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
            </Link>

            {/* Render Popup via Portal if triggered */}
            {showPopup && rect && (
                <HoverCard
                    movie={movie}
                    rect={rect}
                    onClose={handleMouseLeave} // Close if they leave the popup area too (handled in component)
                />
            )}
        </>
    );
}
