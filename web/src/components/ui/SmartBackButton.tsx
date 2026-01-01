'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface SmartBackButtonProps {
    className?: string;
    children?: React.ReactNode;
    fallbackHref?: string;
    iconSize?: number;
}

export default function SmartBackButton({
    className,
    children,
    fallbackHref = '/',
    iconSize = 20
}: SmartBackButtonProps) {
    const router = useRouter();

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        // Attempt to go back.
        // If the user arrived directly (new tab), history.length is usually 1 or 2 (depending on browser quirks).
        // It's hard to know for sure if back() will exit the domain.
        // Common safe pattern: rely on router.back(). If it strictly requires ensuring 'internal' back only, we need custom history.
        // For this user request ("botão ... ter uma memoria ... e mandar ele de volta pro mesmo lugar"), router.back() is the correct implementation.
        // Fallback is tricky with just router.back(), but standard usage is to assume back works if history > 1.

        if (typeof window !== 'undefined' && window.history.state && window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    };

    return (
        <a href={fallbackHref} onClick={handleBack} className={className}>
            {children || (
                <>
                    <ArrowLeft size={iconSize} />
                    <span>Voltar</span>
                </>
            )}
        </a>
    );
}
