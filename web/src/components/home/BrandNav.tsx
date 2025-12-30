'use client';

import styles from './BrandNav.module.css';
import Link from 'next/link';

export interface FranchiseData {
    id: string;
    label: string;
    logoUrl?: string;
    gradientClass: string;
    backdropUrl?: string; // Optional custom bg logic
}

interface BrandNavProps {
    items: FranchiseData[];
}

// Fallback static brands if no dynamic ones found
const STATIC_FALLBACK: FranchiseData[] = [
    { id: 'disney', label: 'Disney', gradientClass: styles.disney, logoUrl: 'static' },
    { id: 'marvel', label: 'Marvel', gradientClass: styles.marvel, logoUrl: 'static' },
    { id: 'starwars', label: 'Star Wars', gradientClass: styles.starwars, logoUrl: 'static' },
    { id: 'dc', label: 'DC', gradientClass: styles.dc, logoUrl: 'static' },
];

export default function BrandNav({ items = [] }: BrandNavProps) {
    // Determine what to show: Dynamic items OR Fallback
    const displayItems = items.length > 0 ? items : STATIC_FALLBACK;

    return (
        <div className={styles.container}>
            <div className={styles.brandGrid}>
                {displayItems.map((brand) => (
                    <Link
                        key={brand.id}
                        href={`/search?q=${brand.label.toLowerCase()}`}
                        className={styles.brandCard}
                        style={brand.logoUrl !== 'static' ? {
                            // Dynamic Gradient override if passed raw CSS
                            background: brand.gradientClass.includes('gradient') ? brand.gradientClass : undefined
                        } : undefined}
                    >
                        {/* Background Layer (CSS Class or Dynamic) */}
                        <div
                            className={`${styles.brandBackground} ${!brand.gradientClass.includes('gradient') ? brand.gradientClass : ''}`}
                        />

                        {/* Content Layer */}
                        <div className={styles.logoWrapper}>
                            {brand.logoUrl && brand.logoUrl !== 'static' ? (
                                // Render DB Logo
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${brand.logoUrl}`}
                                    alt={brand.label}
                                    className={styles.logoImage}
                                />
                            ) : (
                                // Render Styled Text (Fallback or Static)
                                <span className={`${styles.brandText} ${getStaticTextClass(brand.id)}`}>
                                    {brand.label}
                                </span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// Helper to map ID to legacy text style class
function getStaticTextClass(id: string) {
    if (id.includes('disney')) return styles.textDisney;
    if (id.includes('marvel')) return styles.textMarvel;
    if (id.includes('starwars')) return styles.textStarWars;
    if (id.includes('dc')) return styles.textDC;
    if (id.includes('pixar')) return styles.textPixar;
    return ''; // Default font
}
