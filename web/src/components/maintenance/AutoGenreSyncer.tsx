'use client';

import { useEffect, useRef } from 'react';

export default function AutoGenreSyncer() {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const runSync = async () => {
            try {
                // Check if we ran this recently to avoid loops (e.g. session storage)
                const lastRun = sessionStorage.getItem('genre_sync_ts');
                if (lastRun && Date.now() - parseInt(lastRun) < 1000 * 60 * 5) {
                    console.log('[GenreSync] Skipped (Ran recently)');
                    return;
                }

                console.log('[GenreSync] Triggering background sync...');
                const res = await fetch('/api/cron/sync-genres');
                const data = await res.json();
                console.log('[GenreSync] Result:', data);

                sessionStorage.setItem('genre_sync_ts', Date.now().toString());
            } catch (e) {
                console.error('[GenreSync] Failed', e);
            }
        };

        runSync();
    }, []);

    return null; // Invisible component
}
