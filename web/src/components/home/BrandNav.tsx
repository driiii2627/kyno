'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';
import Image from 'next/image';

const BRANDS = [
    {
        id: 'disney',
        logoUrl: 'https://image.tmdb.org/t/p/original/wdrCwmRnLFJhEoH8GSf1Sebols3.png',
        href: '/search?q=disney',
        gradientClass: styles.disney
    },
    {
        id: 'pixar',
        logoUrl: 'https://image.tmdb.org/t/p/original/1TjvGVDMYpwCS0xIEHZAdmfb5Hz.png',
        href: '/search?q=pixar',
        gradientClass: styles.pixar
    },
    {
        id: 'marvel',
        logoUrl: 'https://image.tmdb.org/t/p/original/hUzeosd33nzE5MCNsZxCGEKTXaQ.png',
        href: '/search?q=marvel',
        gradientClass: styles.marvel
    },
    {
        id: 'starwars',
        logoUrl: 'https://image.tmdb.org/t/p/original/o86DbpburjxrqAzEDhXZcyE8pDb.png',
        href: '/search?q=star wars',
        gradientClass: styles.starwars
    },
    {
        id: 'dc',
        logoUrl: 'https://image.tmdb.org/t/p/original/2Tc1P3Ac8M479naPp1kYT3izLS5.png',
        href: '/search?q=dc comics',
        gradientClass: styles.national
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
                                // Clean sizing: Contain within the box, center it.
                                width={300}
                                height={150}
                                className={styles.logoImage}
                            />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
