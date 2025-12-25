
import { contentService } from '@/services/content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function MoviePlayerPage({ params }: PageProps) {
    const { id: uuid } = await params;

    // 1. Fetch Config and Movie Data in Parallel for Speed
    const [baseUrl, movieData] = await Promise.all([
        contentService.getAppConfig('superflix_base_url', 'https://superflixapi.buzz'),
        contentService.getMovieById(uuid)
    ]);

    // 2. Resolve TMDB ID
    if (!movieData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Filme não encontrado</h1>
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Voltar para o início
                </Link>
            </div>
        );
    }

    const { tmdb_id } = movieData;
    const playerUrl = `${baseUrl}/filme/${tmdb_id}`;

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
            {/* Header / Back Button */}
            <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none">
                <Link
                    href="/"
                    className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Voltar</span>
                </Link>
            </div>

            {/* Iframe Player */}
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
                    title={`Player Filme ${tmdb_id}`}
                />
            </div>
        </div>
    );
}
