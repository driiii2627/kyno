
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
    const recommendationsPromise = tmdb.getRecommendations(item.tmdb_id, item.type);

    const [details, credits, rawRecommendations] = await Promise.all([
        detailsPromise,
        creditsPromise,
        recommendationsPromise
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

    // B. Movie: Get Collection
    if (item.type === 'movie' && (details as any).belongs_to_collection) {
        conditionalPromises.push(
            tmdb.getCollectionDetails((details as any).belongs_to_collection.id)
                .then(collection => {
                    if (collection && collection.parts) {
                        extraCollectionParts = collection.parts
                            .filter((p: any) => p.id !== item.tmdb_id)
                            .sort((a: any, b: any) => {
                                const timeA = a.release_date ? new Date(a.release_date).getTime() : 0;
                                const timeB = b.release_date ? new Date(b.release_date).getTime() : 0;
                                return timeA - timeB;
                            });
                    }
                })
                .catch(e => console.error("Failed to fetch collection", e))
        );
    }

    // Wait for conditional fetches
    await Promise.all(conditionalPromises);

    // Merge Collection into Recommendations
    let recommendations = [...extraCollectionParts, ...rawRecommendations];
    // Deduplicate
    recommendations = Array.from(new Map(recommendations.map((m: any) => [m.id, m])).values());

    // 4. Validate Recommendations against Supabase (Parallel Security Check)
    const candidateIds = recommendations.map((r: any) => r.id);
    let validRecommendations: any[] = [];
    const existingIds = new Set<string>();

    if (candidateIds.length > 0) {
        const moviesQuery = supabase
            .from('movies')
            .select('id, tmdb_id, title, description, poster_url, backdrop_url, rating')
            .in('tmdb_id', candidateIds);

        const seriesQuery = supabase
            .from('series')
            .select('id, tmdb_id, title, description, poster_url, backdrop_url, rating')
            .in('tmdb_id', candidateIds);

        const [{ data: validMovies }, { data: validSeries }] = await Promise.all([moviesQuery, seriesQuery]);

        // Map Valid Items...
        const safeMovies = (validMovies || []).map(m => ({
            id: m.tmdb_id,
            supabase_id: m.id,
            title: m.title,
            overview: m.description,
            poster_path: m.poster_url,
            backdrop_path: m.backdrop_url,
            vote_average: m.rating,
            type: 'movie'
        }));

        const safeSeries = (validSeries || []).map(s => ({
            id: s.tmdb_id,
            supabase_id: s.id,
            name: s.title,
            title: s.title,
            overview: s.description,
            poster_path: s.poster_url,
            backdrop_path: s.backdrop_url,
            vote_average: s.rating,
            type: 'tv'
        }));

        validRecommendations = [...safeMovies, ...safeSeries];
        validRecommendations.forEach(r => existingIds.add(r.supabase_id));
    }

    // 5. Fallback: "Same Genre" Recommendations
    if (validRecommendations.length < 10 && details.genres && details.genres.length > 0) {
        const primaryGenre = details.genres[0].name;
        const limit = 15 - validRecommendations.length;
        const table = item.type === 'movie' ? 'movies' : 'series';

        const { data: genreData } = await supabase
            .from(table)
            .select('id, tmdb_id, title, description, poster_url, backdrop_url, rating')
            .ilike('genre', `%${primaryGenre}%`)
            .neq('id', uuid)
            .limit(limit);

        if (genreData) {
            const genreItems = genreData.map((d: any) => ({
                id: d.tmdb_id,
                supabase_id: d.id,
                title: d.title,
                name: d.title,
                overview: d.description,
                poster_path: d.poster_url,
                backdrop_path: d.backdrop_url,
                vote_average: d.rating,
                type: item.type
            }));

            genreItems.forEach((g: any) => {
                if (!existingIds.has(g.supabase_id)) {
                    validRecommendations.push(g);
                    existingIds.add(g.supabase_id);
                }
            });
        }
    }

    recommendations = validRecommendations.slice(0, 15);

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

    // Fetch Textless Poster for Mobile (Server-side)
    const textlessPosterPath = await tmdb.getTextlessPoster(item.tmdb_id, item.type);
    const mobilePosterUrl = textlessPosterPath ? getImageUrl(textlessPosterPath, 'w780') : null; // High quality w780

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
