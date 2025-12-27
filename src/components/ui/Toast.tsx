'use client';

import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto dismiss
        const timer = setTimeout(() => {
            handleClose();
        }, 4000); // 4 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for exit animation
    };

    const icons = {
        success: <CheckCircle size={20} color="#4ade80" />,
        error: <AlertTriangle size={20} color="#f87171" />,
        warning: <AlertTriangle size={20} color="#fbbf24" />,
        info: <Info size={20} color="#60a5fa" />
    };

    const borderColors = {
        success: 'rgba(74, 222, 128, 0.2)',
        error: 'rgba(248, 113, 113, 0.2)',
        warning: 'rgba(251, 191, 36, 0.2)',
        info: 'rgba(96, 165, 250, 0.2)'
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: 'rgba(15, 23, 42, 0.85)', // Dark glass
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: `1px solid ${borderColors[type]}`,
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                zIndex: 9999,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                minWidth: '300px',
                maxWidth: '400px'
            }}
        >
            <div style={{ flexShrink: 0 }}>{icons[type]}</div>
            <div style={{ flex: 1 }}>{message}</div>
            <button
                onClick={handleClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
}
