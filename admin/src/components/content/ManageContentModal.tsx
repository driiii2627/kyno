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

    // Load item data when opening
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
        if (!confirm('Isso irá atualizar Títulos, Imagens e Notas com os dados mais recentes do TMDB. A URL do vídeo será mantida. Deseja continuar?')) return;

        setSyncing(true);
        const res = await syncContentAction(item.id, item.media_type, item.tmdb_id);
        setSyncing(false);

        if (res.success) {
            onSuccess(); // Refresh list to show new images/titles
            // Optionally manually update local form state too if we stayed open
            onClose();
        } else {
            alert('Erro ao sincronizar: ' + res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-7xl bg-[#0a0a0a] rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">

                {/* Visual Header (Backdrop Blended) */}
                <div className="relative h-72 w-full overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent z-10" />

                    {formData.backdrop_url ? (
                        <img
                            src={`https://image.tmdb.org/t/p/original${formData.backdrop_url}`}
                            alt="Backdrop"
                            className="w-full h-full object-cover opacity-50"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-900" />
                    )}

                    {/* Top Controls: Just Close */}
                    <div className="absolute top-6 right-6 z-20">
                        <button
                            onClick={onClose}
                            className="bg-black/40 hover:bg-white/10 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Title & Type Badge */}
                    <div className="absolute bottom-6 left-8 right-8 z-20 flex items-end gap-8">
                        {/* Poster Overlap - Increased size and z-index ensures it sits on top of body padding if needed */}
                        <div className="hidden md:block w-40 h-60 rounded-xl shadow-2xl border-2 border-white/10 overflow-hidden bg-gray-800 -mb-20 shrink-0 relative z-30 transform hover:scale-105 transition-transform duration-500">
                            {formData.poster_url ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${formData.poster_url}`}
                                    className="w-full h-full object-cover"
                                    alt="Poster"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-500"><ImageIcon /></div>
                            )}
                        </div>

                        <div className="flex-1 mb-2">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider ${item.media_type === 'movie' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
                                    {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                </span>
                                <span className="text-gray-400 text-xs font-mono opacity-60">ID: {item.id} • TMDB: {item.tmdb_id}</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-xl tracking-tight">
                                {formData.title || 'Sem Título'}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] custom-scrollbar">
                    <div className="p-8 pt-24 md:pl-56 md:pt-10 space-y-8">

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {/* Left Column: Metadata */}
                            <div className="space-y-6">
                                {/* Title Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={12} /> Título
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all font-medium text-base"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={12} /> Sinopse
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={6}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:border-blue-500/50 focus:bg-white/10 outline-none transition-all resize-none leading-relaxed text-sm"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Media & Actions */}
                            <div className="space-y-6">
                                {/* Video URL */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                        <Video size={12} /> URL do Vídeo (M3U8 / MP4)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="video_url"
                                            value={formData.video_url}
                                            onChange={handleChange}
                                            placeholder="https://..."
                                            className="w-full bg-blue-500/5 border border-blue-500/20 rounded-lg pl-10 pr-4 py-3 text-blue-200 focus:border-blue-500/50 focus:bg-blue-500/10 outline-none transition-all font-mono text-xs shadow-inner"
                                        />
                                        <PlayCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50" size={16} />
                                    </div>
                                </div>

                                {/* Image URLs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-600 uppercase">Poster URL</label>
                                        <input
                                            type="text"
                                            name="poster_url"
                                            value={formData.poster_url}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 focus:border-white/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-600 uppercase">Backdrop URL</label>
                                        <input
                                            type="text"
                                            name="backdrop_url"
                                            value={formData.backdrop_url}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 focus:border-white/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between gap-4">
                    <button
                        onClick={handleDelete}
                        disabled={loading || syncing}
                        className="px-6 py-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors uppercase tracking-wide"
                    >
                        {loading ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={16} />}
                        Excluir Conteúdo
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={handleSync}
                            disabled={syncing || loading}
                            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all uppercase tracking-wide"
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Sync...' : 'Sincronizar'}
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={loading || syncing}
                            className="px-8 py-2.5 bg-white hover:bg-gray-200 text-black rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-[1.02] uppercase tracking-wide"
                        >
                            {loading ? <Loader2 className="animate-spin" size={14} /> : <Save size={16} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
