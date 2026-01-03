'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, useTransition } from 'react';

export default function DelayedLink({ href, children, className, onClick, ...props }: any) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (isModified) return;

        e.preventDefault();

        if (onClick) onClick(e);

        // 1. Visual Feedback
        document.body.style.cursor = 'wait';

        // 2. Transition Navigation (No Black Screen, instant swap when ready)
        startTransition(() => {
            router.push(href);
        });

        // Effect cleanup is handled naturally when page unmounts
    };

    // When pending, we keep cursor wait. When done, page swaps.
    if (!isPending) {
        if (typeof document !== 'undefined') document.body.style.cursor = 'default';
    }

    return (
        <Link href={href} className={className} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
}
