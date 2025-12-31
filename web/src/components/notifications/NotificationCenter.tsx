'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import NotificationPopup from './NotificationPopup';
import styles from './Notifications.module.css';

interface NotificationCenterProps {
    isMobile?: boolean; // If true, adapts styling for mobile navbar
}

export default function NotificationCenter({ isMobile = false }: NotificationCenterProps) {
    // const supabase = createClient(); // uses singleton now
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [activePopup, setActivePopup] = useState<any>(null);
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

                // Auto-trigger latest popup if it's very distinct? 
                // Nah, intrusive. Let user click.
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
        setActivePopup(notification);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={popupRef}>
            {/* Bell Icon - Premium Glass Style */}
            {/* Bell Icon - Premium Glass Style (Matches Navbar.module.css .iconBtn) */}
            <button
                onClick={toggleInbox}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all border
                    ${isOpen
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'bg-white/10 backdrop-blur-md border-white/5 text-gray-300 hover:bg-white/20 hover:text-white hover:border-white/30'
                    }
                `}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#000] shadow-sm animate-pulse" />
                )}
            </button>

            {/* Inbox Dropdown */}
            {isOpen && (
                <div className={`absolute z-50 w-80 max-w-[90vw] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right
                    ${isMobile ? 'top-full left-1/2 -translate-x-1/2 mt-4' : 'top-full right-0 mt-4'}
                `}>
                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Bell size={14} className="text-blue-400" /> Notificações
                        </h4>
                        {unreadCount > 0 && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                {unreadCount} novas
                            </span>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500 text-xs">
                                Nenhuma notificação nova.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {notifications.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className="w-full text-left p-4 hover:bg-white/5 transition flex gap-3 items-start"
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'promo' ? 'bg-purple-500' :
                                            n.type === 'warning' ? 'bg-orange-500' :
                                                'bg-blue-500'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium text-white leading-snug mb-1">
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <span className="text-[10px] text-zinc-600 mt-2 block">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Popup Modal */}
            <NotificationPopup
                notification={activePopup}
                onClose={() => setActivePopup(null)}
            />
        </div>
    );
}
