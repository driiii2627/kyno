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

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
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
