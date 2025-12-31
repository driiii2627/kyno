'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './Notifications.module.css';
import { useNotification } from '@/context/NotificationContext';

interface NotificationCenterProps {
    isMobile?: boolean; // If true, adapts styling for mobile navbar
}

export default function NotificationCenter({ isMobile = false }: NotificationCenterProps) {
    // const supabase = createClient(); // uses singleton now
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Global Notification Context
    const { openNotification } = useNotification();

    const popupRef = useRef<HTMLDivElement>(null);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (data) {
                // Filter out expired client-side if needed or rely on Policy
                // Check local storage for "read" items (optional, implies viewed in list)
                const viewedIds = JSON.parse(localStorage.getItem('kyno_viewed_notifications') || '[]');

                // Calculate unread
                // Logic: A notification is unread if its ID is NOT in viewedIds
                // However, we want the red dot to persist until the user CLOSES the notification popup or OPENS the inbox?
                // Let's say: Opening Inbox clears badge.

                const unread = data.filter(n => !viewedIds.includes(n.id)).length;
                setUnreadCount(unread);
                setNotifications(data);
            }
        };

        fetchNotifications();

        // Realtime subscription (Optional, for now polling is safer)
        const channel = supabase
            .channel('notifications_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { document.removeEventListener('mousedown', handleClickOutside); };
    }, []);

    const toggleInbox = () => {
        if (!isOpen && unreadCount > 0) {
            // Mark all as viewed locally when opening
            const ids = notifications.map(n => n.id);
            localStorage.setItem('kyno_viewed_notifications', JSON.stringify(ids));
            setUnreadCount(0);
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification: any) => {
        // Trigger Global Popup
        openNotification(notification);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={popupRef}>
            {/* Bell Icon - Premium Glass Style */}
            {/* Bell Icon - Premium Glass Style */}
            <button
                onClick={toggleInbox}
                className={`${styles.iconBtn} ${isOpen ? styles.iconBtnActive : ''} relative`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#000] shadow-sm animate-pulse" />
                )}
            </button>

            {/* Inbox Dropdown (CSS Module) */}
            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h4 className={styles.headerTitle}>
                            <Bell size={14} className="text-blue-400" /> Notificações
                        </h4>
                        {unreadCount > 0 && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} novas
                            </span>
                        )}
                    </div>

                    <div className={`${styles.list} ${styles.inboxList}`}>
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs">
                                Nenhuma notificação nova.
                            </div>
                        ) : (
                            <div className={styles.list}>
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNotificationClick(n);
                                        }}
                                        className={styles.listItem}
                                    >
                                        <div
                                            className={styles.unreadIndicator}
                                            style={{
                                                backgroundColor: n.type === 'promo' ? '#a855f7' : n.type === 'warning' ? '#f97316' : '#3b82f6',
                                                color: n.type === 'promo' ? '#a855f7' : n.type === 'warning' ? '#f97316' : '#3b82f6'
                                            }}
                                        />
                                        <div className={styles.contentCol}>
                                            <p className={styles.itemTitle}>
                                                {n.title}
                                            </p>
                                            <p className={styles.itemMessage}>
                                                {n.message}
                                            </p>
                                            <span className={styles.itemDate}>
                                                {new Date(n.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
