'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import styles from './DetailsTabs.module.css';
import { Movie } from '@/services/tmdb';
import seasonStyles from './SeasonBrowser.module.css'; // Reusing card styles

interface DetailsTabsProps {
    seasonBrowser?: React.ReactNode;
    recommendations: Movie[];
    uuid: string; // Current item UUID (to avoid linking to self if needed, though usually not an issue)
}

export default function DetailsTabs({ seasonBrowser, recommendations, uuid }: DetailsTabsProps) {
    // If seasonBrowser is provided, default to 'episodes', else 'recommendations'
    const [activeTab, setActiveTab] = useState<'episodes' | 'recommendations'>(seasonBrowser ? 'episodes' : 'recommendations');

    return (
        <div className={styles.container}>
            {/* Tabs Navigation */}
            <div className={styles.tabs}>
                {seasonBrowser && (
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`${styles.tabButton} ${activeTab === 'episodes' ? styles.activeTab : ''}`}
                    >
                        Episódios
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`${styles.tabButton} ${activeTab === 'recommendations' ? styles.activeTab : ''}`}
                >
                    Recomendações
                </button>
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {activeTab === 'episodes' && seasonBrowser && (
                    <div className={styles.tabContent}>
                        {seasonBrowser}
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className={styles.tabContent}>
                        {recommendations.length > 0 ? (
                            <div className={seasonStyles.grid}>
                                {recommendations.map(rec => (
                                    <Link
                                        key={rec.id}
                                        // We need to resolve TMDB ID to UUID. 
                                        // Ideally we pass a localized item, but here we might need to rely on the backend to redirect or handle it.
                                        // Wait, the client doesn't know the UUID of the recommendation.
                                        // For now, we might need to assume a route that accepts TMDB ID or simple href if possible.
                                        // ACTUALLY, checking previous code, `contentService.getItemByUuid` is used.
                                        // We don't have UUIDs for these recommendations yet.
                                        // Solution: We probably need a route that handles TMDB ID lookup or we accept that we can't link to internal details yet without a lookup.
                                        // BUT, the existing MovieRow links to `/details/[uuid]`.
                                        // Since we can't easily get UUIDs for all recommendations on the fly without a huge batch query,
                                        // let's verify how the app handles fetching.
                                        // If we look at Home Page, it fetches local items. 
                                        // The recommendations from TMDB might NOT exist in our local database `content` table (which has UUIDs).
                                        // If they don't exist locally, we can't show them effectively if our routing depends on UUID.
                                        // However, the prompt implies these are "Recomendações".
                                        // Assumption: We might need to link to a generic route or just use the home page logic?
                                        // Let's stick to the visual first. The ID linking is a separate issue.
                                        // I'll make the href optional or temp.
                                        // Actually, I can use a server action to "resolve or create" on click? No, that's slow.
                                        // Let's assume for now we link to `/details/tmdb-${rec.id}` and handle that? No.
                                        // Let's just create the UI valid.

                                        // *Correction*: The user has `content` table mapping UUID -> TMDB_ID.
                                        // If the recommendation isn't in our DB, we can't show it?
                                        // Or does the system allow viewing any TMDB item?
                                        // Looking at `actions.ts` or `page.tsx`:
                                        // `const item = await contentService.getItemByUuid(uuid);`
                                        // It strictly depends on UUID.

                                        // CRITICAL: If the recommendation is NOT in the database, we cannot generate a `/details/[uuid]` link.
                                        // For this task, I will render the UI. 
                                        // I will put a placeholder href for now or try to fetch UUIDs?
                                        // Fetching UUIDs for 20 recommendations is heavy.
                                        // I'll use a placeholder `#` and add a comment that this needs a solution (e.g. auto-import).
                                        href={'#'}
                                        className={seasonStyles.card}
                                    >
                                        <div className={seasonStyles.thumbnailWrapper}>
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w500${rec.backdrop_path || rec.poster_path}`}
                                                alt={rec.title || rec.name || 'Title'}
                                                fill
                                                className={seasonStyles.thumbnailImage}
                                                unoptimized
                                            />
                                            <div className={seasonStyles.playOverlay}>
                                                <div className={seasonStyles.playIcon}>
                                                    <Play fill="currentColor" size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className={seasonStyles.cardInfo}>
                                            <div className={seasonStyles.cardHeader}>
                                                <h4 className={seasonStyles.episodeTitle}>
                                                    {rec.title || rec.name}
                                                </h4>
                                                <span className={seasonStyles.duration}>
                                                    {(rec as any).vote_average ? `★ ${(rec as any).vote_average.toFixed(1)}` : ''}
                                                </span>
                                            </div>
                                            <p className={seasonStyles.overview}>
                                                {rec.overview || 'Sem descrição.'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-zinc-500 py-8">Nenhuma recomendação encontrada.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
