'use client';

import { useEffect, useRef } from 'react';

interface TurnstileProps {
    siteKey: string;
    onVerify: (token: string) => void;
    onError?: () => void;
    theme?: 'light' | 'dark' | 'auto';
}

declare global {
    interface Window {
        turnstile: any;
        onTurnstileLoaded: () => void;
    }
}

export default function Turnstile({ siteKey, onVerify, onError, theme = 'dark' }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    useEffect(() => {
        // Load script if not present
        if (!document.getElementById('cf-turnstile-script')) {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.id = 'cf-turnstile-script';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const renderWidget = () => {
            if (window.turnstile && containerRef.current && !widgetId.current) {
                widgetId.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: theme,
                    callback: (token: string) => onVerify(token),
                    'error-callback': () => onError?.(),
                });
            }
        };

        // If script is already loaded
        if (window.turnstile) {
            renderWidget();
        } else {
            // Wait for load
            const interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    renderWidget();
                }
            }, 100);
            return () => clearInterval(interval);
        }

        return () => {
            if (widgetId.current && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [siteKey, theme]);

    return <div ref={containerRef} style={{ minHeight: '65px', minWidth: '300px' }} />;
}
