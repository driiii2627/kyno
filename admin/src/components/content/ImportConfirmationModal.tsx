'use client';

import { X, Check, AlertCircle, Loader2, Download } from 'lucide-react';

interface ImportConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onConfirm: () => void;
    loading?: boolean;
}

export function ImportConfirmationModal({ isOpen, onClose, item, onConfirm, loading }: ImportConfirmationModalProps) {
    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="p-6 text-center">

                    {/* Header Image */}
                    <div className="mx-auto w-32 h-48 rounded-lg overflow-hidden shadow-2xl border-2 border-white/10 mb-6 relative group">
                        <img
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                        {/* Status Badge */}
                        {item.is_available && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">{item.title || item.name}</h2>
                    <p className="text-sm text-gray-400 mb-6 line-clamp-2">{item.overview || 'Sem descrição.'}</p>

                    {!item.is_available && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-xs text-red-400 flex items-center gap-2 text-left">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>Este conteúdo não está disponível na API de origem e não poderá ser reproduzido. Importar mesmo assim?</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading || !item.is_available}
                            className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                ${!item.is_available
                                    ? 'bg-red-600/20 text-red-500 cursor-not-allowed border border-red-500/20'
                                    : 'bg-white hover:bg-gray-200 text-black shadow-lg hover:scale-105'
                                }
                            `}
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            {loading ? 'Importando...' : 'Confirmar Importação'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
