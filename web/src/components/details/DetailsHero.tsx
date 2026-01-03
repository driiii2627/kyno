import { tmdb, getImageUrl } from '@/services/tmdb';
import { Play, Plus, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import styles from '@/app/details/[id]/Details.module.css';
import TrackedLink from '@/components/ui/TrackedLink';
import ExpandableText from '@/components/details/ExpandableText';
import { CatalogItem } from '@/services/content'; // Assuming type exists

export default async function DetailsHeroInfo({ item }: { item: any }) {
    // 2. Fetch Core Details ONLY (Fast)
    const details = await tmdb.getDetails(item.tmdb_id, item.type);

    const title = 'title' in details ? details.title : details.name;
    const releaseDate = 'release_date' in details ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const runtime = 'runtime' in details ? `${details.runtime} min` : '';
    const seasons = 'number_of_seasons' in details ? `${details.number_of_seasons} Temporadas` : '';
    const playerRoute = item.type === 'movie' ? `/filme/${item.supabase_id}` : `/serie/${item.supabase_id}`;

    let logoPath = item.logo_url;
    if (logoPath && !logoPath.startsWith('http') && !logoPath.startsWith('/')) logoPath = `/${logoPath}`;
    const logoUrl = getImageUrl(logoPath, 'w500');

    return (
        <div className={styles.infoColumn}>
            {logoUrl ? (
                <img src={logoUrl} alt={title} className={styles.logoImage} referrerPolicy="no-referrer" />
            ) : (
                <h1 className={styles.title}>{title}</h1>
            )}

            <div className={styles.metadata}>
                {details.vote_average > 0 && (
                    <div className={styles.rating}><span>★ {details.vote_average.toFixed(1)}</span></div>
                )}
                <span>{year}</span>
                {item.type === 'tv' && <span className={styles.tag}>{seasons}</span>}
                {item.type === 'movie' && <span>{runtime}</span>}
                {details.genres?.slice(0, 3).map((g: any) => <span key={g.id}>• {g.name}</span>)}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <ExpandableText text={details.overview} className={styles.overview} />
            </div>

            <div className={styles.desktopActions}>
                <TrackedLink href={playerRoute} className={styles.playButton} genres={details.genres?.map((g: any) => g.name) || []}>
                    <Play fill="currentColor" size={24} /> Assistir
                </TrackedLink>
                <button className={styles.actionIconBtn}><Plus size={22} /></button>
                <button className={styles.actionIconBtn}><Info size={22} /></button>
            </div>

            <div className={styles.controlBox}>
                <TrackedLink href={playerRoute} className={styles.mainPlayBtn} genres={details.genres?.map((g: any) => g.name) || []}>
                    <Play fill="currentColor" size={26} />
                    <span>{item.type === 'tv' ? 'Assistir T1 E1' : 'Assistir'}</span>
                </TrackedLink>
                <div className={styles.actionGrid}>
                    <button className={styles.actionBtn}><Plus size={20} /><span>Lista</span></button>
                    <button className={styles.actionBtn}><ThumbsUp size={20} /><span>Adorei</span></button>
                    <button className={styles.actionBtn}><ThumbsDown size={20} /><span>Odiei</span></button>
                </div>
            </div>
        </div>
    );
}
