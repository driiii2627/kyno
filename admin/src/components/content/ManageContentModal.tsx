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
            onSuccess();
            onClose();
        } else {
            alert('Erro ao sincronizar: ' + res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Main Card Container - No Overflow Hidden here to allow pop-out elements if we wanted,
                but better strategy is scrolling content. */}
            <div className="relative w-full max-w-7xl bg-[#0a0a0a] rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[95vh] overflow-hidden">

                {/* Scrollable Container for EVERYTHING */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* Visual Header */}
                    <div className="relative h-80 w-full shrink-0">
                        {/* Background Image */}
                        <div className="absolute inset-0 z-0">
                            {formData.backdrop_url ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/original${formData.backdrop_url}`}
                                    alt="Backdrop"
                                    className="w-full h-full object-cover opacity-50 mask-gradient-to-b"
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-900" />
                            )}
                            {/* Gradient Overlay for seamless blend */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
                        </div>

                        {/* Top Right Close */}
                        <div className="absolute top-6 right-6 z-50">
                            <button
                                onClick={onClose}
                                className="bg-black/40 hover:bg-white/10 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110 shadow-lg"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Hero Info Layer */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-0 flex items-end gap-8 z-20">
                            {/* Poster - We put it here, overlapping the container below visually via structure */}
                            <div className="hidden lg:block w-48 h-72 rounded-xl shadow-2xl border-2 border-white/10 overflow-hidden bg-gray-800 shrink-0 transform translate-y-12 transition-transform duration-500 hover:scale-105">
                                {formData.poster_url ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w500${formData.poster_url}`}
                                        className="w-full h-full object-cover"
                                        alt="Poster"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-gray-500"><ImageIcon size={48} /></div>
                                )}
                            </div>

                            <div className="flex-1 pb-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider shadow-lg ${item.media_type === 'movie' ? 'bg-blue-600/80 text-white border-blue-400/50' : 'bg-purple-600/80 text-white border-purple-400/50'}`}>
                                        {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                    </span>
                                    <span className="text-gray-400 text-xs font-mono opacity-80 bg-black/50 px-2 py-1 rounded">ID: {item.id}</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black text-white leading-none drop-shadow-2xl tracking-tight max-w-4xl">
                                    {formData.title || 'Sem Título'}
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-8 lg:p-12 pt-16 bg-[#0a0a0a] min-h-[400px]">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                            {/* Spacer for Poster Column */}
                            <div className="hidden lg:block lg:col-span-3">
                                {/* The poster sits above this empty space visually because of the negative margin/transform in the header */}
                            </div>

                            {/* Main Form Area */}
                            <div className="lg:col-span-9 space-y-10">

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                    {/* Left: Text Data */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={14} className="text-blue-500" /> Título Oficial
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-bold text-lg placeholder-white/20"
                                                placeholder="Nome do filme ou série"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={14} className="text-blue-500" /> Sinopse
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={8}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all resize-none leading-relaxed text-sm placeholder-white/20"
                                                placeholder="Descrição detalhada..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Technical Data */}
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                                <Video size={14} /> URL do Vídeo (Stream)
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    name="video_url"
                                                    value={formData.video_url}
                                                    onChange={handleChange}
                                                    placeholder="https://server.com/video.m3u8"
                                                    className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl pl-12 pr-4 py-4 text-blue-100 focus:border-blue-500 focus:bg-blue-500/10 outline-none transition-all font-mono text-sm shadow-inner group-hover:border-blue-500/40"
                                                />
                                                <PlayCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                            </div>
                                            <p className="text-[10px] text-gray-600 pl-1">Link direto para o arquivo .mp4 ou .m3u8</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Poster URL</label>
                                                <input
                                                    type="text"
                                                    name="poster_url"
                                                    value={formData.poster_url}
                                                    onChange={handleChange}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-gray-300 focus:border-blue-500/50 outline-none font-mono"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Backdrop URL</label>
                                                <input
                                                    type="text"
                                                    name="backdrop_url"
                                                    value={formData.backdrop_url}
                                                    onChange={handleChange}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-gray-300 focus:border-blue-500/50 outline-none font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Buttons Group */}
                                        <div className="pt-8 flex flex-col gap-4">
                                            <button
                                                onClick={handleSave}
                                                disabled={loading || syncing}
                                                className="w-full bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.01] uppercase tracking-wide"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                                Salvar Alterações
                                            </button>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={handleSync}
                                                    disabled={syncing || loading}
                                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wide hover:border-white/20"
                                                >
                                                    <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                                    {syncing ? 'Sync...' : 'Sincronizar TMDB'}
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={loading || syncing}
                                                    className="flex-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wide hover:border-red-500/40"
                                                >
                                                    <Trash2 size={16} />
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
