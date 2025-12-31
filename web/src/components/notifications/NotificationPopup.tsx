'use client';

import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface NotificationPopupProps {
    notification: any;
    onClose: () => void;
}

export default function NotificationPopup({ notification, onClose }: NotificationPopupProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!mounted || !notification) return null;

    // Safety check for action_buttons
    const buttons = Array.isArray(notification.action_buttons) ? notification.action_buttons : [];

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Close Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Optional Image */}
                {notification.image_url && (
                    <div className="w-full h-48 relative">
                        <img
                            src={notification.image_url}
                            alt={notification.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                    </div>
                )}

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-white mb-3">
                        {notification.title}
                    </h3>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        {notification.message}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {buttons.map((btn: any, idx: number) => (
                            <Link
                                key={idx}
                                href={btn.url || '#'}
                                onClick={onClose}
                                className="block w-full py-3.5 rounded-xl font-bold text-center transition-transform active:scale-95 text-white"
                                style={{
                                    backgroundColor: btn.color || '#3b82f6',
                                    boxShadow: `0 4px 20px ${btn.color}40`,
                                }}
                            >
                                {btn.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
