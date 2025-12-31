'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trash2, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export function NotificationManager() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });
        setNotifications(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const deleteNotification = async (id: string) => {
        if (!confirm('Tem certeza que deseja apagar essa notificação?')) return;
        const { error } = await supabase.from('notifications').delete().eq('id', id);
        if (!error) {
            fetchNotifications();
        } else {
            alert('Erro ao apagar.');
        }
    };

    if (loading) return <div className="text-white">Carregando...</div>;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-black/40 text-xs uppercase font-bold text-gray-200">
                    <tr>
                        <th className="p-4">Título</th>
                        <th className="p-4">Mensagem</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Data</th>
                        <th className="p-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {notifications.map((n) => (
                        <tr key={n.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-white">{n.title}</td>
                            <td className="p-4 max-w-xs truncate">{n.message}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold bg-white/10 ${n.type === 'promo' ? 'text-purple-400' :
                                        n.type === 'warning' ? 'text-orange-400' :
                                            'text-blue-400'
                                    }`}>
                                    {n.type}
                                </span>
                            </td>
                            <td className="p-4">
                                {new Date(n.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right">
                                <button
                                    onClick={() => deleteNotification(n.id)}
                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {notifications.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-600">
                                Nenhuma notificação enviada.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
