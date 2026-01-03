'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent } from 'react';
// import { useProgressBar } from 'next-nprogress-bar'; // Hook availability varies
import NProgress from 'nprogress'; // We might need to install 'nprogress' types or pkg, but next-nprogress-bar uses it internally.
// Actually, safely accessing NProgress window object is safer if the lib exposes it.

export default function DelayedLink({ href, children, className, delay = 800, onClick, ...props }: any) {
    const router = useRouter();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
        if (isModified) return; // Let browser handle new tabs

        e.preventDefault();

        if (onClick) onClick(e);

        // 1. Start Bar (if NProgress is available globally or via lib)
        // Since we use next-nprogress-bar, let's try to grab the bar from context or trick it.
        // Ideally we install 'nprogress' and use it to control the visual.
        // But let's try to just wait.

        document.body.style.cursor = 'wait';

        // Trigger manual start if possible, otherwise just wait.
        // If we can't trigger bar, at least cursor waits.
        try {
            // @ts-ignore
            if (window.NProgress) window.NProgress.start();
        } catch (e) { }

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
