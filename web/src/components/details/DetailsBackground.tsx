'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import styles from './DetailsBackground.module.css';

interface DetailsBackgroundProps {
    backdropUrl: string | null;
    mobilePoster?: string | null;
}

import { useEffect, useState } from 'react';

export default function DetailsBackground({ backdropUrl, mobilePoster }: DetailsBackgroundProps) {
    // Default to server backdrop (Desktop)
    const [bgSource, setBgSource] = useState<string | null>(backdropUrl);

    useEffect(() => {
        // Client-side visual check
        const checkMobile = () => {
            // 768px matches standard Tailwind 'md'
            if (window.innerWidth < 768 && mobilePoster) {
                setBgSource(mobilePoster);
            } else {
                setBgSource(backdropUrl);
            }
        };

        // Check on mount
        checkMobile();

        // Optional: Listen to resize if user rotates device
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [backdropUrl, mobilePoster]);

    if (!bgSource) return null;

    return (
        <div className={styles.heroBackground}>
            <div className={styles.heroImage}>
                <OptimizedImage
                    src={bgSource}
                    tinySrc={bgSource.includes('tmdb.org') ? bgSource.replace('original', 'w92').replace('w780', 'w92') : undefined}
                    alt="Background"
                    fill
                    priority
                    quality={100}
                    className={styles.image}
                    style={{ objectFit: 'cover', zIndex: 0 }}
                    unoptimized={true}
                />
            </div>

            <div className={styles.gradientOverlay} />
            <div className={styles.leftVignette} />
            <div className={styles.bottomVignette} />
        </div>
    );
}
