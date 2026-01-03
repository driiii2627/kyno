import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trackGenreInterest } from '@/app/actions/recommendations';

interface TrackedLinkProps {
    href: string;
    genres: string[];
    className?: string;
    children: React.ReactNode;
}

export default function TrackedLink({ href, genres, className, children }: TrackedLinkProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        // Prevent default navigation
        e.preventDefault();

        // 1. Track (Background)
        void trackGenreInterest(genres);

        // 2. Start Loading Visuals
        document.body.style.cursor = 'wait';
        // Try to find NProgress provided by the lib
        const progressBar = document.querySelector('[role="progressbar"]');
        if (progressBar) {
            // It's hard to trigger the specific lib's bar manually without their hook.
        }

        // 3. Fake Delay
        setTimeout(() => {
            document.body.style.cursor = 'default';
            router.push(href);
        }, 800); // 0.8s delay as requested (approx 1s)
    };

    return (
        <a href={href} className={className} onClick={handleClick}>
            {children}
        </a>
    );
}
