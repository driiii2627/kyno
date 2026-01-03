'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackGenreInterest } from '@/app/actions/recommendations';
import { useTransition } from 'react';

interface TrackedLinkProps {
    href: string;
    genres: string[];
    className?: string;
    children: React.ReactNode;
}

export default function TrackedLink({ href, genres, className, children }: TrackedLinkProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handlePrefetch = () => {
        router.prefetch(href);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // 1. Track
        void trackGenreInterest(genres);

        // 2. Ensure Prefetch
        router.prefetch(href);

        // 3. Delayed Transition
        setTimeout(() => {
            startTransition(() => {
                router.push(href);
            });
        }, 800);
    };

    return (
        <a
            href={href}
            className={className}
            onClick={handleClick}
            onMouseEnter={handlePrefetch}
            onTouchStart={handlePrefetch}
        >
            {children}
        </a>
    );
}
