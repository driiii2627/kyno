'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';

// Streaming Services Configuration
const STREAMING_SERVICES = [
    {
        id: 'netflix',
        label: 'Netflix',
        providerId: 8,
        logoUrl: 'https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', // Netflix Logo
        gradientClass: styles.netflix
    },
    {
        id: 'prime',
        label: 'Prime Video',
        providerId: 119,
        // https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg (External)
        // Let's use specific TMDB file paths if possible or generic styles.
        // Found path for Prime from TMDB common usage: /emthp39XA2YScoYL1p0sdbAH2WA.jpg
        logoUrl: 'https://image.tmdb.org/t/p/original/emthp39XA2YScoYL1p0sdbAH2WA.jpg',
        gradientClass: styles.prime
    },
    {
        id: 'disney',
        label: 'Disney+',
        providerId: 337,
        logoUrl: 'https://image.tmdb.org/t/p/original/7rwNKtymnNtefC2A9n9vO7W0D8t.jpg', // Disney+
        gradientClass: styles.disney
    },
    {
        id: 'hbo',
        label: 'HBO Max',
        providerId: 384,
        logoUrl: 'https://image.tmdb.org/t/p/original/zxrVdFj09avcfePa5CsJMq378.jpg', // HBO Max (Max)
        gradientClass: styles.hbo
    },
    {
        id: 'apple',
        label: 'Apple TV+',
        providerId: 350,
        // Let's stick to TMDB paths users commonly use or Wikimedia.
        // Actually for Apple TV, the TMDB logo is often just the Apple logo.
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg',
        gradientClass: styles.apple
    },
    {
        id: 'hulu',
        label: 'Hulu',
        providerId: 15,
        // Fallback to wikimedia for safety
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg',
        gradientClass: styles.hulu
    },
    {
        id: 'globoplay',
        label: 'Globoplay',
        providerId: 307,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Globoplay_logo.svg',
        gradientClass: styles.globoplay
    }
];

export default function BrandNav() {
    return (
        <div className={styles.container}>
            <div className={styles.scrollWrapper}>
                <div className={styles.carousel}>
                    {STREAMING_SERVICES.map((service) => (
                        <Link
                            key={service.id}
                            href={`/search?provider=${service.providerId}&name=${service.label}`}
                            className={styles.brandCard}
                        >
                            <div className={`${styles.brandBackground} ${service.gradientClass}`} />

                            <div className={styles.logoWrapper}>
                                {/* Using Standard IMG for logos with direct URLs */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={service.logoUrl}
                                    alt={service.label}
                                    className={styles.logoImage}
                                    style={{
                                        padding: service.id === 'prime' ? '0 10px' : '0', // Adjust for wide logos
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
