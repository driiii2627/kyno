'use client';

import Link from 'next/link';
import { Search, Bookmark, User, Edit2, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import { getProfilesAction, getActiveProfileAction, switchProfileAction, signOutAction } from '@/app/profiles/actions';

import SearchBar from '@/components/search/SearchBar';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
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
            {/* Mobile Left: Novidades (News) */}
            {!isCategoryPage && (
                <Link href="/category/new" className={`${styles.iconBtn} ${styles.mobileOnly} ${styles.newsBtn}`}>
                    <Bell size={20} />
                </Link>
            )}

            {/* Logo - Centered on Mobile via CSS */}
            {!isCategoryPage && (
                <div className={styles.brand}>
                    <Link href="/" className={styles.logo}>
                        Kyno<span>+</span>
                    </Link>
                </div>
            )}

            {/* Search Overlay */}
            <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

            {/* Desktop Nav Links */}
            <div className={styles.navLinks}>
                <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
                <Link href="/category/filmes" className={`${styles.link} ${pathname?.includes('/category/filmes') ? styles.active : ''}`}>Filmes</Link>
                <Link href="/category/series" className={`${styles.link} ${pathname?.includes('/category/series') ? styles.active : ''}`}>Séries</Link>
                <Link href="/category/filmes" className={styles.link}>Categorias</Link>
            </div>

            {/* Icons - Hide on Category Pages */}
            {!isCategoryPage && (
                <div className={styles.actions}>
                    <button
                        className={`${styles.iconBtn} ${styles.desktopOnly}`}
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <Search size={22} />
                    </button>
                    <button className={`${styles.iconBtn} ${styles.desktopOnly}`}>
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
    const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
    const { push, refresh } = useRouter();

    useEffect(() => {
        // Fetch All Profiles to list in dropdown
        const loadProfiles = async () => {
            const { profiles } = await getProfilesAction();
            const { profile } = await getActiveProfileAction();
            if (profiles) setProfiles(profiles);
            if (profile) setActiveProfile(profile);
        };
        loadProfiles();
    }, []);

    const handleSwitch = async (profileId: string) => {
        if (activeProfile?.id === profileId) return;

        // 1. Optimistic Update (Immediate Feedback)
        const targetProfile = profiles.find(p => p.id === profileId);
        if (targetProfile) {
            setActiveProfile(targetProfile);
            setSwitchingProfileId(profileId);
        }

        // 2. Perform Switch in Background
        const { success } = await switchProfileAction(profileId);

        if (success) {
            // 3. Soft Refresh via Next.js Router (No hard reload)
            // Wait slighty for animation to feel natural, then refresh data
            setTimeout(() => {
                refresh();
                setSwitchingProfileId(null);
                setOpen(false); // Close menu
            }, 600);
        } else {
            // Revert on failure (rare)
            const { profile } = await getActiveProfileAction();
            if (profile) setActiveProfile(profile);
            setSwitchingProfileId(null);
        }
    };

    const handleSignOut = async () => {
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
                    <div
                        className={styles.dropdownOverlay}
                        onClick={() => {
                            if (!switchingProfileId) setOpen(false);
                        }}
                    />
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
                                    className={`
                                        ${styles.profileItem} 
                                        ${activeProfile.id === p.id ? styles.activeProfileItem : ''}
                                    `}
                                    onClick={(e) => {
                                        handleSwitch(p.id);
                                    }}
                                >
                                    {/* Ghost Image for Animation */}
                                    {switchingProfileId === p.id && (
                                        <img
                                            src={p.avatar_url}
                                            className={`${styles.miniAvatar} ${styles.flying}`}
                                            style={{
                                                position: 'fixed',
                                                left: `${(document.activeElement?.getBoundingClientRect().left || 0)}px`,
                                                top: `${(document.activeElement?.getBoundingClientRect().top || 0)}px`,
                                            }}
                                        />
                                    )}

                                    {/* Static Image (Keeps layout stable) */}
                                    <img src={p.avatar_url} className={styles.miniAvatar} />

                                    <span className={styles.profileNameList}>{p.name}</span>
                                    {activeProfile.id === p.id && <div className={styles.activeDot} />}
                                    {switchingProfileId === p.id && (
                                        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#4ade80' }}>
                                            Trocando...
                                        </div>
                                    )}
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
