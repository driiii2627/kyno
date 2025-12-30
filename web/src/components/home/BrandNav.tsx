'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';
import Image from 'next/image';

const BRANDS = [
    {
        id: 'disney',
        // Disney+ White Logo
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
        href: '/search?q=disney',
        gradientClass: styles.disney
    },
    {
        id: 'national-geographic',
        // National Geographic Yellow Box Logo
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/National_Geographic_Logo.svg',
        href: '/search?q=national geographic',
        gradientClass: styles.national
    },
    {
        id: 'marvel',
        // Marvel Studios White/Red Logo
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/w/w4/Marvel_Studios_2016_logo.svg',
        href: '/search?q=marvel',
        gradientClass: styles.marvel
    },
    {
        id: 'starwars',
        // Star Wars White Logo
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Star_wars2.svg',
        href: '/search?q=star wars',
        gradientClass: styles.starwars
    },
    {
        id: 'dc',
        // DC Comics White Logo (Blue standard, but white fits dark mode better - using a white variant or standard blue which is visible)
        // Using standard blue/white sticker
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/DC_Comics_2016.svg',
        href: '/search?q=dc comics',
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

                        {/* Logo Layer */}
                        <div className={styles.logoWrapper}>
                            <Image
                                src={brand.logoUrl}
                                alt={brand.id}
                                width={300}
                                height={150}
                                className={styles.logoImage}
                                unoptimized={true} // Needed for external SVG/Wikimedia
                            />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
