'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Sparkles } from 'lucide-react';
import styles from './MobileNavbar.module.css';

export default function MobileNavbar() {
    const pathname = usePathname();

    // Hide on specific routes like player or auth
    if (pathname?.startsWith('/filme/') || pathname?.startsWith('/serie/') || pathname?.startsWith('/details/') || pathname?.startsWith('/login') || pathname?.startsWith('/auth') || pathname === '/profiles') {
        return null;
    }

    const navItems = [
        {
            label: 'Home',
            icon: Home,
            href: '/',
            isActive: pathname === '/',
            isFeatured: false
        },
        {
            label: 'Buscar',
            icon: Search,
            href: '/search',
            isActive: pathname === '/search',
            isFeatured: true
        },
        {
            label: 'Favoritos',
            icon: Heart,
            href: '/my-list',
            isActive: pathname === '/my-list',
            isFeatured: false
        }
    ];

    return (
        <nav className={styles.mobileNav}>
            <div className={styles.navItems}>
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={`
                            ${item.isFeatured ? styles.featuredItem : styles.navItem} 
                            ${item.isActive ? styles.activeItem : ''}
                        `}
                    >
                        <item.icon size={item.isFeatured ? 28 : 24} strokeWidth={item.isActive ? 2.5 : 2} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}
