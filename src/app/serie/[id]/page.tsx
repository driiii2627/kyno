
import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function SeriesPlayerPage({ params }: PageProps) {
    const { id: uuid } = await params;

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
    const playerUrl = video_url;

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none">
                <Link
                    href="/"
                    className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Voltar</span>
                </Link>
            </div>

            <div className="absolute top-0 left-0 w-full h-full z-0">
                <iframe
                    src={playerUrl}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                    }}
                    allowFullScreen
                    title={`Player Série ${tmdb_id}`}
                />
            </div>
        </div>
    );
}
