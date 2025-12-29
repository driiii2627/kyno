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
        video_url: '',
        trailer_url: '',
        show_trailer: true
    });

    useEffect(() => {
        if (item) {
            setFormData({
                title: item.title || '',
                description: item.description || '',
                poster_url: item.poster_url || '',
                backdrop_url: item.backdrop_url || '',
                logo_url: item.logo_url || '',
                video_url: item.video_url || '',
                trailer_url: item.trailer_url || '',
                show_trailer: item.show_trailer !== undefined ? item.show_trailer : true
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
                    width: 6px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb {
                    background: #2a2a2a;
                    border-radius: 4px;
                }
                .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            `}</style>

            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container - Reduced Size */}
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#0a0a0a] rounded-3xl shadow-2xl border border-white/5 flex flex-col overflow-hidden">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-modal-scrollbar">

                    {/* Header Image Section */}
                    <div className="relative w-full h-[350px] shrink-0">
                        <div className="absolute inset-0">
                            {formData.backdrop_url ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/original${formData.backdrop_url}`}
                                    alt="Backdrop"
                                    className="w-full h-full object-cover opacity-60"
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-900" />
                            )}
                            {/* Seamless Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                            {/* Extra Bottom Fade to ensure transition */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                        </div>

                        {/* Controls */}
                        <div className="absolute top-6 right-6 z-50">
                            <button
                                onClick={onClose}
                                className="bg-black/60 hover:bg-white/10 text-white p-2.5 rounded-full backdrop-blur-md border border-white/5 transition-all hover:scale-110"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Info Layer */}
                        <div className="absolute bottom-0 left-0 right-0 px-10 pb-2 flex items-end z-20">
                            {/* Placeholder for Poster alignment */}
                            <div className="hidden lg:block w-[240px] shrink-0 mr-12" />

                            <div className="flex-1 pb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${item.media_type === 'movie' ? 'bg-blue-600/90 text-white border-blue-500/50' : 'bg-purple-600/90 text-white border-purple-500/50'}`}>
                                        {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                    </span>
                                    <span className="text-gray-400 text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded border border-white/5">ID: {item.id}</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white leading-none drop-shadow-2xl tracking-tighter">
                                    {formData.title || 'Sem Título'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Body Section */}
                    <div className="bg-[#0a0a0a] pb-16">
                        <div className="px-10">
                            <div className="flex flex-col lg:flex-row gap-12">

                                {/* Poster Column */}
                                <div className="lg:w-[240px] shrink-0 relative z-30 hidden lg:block">
                                    <div className="-mt-40 rounded-lg overflow-hidden shadow-2xl border-[4px] border-[#0a0a0a] bg-[#1a1a1a]">
                                        {formData.poster_url ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w500${formData.poster_url}`}
                                                className="w-full h-auto object-cover"
                                                alt="Poster"
                                            />
                                        ) : (
                                            <div className="h-[360px] flex items-center justify-center text-gray-500"><ImageIcon size={48} /></div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 space-y-3">
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing || loading}
                                            className="w-full bg-[#151515] hover:bg-[#202020] text-gray-400 hover:text-white py-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all border border-white/5 tracking-wider"
                                        >
                                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                                            SYNC TMDB
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={loading || syncing}
                                            className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500/80 hover:text-red-400 py-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-2 transition-all border border-red-500/10 tracking-wider"
                                        >
                                            <Trash2 size={14} />
                                            EXCLUIR
                                        </button>
                                    </div>
                                </div>

                                {/* Form Column */}
                                <div className="flex-1 space-y-8 pt-4">

                                    {/* Inputs */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest pl-1">Título Oficial</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-blue-500/30 focus:bg-[#161616] outline-none transition-all placeholder-white/10"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest pl-1">Sinopse</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                className="w-full bg-[#111] border border-white/5 rounded-xl px-5 py-4 text-gray-300 text-sm leading-relaxed focus:border-blue-500/30 focus:bg-[#161616] outline-none transition-all resize-none placeholder-white/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Video Section */}
                                    <div className="p-6 bg-[#0f0f0f] rounded-2xl border border-white/5 space-y-6">
                                        {/* Main Video URL */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-blue-500/80 mb-1">
                                                <Video size={16} />
                                                <h3 className="font-bold uppercase tracking-widest text-[10px]">Streaming Source</h3>
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="video_url"
                                                    value={formData.video_url}
                                                    onChange={handleChange}
                                                    placeholder="https://..."
                                                    className="w-full bg-[#0a0a0a] border border-blue-900/20 rounded-lg pl-12 pr-4 py-4 text-blue-100 font-mono text-xs focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                                                />
                                                <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/50" size={20} />
                                            </div>
                                        </div>

                                        {/* Trailer Section */}
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 text-red-500/80">
                                                    <PlayCircle size={16} />
                                                    <h3 className="font-bold uppercase tracking-widest text-[10px]">Trailer Youtube</h3>
                                                </div>

                                                {/* Toggle Switch */}
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <span className={`text-[10px] font-bold uppercase transition-colors ${formData.show_trailer ? 'text-green-500' : 'text-gray-600'}`}>
                                                        {formData.show_trailer ? 'Ativado' : 'Desativado'}
                                                    </span>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.show_trailer}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, show_trailer: e.target.checked }))}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-10 h-5 rounded-full shadow-inner transition-colors ${formData.show_trailer ? 'bg-green-500/20' : 'bg-white/5'}`}></div>
                                                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-300 ${formData.show_trailer ? 'translate-x-5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-500'}`}></div>
                                                    </div>
                                                </label>
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="trailer_url"
                                                    value={formData.trailer_url}
                                                    onChange={handleChange}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    className="w-full bg-[#0a0a0a] border border-red-900/20 rounded-lg pl-12 pr-4 py-4 text-red-100 font-mono text-xs focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 outline-none transition-all shadow-inner"
                                                />
                                                <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50" size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images Section */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider pl-1">Poster URL</label>
                                            <input
                                                type="text"
                                                name="poster_url"
                                                value={formData.poster_url}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-lg px-4 py-3 text-xs text-gray-400 focus:border-white/20 outline-none font-mono"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider pl-1">Backdrop URL</label>
                                            <input
                                                type="text"
                                                name="backdrop_url"
                                                value={formData.backdrop_url}
                                                onChange={handleChange}
                                                className="w-full bg-[#111] border border-white/5 rounded-lg px-4 py-3 text-xs text-gray-400 focus:border-white/20 outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || syncing}
                                        className="w-full bg-white hover:bg-gray-100 text-black py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.01] uppercase tracking-widest mt-4"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Salvar
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
