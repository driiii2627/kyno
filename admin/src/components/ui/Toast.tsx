'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`
              pointer-events-auto min-w-[300px] max-w-md bg-[#111] border border-white/10 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-right-full duration-300
              ${t.type === 'success' ? 'border-green-500/20 bg-green-950/20' : ''}
              ${t.type === 'error' ? 'border-red-500/20 bg-red-950/20' : ''}
            `}
                    >
                        {t.type === 'success' && <CheckCircle className="text-green-500 shrink-0" size={20} />}
                        {t.type === 'error' && <AlertCircle className="text-red-500 shrink-0" size={20} />}
                        {t.type === 'info' && <Info className="text-blue-500 shrink-0" size={20} />}

                        <div className="flex-1 text-sm font-medium pt-0.5">{t.message}</div>

                        <button onClick={() => removeToast(t.id)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
