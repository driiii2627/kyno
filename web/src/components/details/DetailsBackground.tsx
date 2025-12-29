'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';

interface DetailsBackgroundProps {
    backdropUrl: string | null;
    trailerId: string | null;
    isMobile?: boolean;
}

export default function DetailsBackground({ backdropUrl, trailerId, isMobile = false }: DetailsBackgroundProps) {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden">
            {/* Base Image (Always there to prevent flashing) */}
            {backdropUrl && (
                <OptimizedImage
                    src={backdropUrl}
                    tinySrc={backdropUrl.includes('original') ? backdropUrl.replace('original', 'w780') : undefined}
                    alt="Background"
                    fill
                    className="w-full h-full object-cover object-top opacity-60"
                    priority
                    quality={100}
                    unoptimized
                />
            )}

            {/* Gradients (Preserved from original) */}
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-[#111] via-[#111]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#111] via-[#111]/40 to-transparent pointer-events-none" />
        </div>
    );
}
