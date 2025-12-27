'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    tinySrc?: string; // Low-res placeholder for blur effect
}

export default function OptimizedImage({ src, tinySrc, alt, className, style, ...props }: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className={`${className || ''}`} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            {/* Tiny Placeholder (Blur) */}
            {tinySrc && (
                <Image
                    {...props}
                    src={tinySrc}
                    alt={alt || ''}
                    fill
                    priority={props.priority} // Load placeholder fast
                    style={{
                        objectFit: style?.objectFit || 'cover',
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)', // Prevent blur edges
                        opacity: isLoaded ? 0 : 1,
                        transition: 'opacity 0.5s ease-out',
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
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                unoptimized={true}
                style={{
                    objectFit: style?.objectFit || 'cover',
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-out',
                    zIndex: 2,
                    ...style
                }}
            />
        </div>
    );
}
