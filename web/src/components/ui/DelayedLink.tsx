'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, useTransition } from 'react';

export default function DelayedLink({ href, children, className, onClick, ...props }: any) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // 1. Aggressive Prefetching
    const handlePrefetch = () => {
        router.prefetch(href);
    };

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (isModified) return;

        e.preventDefault();

        if (onClick) onClick(e);

        // Ensure prefetch happens if missed (touch etc)
        router.prefetch(href);

        // 2. Artificial Delay (Premium Pacing)
        // We hold for 800ms. Thanks to hover-prefetch, data is likely ready by then.
        setTimeout(() => {
            startTransition(() => {
                router.push(href);
            });
        }, 800);
    };

    return (
        <Link
            href={href}
            className={className}
            onClick={handleClick}
            onMouseEnter={handlePrefetch}
            onTouchStart={handlePrefetch} // Mobile support
            {...props}
        >
            {children}
        </Link>
    );
}
