'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                // FORCE LANDSCAPE on Mobile (if supported)
                if (screen.orientation && 'lock' in screen.orientation) {
                    try {
                        // "landscape" locks to either landscape-primary or landscape-secondary
                        await (screen.orientation as any).lock('landscape');
                    } catch (e) {
                        // Ignore lock errors (not supported or not trusted event)
                        console.log('Orientation lock not supported or failed', e);
                    }
                }
            } else {
                // Unlock orientation on exit
                if (screen.orientation && 'unlock' in screen.orientation) {
                    try {
                        (screen.orientation as any).unlock();
                    } catch (e) { }
                }
                await document.exitFullscreen();
            }
        } catch (err: any) {
            console.error(`Error attempting to toggle fullscreen: ${err.message}`);
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all group border border-white/10"
            title="Tela Cheia"
        >
            {isFullscreen ? (
                <>
                    <Minimize2 size={20} className="group-hover:scale-90 transition-transform" />
                    <span className="font-medium hidden sm:inline">Normal</span>
                </>
            ) : (
                <>
                    <Maximize2 size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium hidden sm:inline">Tela Cheia</span>
                </>
            )}
        </button>
    );
}
