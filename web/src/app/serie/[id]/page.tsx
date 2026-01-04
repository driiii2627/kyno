
import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './Player.module.css';
import FullscreenButton from '@/components/ui/FullscreenButton';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SeriesPlayerPage({ params, searchParams }: PageProps) {
    const { id: uuid } = await params;
    const { s, e } = await searchParams;

    const [baseUrl, seriesData] = await Promise.all([
        contentService.getAppConfig('superflix_base_url', 'https://superflixapi.buzz'),
        contentService.getSeriesById(uuid)
    ]);

    if (!seriesData || !seriesData.video_url) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Série não encontrada ou indisponível</h1>
                <p className="text-zinc-500 mb-6">A URL do vídeo não foi sincronizada.</p>
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Voltar para o início
                </Link>
            </div>
        );
    }

    const { tmdb_id, video_url } = seriesData;
    let playerUrl = video_url;

    // If season and episode params exist, append them for deep linking
    // Base video_url is usually ".../serie/[tmdb_id]"
    // We want ".../serie/[tmdb_id]/[season]/[episode]"
    if (s && e) {
        // Strip trailing slash if present
        const base = playerUrl.endsWith('/') ? playerUrl.slice(0, -1) : playerUrl;
        playerUrl = `${base}/${s}/${e}`;
    }

    return (
        <div className={styles.playerContainer}>
            <div className={styles.backButtonWrapper} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Link
                    href="/"
                    className={styles.backButton}
                >
                    <ArrowLeft size={20} className={styles.arrowIcon} />
                    <span className={styles.backText}>Voltar</span>
                </Link>

                <FullscreenButton />
            </div>

            <div className={styles.iframeWrapper}>
                <iframe
                    src={playerUrl}
                    className={styles.iframe}
                    allowFullScreen
                    title={`Player Série ${tmdb_id}`}
                />
            </div>
        </div>
    );
}
