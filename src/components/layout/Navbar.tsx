'use client';

import Link from 'next/link';
import { Search, Bookmark, User, Edit2 } from 'lucide-react';
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

    // Hide Navbar on player routes (filme and serie), Details page, and Login/Auth, and Profiles
    if (pathname?.startsWith('/filme/') || pathname?.startsWith('/serie/') || pathname?.startsWith('/details/') || pathname?.startsWith('/login') || pathname?.startsWith('/auth') || pathname === '/profiles') {
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
    const [profiles, setProfiles] = useState<any[]>([]);
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const { push, refresh } = useRouter();

    useEffect(() => {
        // Fetch All Profiles to list in dropdown
        import('@/app/profiles/actions').then(async ({ getProfilesAction, getActiveProfileAction }) => {
            const { profiles } = await getProfilesAction();
            const { profile } = await getActiveProfileAction();
            if (profiles) setProfiles(profiles);
            if (profile) setActiveProfile(profile);
        });
    }, []);

    const handleSwitch = async (profileId: string) => {
        if (activeProfile?.id === profileId) return;
        const { switchProfileAction } = await import('@/app/profiles/actions');
        setOpen(false); // Close immediately
        const { success } = await switchProfileAction(profileId);
        if (success) {
            refresh();
            // Optional: Optimistic update can be done here if needed
        }
    };

    const handleSignOut = async () => {
        const { signOutAction } = await import('@/app/profiles/actions');
        await signOutAction();
    };

    if (!activeProfile) {
        return (
            <Link href="/profiles" className={styles.iconBtn}>
                <User size={22} />
            </Link>
        );
    }

    return (
        <div className={styles.profileMenuContainer}>
            <div
                className={styles.profileTrigger}
                onClick={() => setOpen(!open)}
            >
                <img src={activeProfile.avatar_url} alt="Profile" className={styles.navAvatar} />
            </div>

            {open && (
                <>
                    <div className={styles.dropdownOverlay} onClick={() => setOpen(false)} />
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownHeader}>
                            <span className={styles.dropdownLabel}>PERFIS</span>
                            <Link href="/profiles?manage=true" className={styles.manageLink}>
                                <Edit2 size={12} />
                                Gerenciar
                            </Link>
                        </div>

                        <div className={styles.profilesList}>
                            {profiles.map(p => (
                                <div
                                    key={p.id}
                                    className={`${styles.profileItem} ${activeProfile.id === p.id ? styles.activeProfileItem : ''}`}
                                    onClick={() => handleSwitch(p.id)}
                                >
                                    <img src={p.avatar_url} className={styles.miniAvatar} />
                                    <span className={styles.profileNameList}>{p.name}</span>
                                    {activeProfile.id === p.id && <div className={styles.activeDot} />}
                                </div>
                            ))}
                        </div>

                        <div className={styles.dropdownDivider} />

                        <div className={styles.menuLinks}>
                            <div className={styles.menuLink}>
                                <Bookmark size={16} />
                                <span>Minha Lista</span>
                            </div>
                            <div className={styles.menuLink}>
                                <User size={16} />
                                <span>Conta</span>
                            </div>
                        </div>

                        <div className={styles.dropdownDivider} />

                        <div className={styles.signOutItem} onClick={handleSignOut}>
                            <span>Sair da Conta</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
