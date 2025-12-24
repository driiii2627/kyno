'use client';

import Link from 'next/link';
import { Search, Bookmark, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                <Link href="/" className={`${styles.link} ${styles.active}`}>Home</Link>
                <Link href="/movies" className={styles.link}>Filmes</Link>
                <Link href="/series" className={styles.link}>Séries</Link>
                <Link href="/categories" className={styles.link}>Categorias</Link>
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
