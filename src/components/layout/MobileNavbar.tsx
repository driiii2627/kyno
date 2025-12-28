'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Sparkles } from 'lucide-react';
import styles from './MobileNavbar.module.css';

export default function MobileNavbar() {
    const pathname = usePathname();

    // Hide on specific routes like player or auth
    if (pathname?.startsWith('/filme/') || pathname?.startsWith('/serie/') || pathname?.startsWith('/login') || pathname?.startsWith('/auth') || pathname === '/profiles') {
        return null;
    }

    const navItems = [
        {
            label: 'Home',
            icon: Home,
            href: '/',
            isActive: pathname === '/'
        },
        {
            label: 'Buscar',
            icon: Search,
            href: '/search', // Assuming /search route exists or will be created/redirected
            isActive: pathname === '/search'
        },
        {
            label: 'Favoritos',
            icon: Heart,
            href: '/my-list', // Placeholder, using profiles for now or just generic
            isActive: pathname === '/my-list'
        },
        {
            label: 'Novidades',
            icon: Sparkles,
            href: '/category/new',
            isActive: pathname === '/category/new'
        }
    ];

    return (
        <nav className={styles.mobileNav}>
            <div className={styles.navItems}>
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`${styles.navItem} ${item.isActive ? styles.activeItem : ''}`}
                    >
                        <item.icon size={24} strokeWidth={item.isActive ? 2.5 : 2} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
