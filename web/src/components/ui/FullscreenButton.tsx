'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    // Track if native API is supported to allow fallback logic
    const [nativeSupport, setNativeSupport] = useState(true);

    useEffect(() => {
        // Check basic support (though standard props are widely supported now, iOS is picky)
        const supported = document.fullscreenEnabled || (document as any).webkitFullscreenEnabled;
        setNativeSupport(!!supported);

        const handleChange = () => {
            const isNativeFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
            setIsFullscreen(isNativeFull);
        };

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
            evt => document.addEventListener(evt, handleChange)
        );

        return () => {
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
                evt => document.removeEventListener(evt, handleChange)
            );
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            const doc = document.documentElement as any;
            const isNativeFull = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;

            if (!isNativeFull) {
                // ENTER Fullscreen
                if (doc.requestFullscreen) {
                    await doc.requestFullscreen();
                } else if (doc.webkitRequestFullscreen) {
                    await doc.webkitRequestFullscreen(); // Safari/iOS
                } else if (doc.msRequestFullscreen) {
                    await doc.msRequestFullscreen();
                } else {
                    // FALLBACK: CSS Fullscreen (Fake)
                    // If API completely missing (older iOS), we toggle a class on body to force UI changes
                    // However, we can't truly hide the browser chrome this way without user action.
                    console.warn("Fullscreen API not supported, attempting manual orientation hint.");
                    // Just try to force landscape
                }

                // FORCE LANDSCAPE (Mobile)
                if (screen.orientation && 'lock' in screen.orientation) {
                    try {
                        await (screen.orientation as any).lock('landscape');
                    } catch (e) {
                        // iOS doesn't support lock(), so we can't do much here automatically.
                    }
                }
            } else {
                // EXIT Fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }

                // Unlock
                if (screen.orientation && 'unlock' in screen.orientation) {
                    try {
                        (screen.orientation as any).unlock();
                    } catch (e) { }
                }
            }
        } catch (err: any) {
            console.error(`Error toggling fullscreen: ${err.message}`);
            // If it failed (iOS often fails requestFullscreen on non-video elements), 
            // alerting the user might be the only way, or we just silently fail/rotate.
            // For now, let's at least ensure the button state doesn't get stuck.
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            // Ensuring visibility: z-index 50 matches wrapper, text-white, opaque bg
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all group border border-white/10"
            style={{ zIndex: 60 }} // Extra safety Z
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
