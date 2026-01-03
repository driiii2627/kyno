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

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();

        // 1. Track
        void trackGenreInterest(genres);

        // 2. Transition
        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <a
            href={href}
            className={className}
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
