'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';

// Map brands to search queries or category pages
const BRANDS = [
    {
        id: 'disney',
        label: 'Disney',
        href: '/search?q=disney',
        gradientClass: styles.disney
    },
    {
        id: 'pixar',
        label: 'Pixar',
        href: '/search?q=pixar',
        gradientClass: styles.pixar
    },
    {
        id: 'marvel',
        label: 'Marvel',
        href: '/search?q=marvel',
        gradientClass: styles.marvel
    },
    {
        id: 'starwars',
        label: 'Star Wars',
        href: '/search?q=star wars',
        gradientClass: styles.starwars
    },
    {
        id: 'dc', // Swapped National Geographic for DC as it's more common in general streaming aggregation
        label: 'DC Comics',
        href: '/search?q=dc comics',
        gradientClass: styles.national // Reusing yellow style for DC/National
    }
];

export default function BrandNav() {
    return (
        <div className={styles.container}>
            <div className={styles.brandGrid}>
                {BRANDS.map((brand) => (
                    <Link key={brand.id} href={brand.href} className={styles.brandCard}>
                        {/* Animated Background Layer */}
                        <div className={`${styles.brandBackground} ${brand.gradientClass}`} />

                        {/* Logo / Text Layer */}
                        <div className={styles.logoText}>
                            {brand.label}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
