'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent } from 'react';

export default function DelayedLink({ href, children, className, delay = 800, onClick, ...props }: any) {
    const router = useRouter();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (isModified) return; // Let browser handle new tabs

        e.preventDefault();

        if (onClick) onClick(e);

        // 1. Visual Feedback (Cursor)
        document.body.style.cursor = 'wait';

        // 2. Delay & Navigate
        setTimeout(() => {
            document.body.style.cursor = 'default';
            router.push(href);
        }, delay);
    };

    return (
        <Link href={href} className={className} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
}
