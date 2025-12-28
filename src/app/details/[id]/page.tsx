
import { contentService } from '@/services/content';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Play, Plus, Info, Users, ArrowLeft } from 'lucide-react';
import styles from './Details.module.css';
import SeasonBrowser from '@/components/details/SeasonBrowser';
import SeasonBrowser from '@/components/details/SeasonBrowser';
import DetailsTabs from '@/components/details/DetailsTabs';
import TrackedLink from '@/components/ui/TrackedLink';

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

    // 2. Fetch Data
    const detailsPromise = tmdb.getDetails(item.tmdb_id, item.type);
    const creditsPromise = tmdb.getCredits(item.tmdb_id, item.type);

    const [details, credits] = await Promise.all([detailsPromise, creditsPromise]);

    // If Series, fetch first season
    let initialSeasonData = null;
    if (item.type === 'tv' && 'seasons' in details && details.seasons?.length) {
        const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
        if (firstSeason) {
            initialSeasonData = await tmdb.getSeasonDetails(item.tmdb_id, firstSeason.season_number);
        }
    }

    // 3. Fetch Recommendations & Collection (Sequels)
    let recommendations = await tmdb.getRecommendations(item.tmdb_id, item.type);

    // Prioritize Sequels (Collection) if Movie
    if (item.type === 'movie' && (details as any).belongs_to_collection) {
        try {
            const collection = await tmdb.getCollectionDetails((details as any).belongs_to_collection.id);
            if (collection && collection.parts) {
                // Filter out current movie and sort by release date
                const parts = collection.parts
                    .filter((p: any) => p.id !== item.tmdb_id)
                    .sort((a: any, b: any) => {
                        const timeA = a.release_date ? new Date(a.release_date).getTime() : 0;
                        const timeB = b.release_date ? new Date(b.release_date).getTime() : 0;
                        return timeA - timeB;
                    });

                // Prepend collection parts to recommendations
                recommendations = [...parts, ...recommendations];

                // Deduplicate just in case
                recommendations = Array.from(new Map(recommendations.map((m: any) => [m.id, m])).values());
            }
        } catch (e) {
            console.error("Failed to fetch collection", e);
        }
    }

    // 4. Validate Recommendations against Supabase (Security Check)
    // We only show items that are ALREADY in our database.
    const candidateIds = recommendations.map((r: any) => r.id);
    let validRecommendations: any[] = [];

    if (candidateIds.length > 0) {
        const { data: validMovies } = await supabase
            .from('movies')
            .select('id, tmdb_id, title, description, poster_url, backdrop_url, rating')
            .in('tmdb_id', candidateIds);

        const { data: validSeries } = await supabase
            .from('series')
            .select('id, tmdb_id, title, description, poster_url, backdrop_url, rating')
            .in('tmdb_id', candidateIds);

        // Map Valid Items to Catalog Schema
        const safeMovies = (validMovies || []).map(m => ({
            id: m.tmdb_id,
            supabase_id: m.id,
            title: m.title,
            overview: m.description, // DB column is description
            poster_path: m.poster_url,
            backdrop_path: m.backdrop_url,
            vote_average: m.rating,
            type: 'movie'
        }));

        const safeSeries = (validSeries || []).map(s => ({
            id: s.tmdb_id,
            supabase_id: s.id,
            name: s.title, // Series title in DB
            title: s.title,
            overview: s.description,
            poster_path: s.poster_url,
            backdrop_path: s.backdrop_url,
            vote_average: s.rating,
            type: 'tv'
        }));

        // Re-construct the list preserving TMDB relevance order if possible, 
        // or just use the found list. Using found list is faster.
        validRecommendations = [...safeMovies, ...safeSeries];
    }

    recommendations = validRecommendations.slice(0, 15); // Limit limit

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
    const backdropUrl = details.backdrop_path
        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
        : null;

    const posterUrl = details.poster_path
        ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
        : null;

    const title = 'title' in details ? details.title : details.name;
    const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const runtime = 'runtime' in details ? `${details.runtime} min` : '';
    const seasons = 'number_of_seasons' in details ? `${details.number_of_seasons} Temporadas` : '';

    const playerRoute = item.type === 'movie' ? `/filme/${uuid}` : `/serie/${uuid}`;

    return (
        <div className={styles.container}>
            {/* Background Hero */}
            <div className={styles.heroBackground}>
                {backdropUrl && (
                    <OptimizedImage
                        src={backdropUrl}
                        tinySrc={backdropUrl.replace('original', 'w780')} // Upgrade placeholder to w780 for better mobile quality
                        alt="Background"
                        fill
                        className={styles.heroImage}
                        priority
                    />
                )}
                {/* CSS Gradients */}
                <div className={styles.gradientOverlayBottom} />
                <div className={styles.gradientOverlaySide} />
            </div>

            {/* Back Button */}
            <Link href="/" className={styles.backButton}>
                <ArrowLeft size={18} /> Voltar
            </Link>

            {/* Main Content */}
            <div className={styles.content}>
                {/* Info */}
                <div className={styles.infoColumn}>
                    <h1 className={styles.title}>{title}</h1>

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

                    <div className={styles.actions}>
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

                    <p className={styles.overview}>
                        {details.overview}
                    </p>
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
