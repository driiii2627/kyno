'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Save, RefreshCw, Loader2, PlayCircle, Image as ImageIcon, FileText, Video } from 'lucide-react';
import { updateContentAction, deleteContentAction, syncContentAction } from '@/app/actions/content';

interface ManageContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onSuccess: () => void;
}

export function ManageContentModal({ isOpen, onClose, item, onSuccess }: ManageContentModalProps) {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        poster_url: '',
        backdrop_url: '',
        logo_url: '',
        video_url: ''
    });

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || '',
                description: item.description || '',
                poster_url: item.poster_url || '',
                backdrop_url: item.backdrop_url || '',
                logo_url: item.logo_url || '',
                video_url: item.video_url || ''
            });
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setLoading(true);
        const res = await updateContentAction(item.id, item.media_type, formData);
        setLoading(false);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Erro ao salvar: ' + res.error);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Deseja realmente EXCLUIR este conteúdo? Esta ação não pode ser desfeita.')) return;
        setLoading(true);
        const res = await deleteContentAction(item.id, item.media_type);
        setLoading(false);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Erro ao excluir: ' + res.error);
        }
    };

    const handleSync = async () => {
        if (!confirm('Isso irá atualizar metadados com o TMDB. Deseja continuar?')) return;
        setSyncing(true);
        const res = await syncContentAction(item.id, item.media_type, item.tmdb_id);
        setSyncing(false);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Erro ao sincronizar: ' + res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-modal-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 4px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>

            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            {/* Modal Container */}
            <div className="relative w-full max-w-[90vw] h-[90vh] bg-[#0a0a0a] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-modal-scrollbar">

                    {/* Header Image Section */}
                    <div className="relative w-full h-[400px] shrink-0">
                        <div className="absolute inset-0">
                            {formData.backdrop_url ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/original${formData.backdrop_url}`}
                                    alt="Backdrop"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-900" />
                            )}
                            {/* Improved Gradient Overlay: Stronger fade to merge with body */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                        </div>

                        {/* Controls */}
                        <div className="absolute top-8 right-8 z-50">
                            <button
                                onClick={onClose}
                                className="bg-black/50 hover:bg-white/10 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Title & Info Layer - Pushed to bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-10 pb-0 flex items-end z-20 container mx-auto max-w-[1600px]">
                            {/* Empty space left for poster */}
                            <div className="hidden xl:block w-[300px] shrink-0 mr-12" />

                            <div className="flex-1 pb-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded border uppercase tracking-wider ${item.media_type === 'movie' ? 'bg-blue-600/80 text-white border-blue-500/50' : 'bg-purple-600/80 text-white border-purple-500/50'}`}>
                                        {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                    </span>
                                    <span className="text-gray-400 text-xs font-mono bg-black/50 px-2 py-1 rounded border border-white/5">ID: {item.id}</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white leading-none drop-shadow-2xl tracking-tighter">
                                    {formData.title || 'Sem Título'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Body Section */}
                    <div className="bg-[#0a0a0a] pb-20">
                        <div className="container mx-auto max-w-[1600px] p-10 pt-0">
                            <div className="flex flex-col xl:flex-row gap-16">

                                {/* Poster Column (Overlapping) */}
                                <div className="xl:w-[300px] shrink-0 relative z-30 hidden xl:block">
                                    <div className="-mt-48 rounded-xl overflow-hidden shadow-2xl border-[4px] border-[#0a0a0a] bg-[#1a1a1a]">
                                        {formData.poster_url ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w780${formData.poster_url}`}
                                                className="w-full h-auto object-cover"
                                                alt="Poster"
                                            />
                                        ) : (
                                            <div className="h-[450px] flex items-center justify-center text-gray-500"><ImageIcon size={64} /></div>
                                        )}
                                    </div>

                                    {/* Quick Actions under poster */}
                                    <div className="mt-6 flex flex-col gap-3">
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing || loading}
                                            className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition-all border border-white/5"
                                        >
                                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                            SINCRONIZAR TMDB
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading || syncing}
                                            className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition-all border border-red-500/10"
                                        >
                                            <Trash2 size={16} />
                                            EXCLUIR
                                        </button>
                                    </div>
                                </div>

                                {/* Form Column */}
                                <div className="flex-1 space-y-12 pt-8">

                                    {/* Inputs Group 1 */}
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-[#666] uppercase tracking-widest pl-1">Título Oficial</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-6 py-5 text-white text-xl font-bold focus:border-blue-500/50 focus:bg-[#161616] outline-none transition-all placeholder-white/10"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-[#666] uppercase tracking-widest pl-1">Sinopse</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={6}
                                                className="w-full bg-[#111] border border-white/5 rounded-2xl px-6 py-5 text-gray-300 text-base leading-relaxed focus:border-blue-500/50 focus:bg-[#161616] outline-none transition-all resize-none placeholder-white/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Video Section */}
                                    <div className="p-8 bg-[#0f0f0f] rounded-3xl border border-white/5 space-y-6">
                                        <div className="flex items-center gap-3 text-blue-400 mb-2">
                                            <Video size={20} />
                                            <h3 className="font-bold uppercase tracking-widest text-sm">Configuração de Streaming</h3>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="video_url"
                                                value={formData.video_url}
                                                onChange={handleChange}
                                                placeholder="https://..."
                                                className="w-full bg-[#0a0a0a] border border-blue-900/30 rounded-xl pl-14 pr-6 py-5 text-blue-100 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                                            />
                                            <PlayCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            Suporta links diretos .mp4 e listas .m3u8 (HLS)
                                        </div>
                                    </div>

                                    {/* Images Section */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider pl-1">Poster URL</label>
                                            <input
                                                type="text"
                                                name="poster_url"
                                                value={formData.poster_url}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-xs text-gray-300 focus:border-white/20 outline-none font-mono"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider pl-1">Backdrop URL</label>
                                            <input
                                                type="text"
                                                name="backdrop_url"
                                                value={formData.backdrop_url}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-4 text-xs text-gray-300 focus:border-white/20 outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Big Save Button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || syncing}
                                        className="w-full bg-white hover:bg-gray-100 text-black py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.01] uppercase tracking-widest mt-8"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                                        Salvar Alterações
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
