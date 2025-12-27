'use client';

import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
    // Removed tinySrc and enhance as per new requirements
}

export default function OptimizedImage({ src, alt, className, ...props }: OptimizedImageProps) {
    return (
        <div className={`${className || ''}`} style={{ position: 'relative', overflow: 'hidden', ...props.style }}>
            <Image
                {...props}
                src={src}
                alt={alt || ''}
                decoding="async"
                // unoptimized={true} ensures we bypass Vercel server limits/costs as requested
                unoptimized={true}
                style={{
                    objectFit: props.style?.objectFit || 'cover',
                    // User requested NO filters/upscaling
                    // We remove custom transitions that fake "loading"
                }}
            />
        </div>
    );
}
