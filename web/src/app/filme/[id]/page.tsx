
import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
// Reusing styles from Series Player to Ensure Visual Consistency
import styles from '../../serie/[id]/Player.module.css';
import FullscreenButton from '@/components/ui/FullscreenButton';


export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MoviePlayerPage({ params }: PageProps) {
    const { id: uuid } = await params;

    // 1. Fetch Config and Movie Data in Parallel for Speed
    // Note: getMovieById now returns video_url
    const [baseUrl, movieData] = await Promise.all([
        contentService.getAppConfig('superflix_base_url', 'https://superflixapi.buzz'),
        contentService.getMovieById(uuid)
    ]);

    // 2. Validate Data and Video URL
    if (!movieData || !movieData.video_url) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Filme não encontrado ou indisponível</h1>
                <p className="text-zinc-500 mb-6">A URL do vídeo não foi sincronizada.</p>
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Voltar para o início
                </Link>
            </div>
        );
    }

    const { tmdb_id, video_url } = movieData;
    // We use the DB video_url as the source of truth
    const playerUrl = `${video_url}#noLink#noEpList#color:3b82f6#noLink#noEpList#color:3b82f6`;

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
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    allowFullScreen
                    title={`Player Filme ${tmdb_id}`}
                />
            </div>
        </div>
    );
}
