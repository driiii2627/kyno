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
        <div className={styles.trailerWrapper}>
            <div className={styles.videoContainer}>
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    className={styles.youtubePlayer} // Wrapper div
                    iframeClassName={styles.iframe} // Actual iframe
                    onEnd={onEnded}
                    onError={onError}
                    onReady={onReady}
                />
            </div>

            <div className={styles.trailerControls}>
                {/* Progress Bar (Mini) */}
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <button
                    onClick={toggleMute}
                    className={styles.controlBtn}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <button
                    onClick={onError}
                    className={styles.controlBtn}
                    title="Voltar para Imagem"
                >
                    <ImageIcon size={20} />
                </button>
            </div>
        </div>
    );
}
