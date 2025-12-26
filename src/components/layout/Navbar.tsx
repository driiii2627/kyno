'use client';

import Link from 'next/link';
import { Search, Bookmark, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Hide Navbar on player routes (filme and serie) AND Details page
    if (pathname?.startsWith('/filme/') || pathname?.startsWith('/serie/') || pathname?.startsWith('/details/')) {
        return null; // Don't render navbar on player or details pages
    }

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
            {/* Logo */}
            <div className={styles.brand}>
                <Link href="/" className={styles.logo}>
                    Kyno<span>+</span>
                </Link>
            </div>

            {/* Navigation Links */}
            <div className={styles.navLinks}>
                <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
                <Link href="/category/filmes" className={`${styles.link} ${pathname?.includes('/category/filmes') ? styles.active : ''}`}>Filmes</Link>
                <Link href="/category/series" className={`${styles.link} ${pathname?.includes('/category/series') ? styles.active : ''}`}>Séries</Link>
                {/* Categories usually implies a browse page, but we'll leave it as /categories if that route exists, or link to movies for now */}
                <Link href="/category/filmes" className={styles.link}>Categorias</Link>
            </div>

            {/* Icons */}
            <div className={styles.actions}>
                <button className={styles.iconBtn}>
                    <Search size={22} />
                </button>
                <button className={styles.iconBtn}>
                    <Bookmark size={22} />
                </button>
                <button className={styles.iconBtn}>
                    <User size={22} />
                </button>
            </div>
        </nav>
    );
}
