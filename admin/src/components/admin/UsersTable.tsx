'use client';

import { useState } from 'react';
import { User, ChevronDown, ChevronRight, Monitor, Calendar } from 'lucide-react';

interface UsersTableProps {
    users: any[]; // Using any for speed, ideally typed
}

export function UsersTable({ users }: UsersTableProps) {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

    const toggleUser = (id: string) => {
        if (expandedUserId === id) setExpandedUserId(null);
        else setExpandedUserId(id);
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <button className="text-white font-bold border-b-2 border-blue-500 pb-4 -mb-4.5 px-2">
                    Usuários
                </button>
                <button className="text-gray-500 font-medium hover:text-gray-300 pb-4 -mb-4.5 px-2 transition-colors">
                    Conteúdo (Em breve)
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10">
                            <th className="p-4 font-semibold">Usuário</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Data de Cadastro</th>
                            <th className="p-4 font-semibold">Último Acesso</th>
                            <th className="p-4 font-semibold w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {users.map((user) => (
                            <>
                                <tr
                                    key={user.id}
                                    onClick={() => toggleUser(user.id)}
                                    className={`
                                        cursor-pointer transition-colors border-b border-white/5 
                                        ${expandedUserId === user.id ? 'bg-white/5' : 'hover:bg-white/5'}
                                    `}
                                >
                                    <td className="p-4 text-white font-medium flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 overflow-hidden">
                                            {user.profiles?.[0]?.avatar_url ? (
                                                <img src={user.profiles[0].avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </div>
                                        {user.profiles?.[0]?.name || 'Sem Nome'}
                                        {user.profiles?.length > 1 && (
                                            <span className="text-xs text-gray-500 bg-white/10 px-1.5 py-0.5 rounded ml-2">
                                                +{user.profiles.length - 1}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-300">{user.email}</td>
                                    <td className="p-4 text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {expandedUserId === user.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                </tr>
                                {expandedUserId === user.id && (
                                    <tr className="bg-black/20">
                                        <td colSpan={5} className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Details Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-white font-bold flex items-center gap-2">
                                                        <Monitor size={16} className="text-blue-400" />
                                                        Detalhes da Conta (Auth)
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-4 rounded-lg border border-white/5">
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase">ID do Usuário</p>
                                                            <p className="text-xs text-gray-300 font-mono mt-1 break-all">{user.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase">Provedor</p>
                                                            <p className="text-xs text-gray-300 mt-1 capitalize">{user.app_metadata.provider || 'Email'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase">Criado em</p>
                                                            <p className="text-xs text-gray-300 mt-1">
                                                                {new Date(user.created_at).toLocaleString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase">Último Login</p>
                                                            <p className="text-xs text-gray-300 mt-1">
                                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Profile Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-white font-bold flex items-center gap-2">
                                                        <User size={16} className="text-purple-400" />
                                                        Perfis Públicos ({user.profiles?.length || 0})
                                                    </h3>
                                                    {user.profiles && user.profiles.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {user.profiles.map((profile: any) => (
                                                                <div key={profile.id} className="bg-black/20 p-4 rounded-lg border border-white/5 flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded bg-gray-700 overflow-hidden flex-shrink-0">
                                                                        {profile.avatar_url ? (
                                                                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                                <User size={20} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-white font-bold">{profile.name}</p>
                                                                        <p className="text-xs text-gray-400">ID: {profile.id}</p>
                                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                                            Atualizado: {new Date(profile.last_name_update || profile.created_at).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 italic p-4 border border-dashed border-white/10 rounded-lg text-center">
                                                            Nenhum perfil público criado ainda.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
