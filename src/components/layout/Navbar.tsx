'use client';

import Link from 'next/link';
import { Search, Bookmark, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

    // Hide Navbar on player routes (filme and serie), Details page, and Login/Auth
    if (pathname?.startsWith('/filme/') || pathname?.startsWith('/serie/') || pathname?.startsWith('/details/') || pathname?.startsWith('/login') || pathname?.startsWith('/auth')) {
        return null;
    }

    // Check if we are on a category page
    const isCategoryPage = pathname?.startsWith('/category/');

    return (
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} style={isCategoryPage ? { padding: '1rem', justifyContent: 'center' } : {}}>
            {/* Logo - Hide on Category Pages */}
            {!isCategoryPage && (
                <div className={styles.brand}>
                    <Link href="/" className={styles.logo}>
                        Kyno<span>+</span>
                    </Link>
                </div>
            )}

            {/* Navigation Links */}
            <div className={styles.navLinks}>
                <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
                <Link href="/category/filmes" className={`${styles.link} ${pathname?.includes('/category/filmes') ? styles.active : ''}`}>Filmes</Link>
                <Link href="/category/series" className={`${styles.link} ${pathname?.includes('/category/series') ? styles.active : ''}`}>Séries</Link>
                <Link href="/category/filmes" className={styles.link}>Categorias</Link>
            </div>

            {/* Icons - Hide on Category Pages */}
            {!isCategoryPage && (
                <div className={styles.actions}>
                    <button className={styles.iconBtn}>
                        <Search size={22} />
                    </button>
                    <button className={styles.iconBtn}>
                        <Bookmark size={22} />
                    </button>

                    {/* Profile Menu instead of static User icon */}
                    <ProfileMenu />
                </div>
            )}
        </nav>
    );
}

function ProfileMenu() {
    const [profile, setProfile] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const { push } = useRouter();

    useEffect(() => {
        import('@/app/profiles/actions').then(async ({ getActiveProfileAction }) => {
            const { profile } = await getActiveProfileAction();
            setProfile(profile);
        });
    }, []);

    const handleSignOut = async () => {
        const { signOutAction } = await import('@/app/profiles/actions');
        await signOutAction();
    };

    if (!profile) {
        // Fallback or loading state
        return (
            <Link href="/profiles" className={styles.iconBtn}>
                <User size={22} />
            </Link>
        );
    }

    return (
        <div className={styles.profileMenuContainer} onMouseLeave={() => setOpen(false)}>
            <div
                className={styles.profileTrigger}
                onMouseEnter={() => setOpen(true)}
                onClick={() => setOpen(!open)}
            >
                <img src={profile.avatar_url} alt="Profile" className={styles.navAvatar} />
            </div>

            {open && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <p>{profile.name}</p>
                    </div>
                    <div className={styles.dropdownItem} onClick={() => push('/profiles')}>
                        Trocar de Perfil
                    </div>
                    {/* Future: Editar Perfil link can be added here */}
                    <div className={styles.dropdownItem} onClick={handleSignOut} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        Sair da Conta
                    </div>
                </div>
            )}
        </div>
    );
}
