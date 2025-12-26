'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    tinySrc?: string; // URL for the tiny blur placeholder
}

export default function OptimizedImage({ src, tinySrc, alt, className, ...props }: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // If priority is true, we might want to skip the blur effect or handle it differently.
    // However, for "ultra fast" feel, showing something immediately (tinySrc) is still good.
    // If no tinySrc provided, behave like normal Image but with our strict settings.

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Tiny Placeholder (Blur) */}
            {tinySrc && (
                <Image
                    {...props}
                    src={tinySrc}
                    alt={alt || ''}
                    fill
                    quality={10} // Extremely low quality for smallest size
                    priority={props.priority} // Load placeholder fast if main is priority
                    className={`${className || ''}`}
                    style={{
                        objectFit: props.style?.objectFit || 'cover',
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)', // Prevent blur edges showing white
                        opacity: isLoaded ? 0 : 1,
                        transition: 'opacity 0.5s ease-out',
                        position: 'absolute',
                        zIndex: 1
                    }}
                    unoptimized={true} // Keep distinct from main image cache if needed, or false to use Vercel (user said no vercel usage)
                />
            )}

            {/* Main High-Res Image */}
            <Image
                {...props}
                src={src}
                alt={alt || ''}
                onLoad={handleLoad}
                className={`${className || ''}`}
                style={{
                    ...props.style,
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in',
                    zIndex: 2
                }}
                // User requirement: Do NOT use Vercel optimization (server usage).
                // "não quero de jeito nenhum que as imagens usem o servidor"
                unoptimized={true}
            />
        </div>
    );
}
