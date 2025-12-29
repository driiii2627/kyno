'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import styles from './DetailsBackground.module.css';

interface DetailsBackgroundProps {
    backdropUrl: string | null;
}

export default function DetailsBackground({ backdropUrl }: DetailsBackgroundProps) {
    if (!backdropUrl) return null;

    return (
        <div className={styles.heroBackground}>
            {/* Image Layer */}
            <div className={styles.heroImage}>
                <OptimizedImage
                    src={backdropUrl}
                    tinySrc={backdropUrl.includes('tmdb.org') ? backdropUrl.replace('original', 'w92') : undefined}
                    alt="Background"
                    fill
                    priority
                    quality={90}
                    className={styles.image} // Ensures correct sizing via CSS module
                    style={{ objectFit: 'cover', zIndex: 0 }}
                    unoptimized={!backdropUrl.includes('tmdb.org')} // Disable optimization for non-TMDB (DB) urls to prevent errors
                />
            </div>

            {/* Overlays mimicking the Home Hero exactly */}
            <div className={styles.gradientOverlay} />
            <div className={styles.leftVignette} />
            <div className={styles.bottomVignette} />
        </div>
    );
}
