
import { contentService } from '@/services/content';
import { tmdb } from '@/services/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Plus, Info, Users, ArrowLeft } from 'lucide-react';
import styles from './Details.module.css';
import SeasonBrowser from '@/components/details/SeasonBrowser';

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
                    <Image
                        src={backdropUrl}
                        alt="Background"
                        fill
                        className={styles.heroImage}
                        priority
                        unoptimized
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

                {/* Poster */}
                <div className={styles.posterWrapper}>
                    {posterUrl && (
                        <Image
                            src={posterUrl}
                            alt={title || 'Poster'}
                            width={300} // Width/Height required for intrinsics if fill not used appropriately, or use fill + parent size
                            height={450}
                            className={styles.posterImage}
                            unoptimized
                        />
                    )}
                </div>

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
                        <Link href={playerRoute} className={styles.playButton}>
                            <Play fill="currentColor" size={24} />
                            Assistir
                        </Link>

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

                    {/* Series: Episodes Browser */}
                    {item.type === 'tv' && initialSeasonData && 'seasons' in details && (
                        <SeasonBrowser
                            tmdbId={item.tmdb_id}
                            uuid={uuid}
                            seasons={details.seasons || []}
                            initialSeasonData={initialSeasonData}
                        />
                    )}

                    {/* Movies: Cast Section (Only show if movie) */}
                    {item.type === 'movie' && credits.cast && credits.cast.length > 0 && (
                        <div className={styles.castSection}>
                            <h3 className={styles.castTitle}>Elenco Principal</h3>
                            <div className={styles.castList}>
                                {credits.cast.slice(0, 10).map(actor => (
                                    <div key={actor.id} className={styles.castItem}>
                                        {/* ... cast rendering ... */}
                                        <div className={styles.castAvatar}>
                                            {actor.profile_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                                    alt={actor.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    unoptimized
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                                    <Users size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.actorName}>{actor.name}</div>
                                        <div className={styles.characterName}>{actor.character}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div style={{ height: '100px' }} />
        </div>
    );
}
