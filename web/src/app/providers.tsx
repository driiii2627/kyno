'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="2px"
                color="#e50914"
                options={{ showSpinner: false }}
                shallowRouting
            />
        </>
    );
}
