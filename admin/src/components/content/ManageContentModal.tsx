'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Save, RefreshCw, Loader2, PlayCircle, Image as ImageIcon } from 'lucide-react';
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
            alert('Alterações salvas com sucesso!');
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
            alert('Conteúdo sincronizado com sucesso!');
            onSuccess(); // Refresh list to show new images/titles
            // Optionally manually update local form state too if we stayed open
            onClose();
        } else {
            alert('Erro ao sincronizar: ' + res.error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Gerenciar Conteúdo
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase">
                                {item.media_type === 'movie' ? 'Filme' : 'Série'}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400">ID: {item.id} • TMDB: {item.tmdb_id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Title & Sync Row */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Título</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors font-medium"
                            />
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncing || loading}
                            className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors h-[50px]"
                            title="Atualizar dados do TMDB"
                        >
                            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Sync...' : 'Sincronizar TMDB'}
                        </button>
                    </div>

                    {/* Video URL */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                            <PlayCircle size={14} /> URL do Vídeo / Player
                        </label>
                        <input
                            type="text"
                            name="video_url"
                            value={formData.video_url}
                            onChange={handleChange}
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-blue-500/30 rounded-lg px-4 py-3 text-blue-300 focus:border-blue-500 outline-none transition-colors font-mono text-sm"
                        />
                        <p className="text-xs text-gray-600">Link direto do player ou arquivo de vídeo (m3u8/mp4).</p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase">Sinopse</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-gray-300 focus:border-blue-500 outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Images Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <ImageIcon size={14} /> Poster URL
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    name="poster_url"
                                    value={formData.poster_url}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none"
                                />
                                {formData.poster_url && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-8 bg-gray-800 rounded overflow-hidden border border-white/20">
                                        <img src={`https://image.tmdb.org/t/p/w200${formData.poster_url}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <ImageIcon size={14} /> Backdrop URL
                            </label>
                            <input
                                type="text"
                                name="backdrop_url"
                                value={formData.backdrop_url}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                <ImageIcon size={14} /> Logo URL
                            </label>
                            <input
                                type="text"
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center gap-4">
                    <button
                        onClick={handleDelete}
                        disabled={loading || syncing}
                        className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        Excluir Conteúdo
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2 text-gray-400 hover:text-white font-bold text-sm transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading || syncing}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
