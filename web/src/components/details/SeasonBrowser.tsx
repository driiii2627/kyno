'use client';

import { useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, ChevronDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { SeasonDetails, Episode, getImageUrl } from '@/services/tmdb';
import { getSeason } from '@/app/actions';
import styles from './SeasonBrowser.module.css';

interface SeasonBrowserProps {
    tmdbId: number;
    uuid: string;
    seasons: {
        season_number: number;
        name: string;
        episode_count: number;
    }[];
    initialSeasonData: SeasonDetails;
}

export default function SeasonBrowser({ tmdbId, uuid, seasons, initialSeasonData }: SeasonBrowserProps) {
    const [activeSeason, setActiveSeason] = useState(initialSeasonData.season_number);
    const [episodes, setEpisodes] = useState<Episode[]>(initialSeasonData.episodes);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Filter out Season 0 (Specials) if desired, or keep them. Usually users want Season 1 first.
    const validSeasons = seasons.filter(s => s.season_number > 0);
    const currentSeasonName = validSeasons.find(s => s.season_number === activeSeason)?.name || `Temporada ${activeSeason}`;

    const handleSeasonChange = async (seasonNum: number) => {
        if (seasonNum === activeSeason) {
            setDropdownOpen(false);
            return;
        }

        setLoading(true);
        setDropdownOpen(false);
        setActiveSeason(seasonNum);

        try {
            const data = await getSeason(tmdbId, seasonNum);
            setEpisodes(data.episodes);
        } catch (error) {
            console.error("Failed to fetch season", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.dropdownContainer}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={styles.seasonButton}
                    >
                        {currentSeasonName}
                        <ChevronDown className={`${styles.chevron} ${dropdownOpen ? styles.chevronRotated : ''}`} size={24} />
                    </button>

                    {/* Season Dropdown */}
                    {dropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            {validSeasons.map(s => (
                                <button
                                    key={s.season_number}
                                    onClick={() => handleSeasonChange(s.season_number)}
                                    className={`${styles.dropdownItem} ${activeSeason === s.season_number ? styles.dropdownItemActive : ''}`}
                                >
                                    <span>{s.name}</span>
                                    <span className={styles.epCount}>{s.episode_count} eps</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <span className={styles.totalEpisodes}>{episodes.length} Episódios</span>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                </div>
            ) : (
                <div className={styles.scrollContainer}>
                    <button
                        className={`${styles.navButton} ${styles.navLeft}`}
                        onClick={() => {
                            const container = document.getElementById('episodes-grid');
                            if (container) container.scrollBy({ left: -600, behavior: 'smooth' });
                        }}
                    >
                        <ChevronDown className={styles.chevronRotated} style={{ transform: 'rotate(90deg)' }} size={24} />
                    </button>

                    <div id="episodes-grid" className={styles.grid}>
                        {episodes.map((ep, index) => (
                            <Link
                                key={ep.id}
                                href={`/serie/${uuid}?s=${ep.season_number}&e=${ep.episode_number}`}
                                className={styles.card}
                            >
                                {/* Thumbnail */}
                                <div className={styles.thumbnailWrapper}>
                                    {ep.still_path ? (
                                        <OptimizedImage
                                            src={getImageUrl(ep.still_path || '', 'w780')}
                                            tinySrc={getImageUrl(ep.still_path || '', 'w92')}
                                            alt={ep.name}
                                            fill
                                            priority={index < 4} // Load first 4 instantly
                                            className={styles.thumbnailImage}
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>
                                            <Clock size={32} />
                                        </div>
                                    )}

                                    <div className={styles.playOverlay}>
                                        <div className={styles.playIcon}>
                                            <Play fill="currentColor" size={20} />
                                        </div>
                                    </div>

                                    <span className={styles.episodeBadge}>
                                        E{ep.episode_number}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className={styles.cardInfo}>
                                    <div className={styles.cardHeader}>
                                        <h4 className={styles.episodeTitle}>
                                            {ep.episode_number}. {ep.name}
                                        </h4>
                                        <span className={styles.duration}>{ep.runtime ? `${ep.runtime}m` : ''}</span>
                                    </div>
                                    <p className={styles.overview}>
                                        {ep.overview}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <button
                        className={`${styles.navButton} ${styles.navRight}`}
                        onClick={() => {
                            const container = document.getElementById('episodes-grid');
                            if (container) container.scrollBy({ left: 600, behavior: 'smooth' });
                        }}
                    >
                        <ChevronDown style={{ transform: 'rotate(-90deg)' }} size={24} />
                    </button>
                </div>
            )}
        </div>
    );
}
