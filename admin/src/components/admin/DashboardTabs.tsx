'use client';

import { useState } from 'react';
import { UsersTable } from './UsersTable';
import { ContentManager } from '@/components/content/ContentManager';
import { Users, Clapperboard } from 'lucide-react';

export function DashboardTabs({ users }: { users: any[] }) {
    const [tab, setTab] = useState<'users' | 'content'>('users');

    return (
        <div>
            {/* Main Tabs (Pill Style) */}
            <div className="flex justify-center mb-10">
                <div className="flex p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full max-w-md w-full relative">
                    <button
                        onClick={() => setTab('users')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                            ${tab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Users size={16} />
                        Usuários
                    </button>
                    <button
                        onClick={() => setTab('content')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-300
                            ${tab === 'content' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <Clapperboard size={16} />
                        Conteúdo
                    </button>
                </div>
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
