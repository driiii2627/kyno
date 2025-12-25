
import { contentService } from '@/services/content';
import { tmdb } from '@/services/tmdb';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Plus, Info, Users, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: uuid } = await params;

    // 1. Resolve UUID to TMDB ID and Type
    const item = await contentService.getItemByUuid(uuid);

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <h1 className="text-2xl font-bold mb-4">Conteúdo não encontrado</h1>
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} /> Voltar para o início
                </Link>
            </div>
        );
    }

    // 2. Fetch Rich Metadata from TMDB
    // We fetch details and credits in parallel
    const [details, credits] = await Promise.all([
        tmdb.getDetails(item.tmdb_id, item.type),
        tmdb.getCredits(item.tmdb_id, item.type)
    ]);

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

    // Player Route
    const playerRoute = item.type === 'movie' ? `/filme/${uuid}` : `/serie/${uuid}`;

    return (
        <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
            {/* Background Hero */}
            <div className="absolute inset-0 w-full h-[70vh] md:h-[85vh] z-0">
                {backdropUrl && (
                    <Image
                        src={backdropUrl}
                        alt="Background"
                        fill
                        className="object-cover opacity-60"
                        priority
                        unoptimized
                    />
                )}
                {/* Gradient Overlays for Blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            </div>

            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/20 transition-all font-medium text-sm md:top-8 md:left-12"
            >
                <ArrowLeft size={18} /> Voltar
            </Link>

            {/* Content Container */}
            <div className="relative z-10 px-6 pt-[30vh] md:pt-[25vh] md:px-12 flex flex-col md:flex-row gap-8 lg:gap-12 max-w-[1600px] mx-auto">

                {/* Poster (Hidden on mobile, visible on tablet/desktop) */}
                <div className="hidden md:block flex-shrink-0 w-[240px] lg:w-[300px] rounded-lg overflow-hidden shadow-2xl skew-y-0 hover:scale-105 transition-transform duration-500 border border-white/10">
                    {posterUrl && (
                        <Image
                            src={posterUrl}
                            alt={title || 'Poster'}
                            width={300}
                            height={450}
                            className="w-full h-full object-cover"
                            unoptimized
                        />
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1 flex flex-col gap-6 md:mt-8">

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 drop-shadow-sm">
                        {title}
                    </h1>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-zinc-300">
                        {details.vote_average > 0 && (
                            <div className="flex items-center gap-1 text-[#46d369]">
                                <span>★ {details.vote_average.toFixed(1)}</span>
                            </div>
                        )}
                        <span>{year}</span>
                        {item.type === 'tv' && <span className="px-2 py-0.5 border border-zinc-600 rounded text-xs">{seasons}</span>}
                        {item.type === 'movie' && <span>{runtime}</span>}
                        {/* Genres */}
                        <div className="flex flex-wrap gap-2">
                            {details.genres?.slice(0, 3).map(g => (
                                <span key={g.id} className="text-zinc-400 hover:text-white transition-colors cursor-default">• {g.name}</span>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
                        <Link
                            href={playerRoute}
                            className="flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-md font-bold hover:bg-zinc-200 transition-colors transform hover:scale-105 active:scale-95"
                        >
                            <Play fill="currentColor" size={24} />
                            Assistir
                        </Link>

                        <button className="p-3.5 rounded-full border-2 border-zinc-500 text-zinc-300 hover:border-white hover:text-white bg-black/30 backdrop-blur-sm transition-all hover:scale-110" title="Minha Lista">
                            <Plus size={22} />
                        </button>

                        <button className="p-3.5 rounded-full border-2 border-zinc-500 text-zinc-300 hover:border-white hover:text-white bg-black/30 backdrop-blur-sm transition-all hover:scale-110" title="Detalhes">
                            <Info size={22} />
                        </button>

                        <button className="p-3.5 rounded-full border-2 border-zinc-500 text-zinc-300 hover:border-white hover:text-white bg-black/30 backdrop-blur-sm transition-all hover:scale-110" title="Elenco">
                            <Users size={22} />
                        </button>
                    </div>

                    {/* Overview */}
                    <div className="max-w-2xl mt-2">
                        <p className="text-zinc-300 text-base md:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
                            {details.overview}
                        </p>
                    </div>

                    {/* Cast / Elenco (Horizontal Scroll) */}
                    {credits.cast && credits.cast.length > 0 && (
                        <div className="mt-8 border-t border-zinc-800 pt-6">
                            <h3 className="text-zinc-400 font-semibold mb-4 text-sm uppercase tracking-wider">Elenco Principal</h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {credits.cast.slice(0, 10).map(actor => (
                                    <div key={actor.id} className="w-[100px] flex-shrink-0 flex flex-col gap-2 group">
                                        <div className="w-full h-[100px] rounded-full overflow-hidden border border-zinc-700 group-hover:border-white transition-colors relative bg-zinc-800">
                                            {actor.profile_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                                    alt={actor.name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                    <Users size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-semibold text-zinc-200 truncate">{actor.name}</p>
                                            <p className="text-[10px] text-zinc-500 truncate">{actor.character}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Additional "More Like This" or "Episodes" could go here later */}
            <div className="h-24" /> {/* Spacer */}
        </div>
    );
}
