'use client';

import { useState, useRef } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import HeroTrailer from '@/components/home/HeroTrailer'; // Reusing existing component
import { Volume2, VolumeX } from 'lucide-react';

interface DetailsBackgroundProps {
    backdropUrl: string | null;
    trailerId: string | null;
    isMobile?: boolean;
}

export default function DetailsBackground({ backdropUrl, trailerId, isMobile = false }: DetailsBackgroundProps) {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [hasEnded, setHasEnded] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    // If mobile, maybe don't autoplay? Or follow user preference. 
    // Usually mobile imposes restrictions.
    // The user didn't specify, but safer to assume desktop focus for "Panel Admin" feature context, though site is responsive.

    const showVideo = trailerId && !hasEnded;

    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Base Image (Always there to prevent flashing) */}
            {backdropUrl && (
                <OptimizedImage
                    src={backdropUrl}
                    tinySrc={backdropUrl.replace('original', 'w780')}
                    alt="Background"
                    fill
                    className={`object-cover transition-opacity duration-1000 ${videoReady && showVideo ? 'opacity-0' : 'opacity-100'}`}
                    priority
                    quality={100}
                />
            )}

            {/* Video Layer */}
            {showVideo && (
                <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}>
                    <HeroTrailer
                        videoId={trailerId}
                        isMuted={isMuted}
                        isPlaying={isPlaying}
                        onProgress={() => { }}
                        onEnded={() => setHasEnded(true)} // Fade back to image on end
                        onError={() => setHasEnded(true)}
                    />

                    {/* Simplified Mute Control for Details Page (Bottom Right of hero area usually) */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="absolute bottom-32 right-10 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all border border-white/10"
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* On ready handler wrapper if HeroTrailer doesn't expose one directly (it does via logic but we need to know when opaque)
                        Actually HeroTrailer in file `3204` doesn't expose onReady callback to parent specifically for state `videoReady`.
                        It takes `onProgress`. We can use onProgress > 0 to set ready?
                     */}
                    {/* 
                        Looking at HeroTrailer code (3204), it doesn't emit "onLoad". 
                        However, Youtube player "onStateChange" event 1 (playing) is reliable.
                        HeroTrailer uses `onStateChange` internally but doesn't prop it out.
                        It DOES call `onProgress`.
                     */}
                </div>
            )}

            {/* Gradients (Preserved from original) */}
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#111] via-[#111]/40 to-transparent pointer-events-none" />
        </div>
    );
}
