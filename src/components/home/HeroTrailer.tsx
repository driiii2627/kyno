'use client';

import React, { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import styles from './Hero.module.css'; // Creating new module might be better, but reusing for simple overlay styles
import { Volume2, VolumeX, Image as ImageIcon } from 'lucide-react';

interface HeroTrailerProps {
    videoId: string;
    isMuted: boolean;
    onProgress: (progress: number) => void;
    onEnded: () => void;
    onError: () => void;
}

function HeroTrailer({ videoId, isMuted, onProgress, onEnded, onError }: HeroTrailerProps) {
    const playerRef = useRef<any>(null);

    // Sync Mute State
    useEffect(() => {
        if (playerRef.current) {
            if (isMuted) {
                playerRef.current.mute();
            } else {
                playerRef.current.unMute();
            }
        }
    }, [isMuted]);

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1,
            controls: 0,
            rel: 0,
            showinfo: 0,
            mute: 1, // Always start muted, controlled by effect
            loop: 0,
            modestbranding: 1,
            cc_load_policy: 0, // Try to hide captions
            iv_load_policy: 3,
            fs: 0,
            disablekb: 1, // Disable keyboard to prevent focus stealing scroll?
            playsinline: 1,
        },
    };

    // Progress Interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                const current = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();
                if (total > 0) {
                    onProgress((current / total) * 100);
                }
            }
        }, 500); // Throttled to 500ms to reduce renders

        return () => clearInterval(interval);
    }, [onProgress]);

    const onReady = (event: any) => {
        playerRef.current = event.target;

        // Force high quality if possible
        if (typeof event.target.setPlaybackQuality === 'function') {
            event.target.setPlaybackQuality('hd1080');
        }

        event.target.playVideo();
        if (isMuted) {
            event.target.mute();
        } else {
            event.target.unMute();
        }
    };

    return (
        <div className={styles.trailerWrapper}>
            <div className={styles.videoContainer}>
                <YouTube
                    videoId={videoId}
                    opts={opts}
                    className={styles.youtubePlayer}
                    iframeClassName={styles.iframe}
                    onEnd={onEnded}
                    onError={onError}
                    onReady={onReady}
                />
            </div>
            {/* Controls moved to Parent */}
        </div>
    );
}

export default React.memo(HeroTrailer);
