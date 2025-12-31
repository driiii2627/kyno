'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Notification = {
    id: string;
    title: string;
    message: string;
    image_url?: string;
    type?: 'info' | 'warning' | 'promo';
    action_buttons?: any[];
    created_at: string;
};

interface NotificationContextType {
    activeNotification: Notification | null;
    openNotification: (notification: Notification) => void;
    closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

    const openNotification = (notification: Notification) => {
        setActiveNotification(notification);
        document.body.style.overflow = 'hidden'; // Lock scroll
    };

    const closeNotification = () => {
        setActiveNotification(null);
        document.body.style.overflow = 'unset'; // Unlock scroll
    };

    return (
        <NotificationContext.Provider value={{ activeNotification, openNotification, closeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
