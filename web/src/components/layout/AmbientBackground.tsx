'use client';

import styles from './AmbientBackground.module.css';

export default function AmbientBackground() {
    return (
        <div className={styles.container}>
            {/* The Moving Light Source */}
            <div className={styles.blob} />

            {/* The Glass/Texture Overlay */}
            <div className={styles.glassOverlay} />
        </div>
    );
}
