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

        // 1. Track (Background)
        void trackGenreInterest(genres);

        // 2. Visual Feedback
        document.body.style.cursor = 'wait';

        // 3. Transition Navigation
        // This keeps the OLD page interactive until the NEW payload is fully ready = NO BLACK SCREEN
        startTransition(() => {
            router.push(href);
        });
    };

    if (!isPending) {
        if (typeof document !== 'undefined') document.body.style.cursor = 'default';
    }

    return (
        <a href={href} className={className} onClick={handleClick}>
            {children}
        </a>
    );
}
