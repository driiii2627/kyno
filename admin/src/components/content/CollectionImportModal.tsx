'use client';

import { useState, useEffect } from 'react';
import { getCollectionDetailsAction, importCollectionAction } from '@/app/actions/content';
import { X, Check, Loader2, Layers, AlertCircle, Download, Film } from 'lucide-react';

interface CollectionImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    collectionId: number;
    initialItem: any; // The item that triggered this
    onSuccess: () => void;
}

export function CollectionImportModal({ isOpen, onClose, collectionId, initialItem, onSuccess }: CollectionImportModalProps) {
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [collection, setCollection] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        if (isOpen && collectionId) {
            loadCollection();
        }
    }, [isOpen, collectionId]);

    const loadCollection = async () => {
        setLoading(true);
        const { data, error } = await getCollectionDetailsAction(collectionId);
        setLoading(false);

        if (data) {
            setCollection(data);
            // Default select: All Available AND Not in Library
            const autoSelect = data.parts
                .filter((p: any) => p.is_available && !p.is_in_library)
                .map((p: any) => p.id);
            setSelectedIds(autoSelect);
        } else {
            console.error(error);
            // Fallback: If collection fails, user manually handles single import via other flow? 
            // Or show error here.
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleImport = async () => {
        setImporting(true);
        // Map selected IDs to { id, type: 'movie' } (Collections are almost always movies)
        const items = selectedIds.map(id => ({ id, type: 'movie' as const }));

        const res = await importCollectionAction(items);
        setImporting(false);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Erro na importação em massa: ' + res.error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-gray-400 text-sm animate-pulse">Analisando Franquia...</p>
                    </div>
                ) : collection ? (
                    <>
                        {/* Header */}
                        <div className="relative h-48 shrink-0">
                            <div className="absolute inset-0">
                                <img
                                    src={`https://image.tmdb.org/t/p/original${collection.backdrop_path}`}
                                    className="w-full h-full object-cover opacity-40"
                                    alt="Collection Cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                            </div>
                            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-xs uppercase tracking-widest">
                                        <Layers size={14} /> Franquia Detectada
                                    </div>
                                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">{collection.name}</h1>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <p className="text-2xl font-bold text-white">{collection.parts.length}</p>
                                    <p className="text-xs text-gray-500 uppercase">Títulos</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/10 rounded-full text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-modal-scrollbar bg-[#0a0a0a]">
                            <div className="space-y-2">
                                {collection.parts.map((part: any) => {
                                    const isSelected = selectedIds.includes(part.id);
                                    const canSelect = part.is_available && !part.is_in_library;

                                    return (
                                        <div
                                            key={part.id}
                                            onClick={() => canSelect && toggleSelection(part.id)}
                                            className={`
                                                flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer select-none
                                                ${part.is_in_library
                                                    ? 'bg-blue-500/10 border-blue-500/20 opacity-60'
                                                    : !part.is_available
                                                        ? 'bg-red-500/5 border-red-500/10 opacity-50'
                                                        : isSelected
                                                            ? 'bg-white/10 border-blue-500'
                                                            : 'bg-transparent border-white/5 hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            {/* Checkbox / Status Icon */}
                                            <div className="shrink-0">
                                                {part.is_in_library ? (
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <Check size={14} className="text-white" />
                                                    </div>
                                                ) : !part.is_available ? (
                                                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40">
                                                        <X size={14} className="text-red-500" />
                                                    </div>
                                                ) : (
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                                                        {isSelected && <Check size={14} className="text-white" />}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Poster */}
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${part.poster_path}`}
                                                className="w-12 h-16 object-cover rounded shadow-lg bg-gray-800"
                                                alt={part.title}
                                            />

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold text-sm truncate ${part.is_in_library ? 'text-blue-200' : 'text-white'}`}>
                                                    {part.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{part.release_date?.split('-')[0] || 'TBA'}</span>
                                                    {part.is_in_library && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Na Biblioteca</span>}
                                                    {!part.is_available && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Indisponível</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                <span className="text-white font-bold">{selectedIds.length}</span> selecionados
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={loading || importing || selectedIds.length === 0}
                                    className="px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {importing ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                    {importing ? 'Importando...' : 'Importar Selecionados'}
                                </button>
                            </div>
                        </div>

                    </>
                ) : (
                    <div className="p-12 text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                        <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar coleção</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white underline">Fechar</button>
                    </div>
                )}
            </div>
        </div>
    );
}
