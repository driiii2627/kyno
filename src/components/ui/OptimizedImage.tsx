'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    tinySrc?: string; // URL for the tiny blur placeholder
}

export default function OptimizedImage({ src, tinySrc, alt, className, loader, ...props }: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            {/* Tiny Placeholder (Blur) */}
            objectFit: props.style?.objectFit || 'cover',
            {tinySrc && (
                <Image
                    {...props}
                    src={tinySrc}
                    alt={`${alt || ''} (placeholder)`}
                    className={className}
                    style={{
                        ...props.style,
                        objectFit: props.style?.objectFit || 'cover',
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)', // Prevent blur edges showing white
                        opacity: isLoaded ? 0 : 1,
                        transition: 'opacity 0.5s ease-out',
                        position: 'absolute',
                        zIndex: 1
                    }}
                    unoptimized={true}
                />
            )}

            {/* Main High-Res Image */}
            <Image
                {...props}
                src={src}
                alt={alt || ''}
                loader={loader}
                onLoad={handleLoad}
                className={`${className || ''}`}
                style={{
                    ...props.style,
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-in',
                    zIndex: 2
                }}
            // removed unoptimized={true} to allow loader to generate srcset
            />
        </div>
    );
}
