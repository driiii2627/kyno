'use client';

import Link from 'next/link';
import { trackGenreInterest } from '@/app/actions/recommendations';

interface TrackedLinkProps {
    href: string;
    genres: string[];
    className?: string;
    children: React.ReactNode;
}

export default function TrackedLink({ href, genres, className, children }: TrackedLinkProps) {
    const handleClick = () => {
        // "Fire and forget" - we do not await this, so navigation is instant
        // The server action runs in the background
        void trackGenreInterest(genres);
    };

    return (
        <Link href={href} className={className} onClick={handleClick}>
            {children}
        </Link>
    );
}
