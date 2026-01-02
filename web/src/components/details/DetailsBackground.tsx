'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';
import styles from './DetailsBackground.module.css';

interface DetailsBackgroundProps {
    backdropUrl: string | null;
    mobilePoster?: string | null;
}

export default function DetailsBackground({ backdropUrl, mobilePoster }: DetailsBackgroundProps) {
    // If no backdrop, we can't show anything meaningful globally, but specific mobile poster check below
    if (!backdropUrl && !mobilePoster) return null;

    return (
        <div className={styles.heroBackground}>
            {/* Desktop Image Layer (Hidden on Mobile if mobilePoster exists) */}
            <div className={`${styles.heroImage} ${mobilePoster ? 'hidden md:block' : ''}`}>
                {backdropUrl && (
                    <OptimizedImage
                        src={backdropUrl}
                        tinySrc={backdropUrl.includes('tmdb.org') ? backdropUrl.replace('original', 'w92') : undefined}
                        alt="Background"
                        fill
                        priority
                        quality={90}
                        className={styles.image} // Ensures correct sizing via CSS module
                        style={{ objectFit: 'cover', zIndex: 0 }}
                    />
                )}
            </div>

            {/* Mobile Poster Layer (Visible only on Mobile) */}
            {mobilePoster && (
                <div className={`${styles.heroImage} block md:hidden`}>
                    <OptimizedImage
                        src={mobilePoster}
                        tinySrc={mobilePoster.replace('original', 'w92').replace('w780', 'w92')}
                        alt="Mobile Background"
                        fill
                        priority
                        quality={90}
                        className={styles.image}
                        style={{ objectFit: 'cover', zIndex: 0 }}
                    />
                </div>
            )}

            {/* Overlays mimicking the Home Hero exactly */}
            <div className={styles.gradientOverlay} />
            <div className={styles.leftVignette} />
            <div className={styles.bottomVignette} />
        </div>
    );
}
