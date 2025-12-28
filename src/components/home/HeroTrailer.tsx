'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import styles from './Hero.module.css'; // Creating new module might be better, but reusing for simple overlay styles
import { Volume2, VolumeX, Image as ImageIcon } from 'lucide-react';

interface HeroTrailerProps {
    videoId: string;
    onEnded: () => void;
    onError: () => void;
}

export default function HeroTrailer({ videoId, onEnded, onError }: HeroTrailerProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    // const [player, setPlayer] = useState<any>(null); // Type 'any' for YT player instance
    const playerRef = useRef<any>(null);

    const toggleMute = () => {
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.unMute();
            } else {
                playerRef.current.mute();
            }
            setIsMuted(!isMuted);
        }
    };

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            showinfo: 0,
            mute: 1, // Start muted
            loop: 0,
            modestbranding: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            fs: 0,
        },
    };

    // Progress Interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const current = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();
                if (total > 0) {
                    setProgress((current / total) * 100);
                    setDuration(total);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const onReady = (event: any) => {
        playerRef.current = event.target;
        event.target.playVideo();
    };

    return (
        <div className={`absolute top-0 left-0 w-full h-full z-[5] overflow-hidden pointer-events-none`}>
            {/* Pointer events none on wrapper, but we need buttons to be clickable. 
                We will put buttons outside or ensure higher z-index for controls.
                The iframe itself should interact? No, user said "video extremely clean". 
                Usually background videos are non-interactive.
            */}
            <div className="relative w-[300%] h-[300%] -top-[100%] -left-[100%] pointer-events-none">
                {/* 
                     Scale up to remove black bars/controls even more if needed? 
                     Actually standard 100% cover with object-fit is hard for iframes.
                     The standard "Hero Video" trick is huge scale or specific aspect ratio containers.
                     For now, let's try standard full size.
                 */}
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    className="w-full h-full absolute top-0 left-0" // This wrapper class
                    iframeClassName="w-full h-full object-cover" // Passed to iframe
                    onEnd={onEnded}
                    onError={onError}
                    onReady={onReady}
                />
            </div>

            {/* Custom Controls - Needs z-index > 10 to sit above content? 
                Actually user said "Coloque do lado do botão de silenciar...".
                These will be rendered by the PARENT (Hero) to integrate with UI.
                Or rendered here?
                Let's handle state here and expose controls?
                The user wants buttons "no canto da tela". 
                I'll render them here for encapsulation, absolute positioned.
            */}
            <div className="absolute bottom-8 right-8 z-50 flex items-center gap-4 pointer-events-auto">
                {/* Progress Bar (Mini) */}
                <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-600 transition-all duration-300 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <button
                    onClick={toggleMute}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/10 text-white"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <button
                    onClick={onError} // Treat "Back to Player" as "Error/Skip" -> Switch to image
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/10 text-white"
                    title="Voltar para Imagem"
                >
                    <ImageIcon size={20} />
                </button>
            </div>
        </div>
    );
}
