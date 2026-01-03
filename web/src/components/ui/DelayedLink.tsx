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

        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <Link
            href={href}
            className={className}
            onClick={handleClick}
            {...props}
        >
            {children}
        </Link>
    );
}
