'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Sparkles } from 'lucide-react';
import styles from './MobileNavbar.module.css';

import { useState } from 'react';
import SearchBar from '@/components/search/SearchBar';

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

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <nav className={styles.mobileNav}>
                <div className={styles.navItems}>
                    {navItems.map((item) => {
                        const isSearch = item.label === 'Buscar';
                        const Component = isSearch ? 'button' : Link;
                        const props = isSearch ? {
                            onClick: () => setIsSearchOpen(true),
                            className: `${item.isFeatured ? styles.featuredItem : styles.navItem} ${isSearchOpen ? styles.activeItem : ''}`,
                            type: 'button' as 'button'
                        } : {
                            href: item.href,
                            className: `${item.isFeatured ? styles.featuredItem : styles.navItem} ${item.isActive ? styles.activeItem : ''}`
                        };

                        return (
                            // @ts-ignore
                            <Component
                                key={item.label}
                                {...props}
                            >
                                <item.icon size={item.isFeatured ? 28 : 24} strokeWidth={item.isActive || (isSearch && isSearchOpen) ? 2.5 : 2} />
                                <span>{item.label}</span>
                            </Component>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
