'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';

const BRANDS = [
    {
        id: 'disney',
        label: 'Disney',
        href: '/search?q=disney',
        logoClass: styles.textDisney,
        gradientClass: styles.disney
    },
    {
        id: 'pixar',
        label: 'Pixar',
        href: '/search?q=pixar',
        logoClass: styles.textPixar,
        gradientClass: styles.pixar
    },
    {
        id: 'marvel',
        label: 'MARVEL',
        href: '/search?q=marvel',
        logoClass: styles.textMarvel,
        gradientClass: styles.marvel
    },
    {
        id: 'starwars',
        label: 'STAR WARS',
        href: '/search?q=star wars',
        logoClass: styles.textStarWars,
        gradientClass: styles.starwars
    },
    {
        id: 'dc',
        label: 'DC',
        href: '/search?q=dc comics',
        logoClass: styles.textDC,
        gradientClass: styles.dc
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

                        {/* Styled Text Layer */}
                        <div className={styles.logoWrapper}>
                            <span className={`${styles.brandText} ${brand.logoClass}`}>
                                {brand.label}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
