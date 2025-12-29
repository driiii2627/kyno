'use client';

import { useState } from 'react';
import { UsersTable } from './UsersTable';
import { ContentManager } from '@/components/content/ContentManager';
import { Users, Film } from 'lucide-react';

export function DashboardTabs({ users }: { users: any[] }) {
    const [tab, setTab] = useState<'users' | 'content'>('users');

    return (
        <div>
            {/* Main Tabs */}
            <div className="flex gap-6 mb-8 border-b border-white/10 pb-1">
                <button
                    onClick={() => setTab('users')}
                    className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative
                        ${tab === 'users' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <Users size={18} />
                    Usuários
                    {tab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]"></div>}
                </button>
                <button
                    onClick={() => setTab('content')}
                    className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative
                        ${tab === 'content' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <Film size={18} />
                    Conteúdo
                    {tab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_-2px_10px_rgba(168,85,247,0.5)]"></div>}
                </button>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {tab === 'users' ? (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Gerenciamento de Usuários</h2>
                            <p className="text-gray-400 text-sm">Visualize, edite e monitore os usuários da plataforma.</p>
                        </div>
                        <UsersTable users={users} />
                    </section>
                ) : (
                    <section>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Central de Conteúdo</h2>
                            <p className="text-gray-400 text-sm">Adicione novos filmes e séries via TMDB e verifique a disponibilidade.</p>
                        </div>
                        <ContentManager />
                    </section>
                )}
            </div>
        </div>
    );
}
