'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, ChevronDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { SeasonDetails, Episode } from '@/services/tmdb';
import { getSeason } from '@/app/actions';

interface SeasonBrowserProps {
    tmdbId: number;
    uuid: string;
    seasons: {
        season_number: number;
        name: string;
        episode_count: number;
    }[];
    initialSeasonData: SeasonDetails;
}

export default function SeasonBrowser({ tmdbId, uuid, seasons, initialSeasonData }: SeasonBrowserProps) {
    const [activeSeason, setActiveSeason] = useState(initialSeasonData.season_number);
    const [episodes, setEpisodes] = useState<Episode[]>(initialSeasonData.episodes);
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Filter out Season 0 (Specials) if desired, or keep them. Usually users want Season 1 first.
    const validSeasons = seasons.filter(s => s.season_number > 0);
    const currentSeasonName = validSeasons.find(s => s.season_number === activeSeason)?.name || `Temporada ${activeSeason}`;

    const handleSeasonChange = async (seasonNum: number) => {
        if (seasonNum === activeSeason) {
            setDropdownOpen(false);
            return;
        }

        setLoading(true);
        setDropdownOpen(false);
        setActiveSeason(seasonNum);

        try {
            const data = await getSeason(tmdbId, seasonNum);
            setEpisodes(data.episodes);
        } catch (error) {
            console.error("Failed to fetch season", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-12 border-t border-zinc-800 pt-8">
            <div className="flex items-center justify-between mb-8">
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-3 text-2xl font-bold hover:text-zinc-300 transition-colors"
                    >
                        {currentSeasonName}
                        <ChevronDown className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Season Dropdown */}
                    {dropdownOpen && (
                        <div className="absolute top-12 left-0 w-64 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 py-2">
                            {validSeasons.map(s => (
                                <button
                                    key={s.season_number}
                                    onClick={() => handleSeasonChange(s.season_number)}
                                    className={`w-full text-left px-5 py-3 hover:bg-zinc-800 transition-colors flex justify-between items-center ${activeSeason === s.season_number ? 'text-white font-bold bg-zinc-800' : 'text-zinc-400'}`}
                                >
                                    <span>{s.name}</span>
                                    <span className="text-xs text-zinc-600 font-normal">{s.episode_count} eps</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-zinc-500 text-sm font-medium">{episodes.length} Episódios</span>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {episodes.map(ep => (
                        <Link
                            key={ep.id}
                            href={`/serie/${uuid}?s=${ep.season_number}&e=${ep.episode_number}`}
                            className="group flex flex-col gap-3 cursor-pointer bg-zinc-900/30 rounded-lg overflow-hidden hover:bg-zinc-900 transition-colors duration-300 border border-transparent hover:border-zinc-700 p-2"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video w-full rounded-md overflow-hidden bg-zinc-900 shadow-lg">
                                {ep.still_path ? (
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                                        alt={ep.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-zinc-600">
                                        <Clock size={32} />
                                    </div>
                                )}

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <div className="p-3 bg-white text-black rounded-full scale-75 group-hover:scale-100 transition-transform">
                                        <Play fill="currentColor" size={20} />
                                    </div>
                                </div>

                                <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded text-white backdrop-blur-sm">
                                    E{ep.episode_number}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="px-1 pb-1">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <h4 className="font-bold text-sm text-zinc-200 leading-tight group-hover:text-white transition-colors line-clamp-1">
                                        {ep.episode_number}. {ep.name}
                                    </h4>
                                    <span className="text-xs text-zinc-500 whitespace-nowrap">{ep.runtime ? `${ep.runtime}m` : ''}</span>
                                </div>
                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed h-8">
                                    {ep.overview}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
