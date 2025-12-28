'use client';

import { useState } from 'react';
import { User, ChevronDown, ChevronRight, Monitor, Calendar, Search, Trash2, Edit2, Check, X, ShieldAlert, Mail } from 'lucide-react';
import { deleteUserAction, updateUserEmailAction } from '@/app/actions/users';

interface UsersTableProps {
    users: any[];
}

export function UsersTable({ users }: UsersTableProps) {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editEmailValue, setEditEmailValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const idMatch = user.id.toLowerCase().includes(searchLower);
        const nameMatch = user.profiles?.some((p: any) => p.name.toLowerCase().includes(searchLower));
        const ipMatch = user.last_ip?.includes(searchLower);

        return emailMatch || idMatch || nameMatch || ipMatch;
    });

    const toggleUser = (id: string) => {
        if (expandedUserId === id) setExpandedUserId(null);
        else setExpandedUserId(id);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('TEM CERTEZA? Isso deletará a conta e TODOS os perfis associados permanentemente.')) return;

        const res = await deleteUserAction(userId);
        if (res.error) alert(res.error);
        else alert('Usuário deletado com sucesso!');
    };

    const startEditing = (user: any) => {
        setEditingUserId(user.id);
        setEditEmailValue(user.email);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setEditEmailValue('');
    };

    const saveEmail = async (userId: string) => {
        setIsSaving(true);
        const res = await updateUserEmailAction(userId, editEmailValue);
        setIsSaving(false);

        if (res.error) alert(res.error);
        else {
            alert('Email atualizado!');
            setEditingUserId(null);
        }
    };

    return (
        <div>
            {/* Header / Search Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button className="text-white font-bold border-b-2 border-blue-500 pb-4 -mb-4.5 px-2">
                        Usuários <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-2">{filteredUsers.length}</span>
                    </button>
                    <button className="text-gray-500 font-medium hover:text-gray-300 pb-4 -mb-4.5 px-2 transition-colors">
                        Conteúdo (Em breve)
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email, ID..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-white/10 bg-white/5">
                            <th className="p-4 font-semibold rounded-tl-lg">Usuário</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Data de Cadastro</th>
                            <th className="p-4 font-semibold">Último Acesso</th>
                            <th className="p-4 font-semibold w-10 rounded-tr-lg"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                                    Nenhum usuário encontrado para "{searchTerm}"
                                </td>
                            </tr>
                        ) : filteredUsers.map((user) => (
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
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {user.profiles?.[0]?.name || 'Sem Nome'}
                                                {user.profiles?.length > 1 && (
                                                    <span className="text-[10px] text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">
                                                        +{user.profiles.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 md:hidden">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300" onClick={(e) => e.stopPropagation()}>
                                        {editingUserId === user.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="email"
                                                    value={editEmailValue}
                                                    onChange={(e) => setEditEmailValue(e.target.value)}
                                                    className="bg-black/40 border border-blue-500/50 rounded px-2 py-1 text-white text-xs w-48 focus:outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => saveEmail(user.id)} disabled={isSaving} className="text-green-400 hover:text-green-300 p-1 bg-green-900/20 rounded">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-400 hover:text-red-300 p-1 bg-red-900/20 rounded">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group">
                                                {user.email}
                                                <button
                                                    onClick={() => startEditing(user)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity p-1"
                                                    title="Editar Email"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-600" />
                                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                        </div>
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
                                        <td colSpan={5} className="p-6 cursor-default">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Details Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                                                        <Monitor size={16} className="text-blue-400" />
                                                        Detalhes da Conta
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-4 bg-black/40 p-5 rounded-xl border border-white/5">
                                                        <div className="col-span-2">
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">ID do Usuário</p>
                                                            <p className="text-xs text-gray-300 font-mono break-all bg-black/30 p-2 rounded border border-white/5">{user.id}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Provedor</p>
                                                            <span className="text-xs text-blue-200 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 capitalize inline-block">
                                                                {user.app_metadata.provider || 'Email'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                                            <span className={`text-xs px-2 py-1 rounded border capitalize inline-block ${user.email_confirmed_at ? 'text-green-200 bg-green-500/10 border-green-500/20' : 'text-yellow-200 bg-yellow-500/10 border-yellow-500/20'}`}>
                                                                {user.email_confirmed_at ? 'Confirmado' : 'Pendente'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Criado em</p>
                                                            <p className="text-xs text-gray-300">
                                                                {new Date(user.created_at).toLocaleString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Último Login</p>
                                                            <p className="text-xs text-gray-300">
                                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">IP (Registro/Último)</p>
                                                            <p className="text-xs text-gray-300 font-mono">
                                                                {user.last_ip || 'Desconhecido'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Danger Zone */}
                                                    <div className="pt-4 border-t border-white/5">
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded transition-colors w-full sm:w-auto justify-center sm:justify-start"
                                                        >
                                                            <Trash2 size={14} />
                                                            Deletar Usuário Permanentemente
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Profile Section */}
                                                <div className="space-y-4">
                                                    <h3 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                                                        <User size={16} className="text-purple-400" />
                                                        Perfis Públicos ({user.profiles?.length || 0})
                                                    </h3>
                                                    {user.profiles && user.profiles.length > 0 ? (
                                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {user.profiles.map((profile: any) => (
                                                                <div key={profile.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors group">
                                                                    <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 shadow-lg relative">
                                                                        {profile.avatar_url ? (
                                                                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                                <User size={20} />
                                                                            </div>
                                                                        )}
                                                                        {/* Edit icon for profile could go here */}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-white font-bold truncate">{profile.name}</p>
                                                                            {profile.is_kids && <span className="bg-green-500 text-black text-[9px] font-bold px-1 rounded">KIDS</span>}
                                                                        </div>
                                                                        <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">ID: {profile.id}</p>
                                                                        <div className="flex items-center gap-4 mt-2">
                                                                            <p className="text-[10px] text-gray-500">
                                                                                Via: <span className="text-gray-400">Web</span>
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-500">
                                                                                Atualizado: {new Date(profile.last_name_update || profile.created_at).toLocaleDateString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 italic p-8 border border-dashed border-white/10 rounded-xl text-center bg-black/20">
                                                            <User size={32} className="mx-auto mb-2 opacity-20" />
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
