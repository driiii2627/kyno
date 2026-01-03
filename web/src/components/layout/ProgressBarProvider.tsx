'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <ProgressBar
                height="2px"
                color="#3b82f6" // Blue-500
                options={{ showSpinner: false }}
                shallowRouting
            />
        </>
    );
}
