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
                    alt="Background"
                    fill
                    priority
                    quality={100}
                    unoptimized // Essential for DB url support
                    style={{ objectFit: 'cover', zIndex: 0 }}
                />
            </div>

            {/* Overlays mimicking the Home Hero exactly */}
            <div className={styles.gradientOverlay} />
            <div className={styles.leftVignette} />
            <div className={styles.bottomVignette} />
        </div>
    );
}
