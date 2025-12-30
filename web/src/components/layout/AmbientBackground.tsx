'use client';

import styles from './AmbientBackground.module.css';

export default function AmbientBackground() {
    return (
        <div className={styles.container}>
            <div className={styles.gradient} />
        </div>
    );
}
