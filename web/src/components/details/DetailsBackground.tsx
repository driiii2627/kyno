'use client';

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
                <img
                    src={backdropUrl}
                    alt="Background"
                    className={styles.image}
                />
            </div>

            {/* Overlays mimicking the Home Hero exactly */}
            <div className={styles.gradientOverlay} />
            <div className={styles.leftVignette} />
            <div className={styles.bottomVignette} />
        </div>
    );
}
