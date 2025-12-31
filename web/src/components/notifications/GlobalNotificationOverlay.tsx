'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

export default function GlobalNotificationOverlay() {
    const { activeNotification, closeNotification } = useNotification();

    if (!activeNotification) return null;

    const buttons = Array.isArray(activeNotification.action_buttons) ? activeNotification.action_buttons : [];

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={closeNotification}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-[fadeIn_0.2s_ease-out]">

                {/* Close Button */}
                <button
                    onClick={closeNotification}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-white/10 text-white transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Hero Image */}
                {activeNotification.image_url && (
                    <div className="w-full h-48 relative shrink-0">
                        <img
                            src={activeNotification.image_url}
                            alt={activeNotification.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
                    </div>
                )}

                {/* Content Body */}
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                        {activeNotification.title}
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        {activeNotification.message}
                    </p>

                    {/* Actions */}
                    {buttons.length > 0 && (
                        <div className="space-y-3">
                            {buttons.map((btn: any, idx: number) => (
                                <Link
                                    key={idx}
                                    href={btn.url || '#'}
                                    onClick={closeNotification}
                                    className="block w-full py-3 rounded-lg font-semibold text-sm text-center text-white hover:brightness-110 transition-all active:scale-[0.98]"
                                    style={{
                                        backgroundColor: btn.color || '#3b82f6',
                                        boxShadow: `0 4px 15px ${btn.color}30`
                                    }}
                                >
                                    {btn.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
