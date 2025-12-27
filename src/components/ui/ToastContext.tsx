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
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = (message: string) => addToast(message, 'success');
    const error = (message: string) => addToast(message, 'error');
    const info = (message: string) => addToast(message, 'info');

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === 'success' && <CheckCircle size={20} />}
                            {toast.type === 'error' && <AlertCircle size={20} />}
                            {toast.type === 'info' && <Info size={20} />}
                        </div>
                        <span className="toast-message">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="toast-close"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style jsx global>{`
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        .toast {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          min-width: 300px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: top right;
        }

        .toast-success {
          border-left: 4px solid #10b981;
        }

        .toast-error {
          border-left: 4px solid #ef4444;
        }

        .toast-info {
          border-left: 4px solid #3b82f6;
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toast-success .toast-icon { color: #10b981; }
        .toast-error .toast-icon { color: #ef4444; }
        .toast-info .toast-icon { color: #3b82f6; }

        .toast-message {
          flex: 1;
          font-size: 0.95rem;
          line-height: 1.4;
          font-weight: 500;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-close:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
