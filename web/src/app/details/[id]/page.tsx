
import { contentService } from '@/services/content';
import { supabase } from '@/lib/supabase';
import { tmdb, getImageUrl } from '@/services/tmdb';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, Plus, Info, Users, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import styles from './Details.module.css';
import SeasonBrowser from '@/components/details/SeasonBrowser';
import DetailsBackground from '@/components/details/DetailsBackground';
import SmartBackButton from '@/components/ui/SmartBackButton';

import DetailsTabs from '@/components/details/DetailsTabs';
import TrackedLink from '@/components/ui/TrackedLink';
import ExpandableText from '@/components/details/ExpandableText';

export const dynamic = 'force-dynamic';

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: uuid } = await params;

    // 1. Resolve UUID to TMDB ID and Type
    const item = await contentService.getItemByUuid(uuid);

    if (!item) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000', color: '#fff' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Conteúdo não encontrado</h1>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa' }}>
                    <ArrowLeft size={20} /> Voltar para o início
                </Link>
            </div>
        );
    }

    // 2. Fetch Core Data (Parallel)
    // We fetch recommendations early to speed up the waterfall, even though we filter them later.
    const detailsPromise = tmdb.getDetails(item.tmdb_id, item.type);
    const creditsPromise = tmdb.getCredits(item.tmdb_id, item.type);
    // Recommendations fetched via contentService now

    const [details, credits] = await Promise.all([
        detailsPromise,
        creditsPromise
    ]);

    // 3. Conditional Fetches (Seasons or Collections)
    let initialSeasonData = null;
    let extraCollectionParts: any[] = [];

    const conditionalPromises: Promise<any>[] = [];

    // A. Series: Get First Season
    if (item.type === 'tv' && 'seasons' in details && details.seasons?.length) {
        const firstSeason = details.seasons.find((s: any) => s.season_number > 0) || details.seasons[0];
        if (firstSeason) {
            conditionalPromises.push(
                tmdb.getSeasonDetails(item.tmdb_id, firstSeason.season_number)
                    .then(res => { initialSeasonData = res; })
                    .catch(() => null)
            );
        }
    }

    // Wait for conditional fetches
    await Promise.all(conditionalPromises);

    // 4. Personalized Recommendations (Mixed Movies & Series)
    // Uses the new algorithm: Sequels > User Pref > Genre Match > Quality
    // TODO: Connect 'guest' to actual logged-in user ID when Auth is stable
    const recommendations = await contentService.getPersonalizedRecommendations(item, 'guest');

    // Prepare Season Browser Node
    let seasonBrowserNode = null;
    if (item.type === 'tv' && initialSeasonData && 'seasons' in details) {
        seasonBrowserNode = (
            <SeasonBrowser
                tmdbId={item.tmdb_id}
                uuid={uuid}
                seasons={details.seasons || []}
                initialSeasonData={initialSeasonData}
            />
        );
    }

    // Format Data
    const tmdbBackdrop = details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;

    // Fallback: Use Database URL if TMDB failed/missing
    // Support both full URLs and relative paths
    const dbBackdrop = item.backdrop_url
        ? (item.backdrop_url.startsWith('http') ? item.backdrop_url : `https://image.tmdb.org/t/p/original${item.backdrop_url}`)
        : null;

    const backdropUrl = tmdbBackdrop || dbBackdrop;

    const posterUrl = details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null;

    const title = 'title' in details ? details.title : details.name;
    const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const runtime = 'runtime' in details ? `${details.runtime} min` : '';
    const seasons = 'number_of_seasons' in details ? `${details.number_of_seasons} Temporadas` : '';

    const playerRoute = item.type === 'movie' ? `/filme/${uuid}` : `/serie/${uuid}`;

    // Fix logo URL (handle relative TMDB paths vs absolute DB urls)
    let logoPath = item.logo_url;
    // Database often returns relative paths like '/path.png', ensuring they start with / allows getImageUrl to work correctly for TMDB.
    if (logoPath && !logoPath.startsWith('http') && !logoPath.startsWith('/')) {
        logoPath = `/${logoPath}`;
    }
    const logoUrl = getImageUrl(logoPath, 'w500');

    // Fetch Textless Poster for Mobile (Optimized: DB Cache -> Fallback TMDB)
    let textlessPosterPath = item.textless_poster_url;
    if (!textlessPosterPath) {
        // Fallback fetch if not synced yet
        textlessPosterPath = await tmdb.getTextlessPoster(item.tmdb_id, item.type);
    }
    const mobilePosterUrl = textlessPosterPath ? getImageUrl(textlessPosterPath, 'original') : null; // Max Quality (4K)

    return (
        <div className={styles.container}>
            {/* Background Hero */}
            {/* Background Hero (Image Only) */}
            <DetailsBackground backdropUrl={backdropUrl} mobilePoster={mobilePosterUrl} />

            {/* Smart Back Button */}
            <SmartBackButton className={styles.backButton} iconSize={18}>
                <ArrowLeft size={18} /> Voltar
            </SmartBackButton>

            {/* Main Content */}
            <div className={styles.content}>
                {/* Info */}
                <div className={styles.infoColumn}>
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={title}
                            className={styles.logoImage}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <h1 className={styles.title}>{title}</h1>
                    )}

                    <div className={styles.metadata}>
                        {details.vote_average > 0 && (
                            <div className={styles.rating}>
                                <span>★ {details.vote_average.toFixed(1)}</span>
                            </div>
                        )}
                        <span>{year}</span>
                        {item.type === 'tv' && <span className={styles.tag}>{seasons}</span>}
                        {item.type === 'movie' && <span>{runtime}</span>}

                        {details.genres?.slice(0, 3).map(g => (
                            <span key={g.id}>• {g.name}</span>
                        ))}
                    </div>

                    {/* Optimized Description with Read More (ABOVE BUTTONS on Desktop) */}
                    {/* Optimized Description with Read More (ABOVE BUTTONS on Desktop) */}
                    <div style={{ marginBottom: '2rem' }}>
                        <ExpandableText text={details.overview} className={styles.overview} />
                    </div>

                    {/* Desktop Actions (Hidden on Mobile) */}
                    <div className={styles.desktopActions}>
                        <TrackedLink
                            href={playerRoute}
                            className={styles.playButton}
                            genres={details.genres?.map(g => g.name) || []}
                        >
                            <Play fill="currentColor" size={24} />
                            Assistir
                        </TrackedLink>

                        <button className={styles.actionIconBtn}>
                            <Plus size={22} />
                        </button>
                        <button className={styles.actionIconBtn}>
                            <Info size={22} />
                        </button>
                    </div>

                    {/* Glass Control Box */}
                    <div className={styles.controlBox}>
                        <TrackedLink
                            href={playerRoute}
                            className={styles.mainPlayBtn}
                            genres={details.genres?.map(g => g.name) || []}
                        >
                            <Play fill="currentColor" size={26} />
                            <span>
                                {item.type === 'tv' ? 'Assistir T1 E1' : 'Assistir'}
                            </span>
                        </TrackedLink>

                        <div className={styles.actionGrid}>
                            <button className={styles.actionBtn}>
                                <Plus size={20} />
                                <span>Lista</span>
                            </button>
                            <button className={styles.actionBtn}>
                                <ThumbsUp size={20} />
                                <span>Adorei</span>
                            </button>
                            <button className={styles.actionBtn}>
                                <ThumbsDown size={20} />
                                <span>Odiei</span>
                            </button>
                        </div>
                    </div>


                </div>

                {/* Interactive Details Tabs (Episodes / Recommendations) - Full Width */}
                <DetailsTabs
                    seasonBrowser={seasonBrowserNode}
                    recommendations={recommendations}
                    uuid={uuid}
                />


            </div>

            <div style={{ height: '100px' }} />
        </div>
    );
}
