'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Loader2, Library, Layers, MousePointer2, PlayCircle, StopCircle, Trash2 } from 'lucide-react';
import { searchContentAction, importContentAction, getLibraryContent, getItemDetailsAction } from '@/app/actions/content';
import { ManageContentModal } from './ManageContentModal';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { CollectionImportModal } from './CollectionImportModal';

export function ContentManager() {
    const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Library State
    const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
    const [searchLibraryQuery, setSearchLibraryQuery] = useState('');

    // Import Flow State
    const [inspectingId, setInspectingId] = useState<number | null>(null); // Loading state for "Adicionar" button
    const [confirmItem, setConfirmItem] = useState<any>(null); // Single Import Modal
    const [collectionImport, setCollectionImport] = useState<{ id: number, item: any } | null>(null); // Collection Modal
    const [importLoading, setImportLoading] = useState(false); // Processing state inside confirmation modal

    // Batch Import State (Security & Queue)
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [processingQueue, setProcessingQueue] = useState<boolean>(false);
    const [queueProgress, setQueueProgress] = useState<{ current: number, total: number, failed: number } | null>(null);
    const [processedIds, setProcessedIds] = useState<Set<number>>(new Set()); // To show success checkmarks in batch

    // Manage Modal State (Edit/Delete)
    const [manageItem, setManageItem] = useState<any>(null);

    // Filtered Library Results
    const filteredLibrary = results.filter(item => {
        if (activeTab === 'manage') {
            const matchesType = filterType === 'all' || item.media_type === filterType;
            const matchesSearch = item.title?.toLowerCase().includes(searchLibraryQuery.toLowerCase());
            return matchesType && matchesSearch;
        }
        return true;
    });

    // Reset Selection when changing tabs or searching
    useEffect(() => {
        if (activeTab === 'manage') {
            loadLibrary();
        } else {
            // Keep previous results or clear? Clearing is safer.
            setResults([]);
        }
        setIsSelectionMode(false);
        setSelectedIds([]);
        setQueueProgress(null);
        setProcessedIds(new Set());
    }, [activeTab]);

    const loadLibrary = async () => {
        setLoading(true);
        const { data, error } = await getLibraryContent();
        setLoading(false);
        if (data) setResults(data);
        else console.error(error);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setIsSelectionMode(false); // Exit selection mode on new search
        setSelectedIds([]);
        const { results: data, error } = await searchContentAction(query);
        setLoading(false);

        if (data) setResults(data);
        else alert(error);
    };

    const toggleSelection = (id: number) => {
        if (!isSelectionMode) return;

        // Prevent selecting already added items
        const item = results.find(r => r.id === id);
        if (item?.is_in_library) return;

        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // --- Single Import Flow ---
    const handleImportClick = async (item: any) => {
        // If in selection mode, just toggle selection
        if (isSelectionMode) {
            toggleSelection(item.id);
            return;
        }

        setInspectingId(item.id);
        const { data: details, error } = await getItemDetailsAction(item.id, item.media_type);
        setInspectingId(null);

        if (error || !details) {
            alert('Erro ao obter detalhes: ' + error);
            return;
        }

        if (item.media_type === 'movie' && details.belongs_to_collection) {
            setCollectionImport({
                id: details.belongs_to_collection.id,
                item: { ...item, ...details }
            });
        } else {
            setConfirmItem(item);
        }
    };

    const executeSingleImport = async () => {
        if (!confirmItem) return;
        setImportLoading(true);
        const res = await importContentAction(confirmItem.id, confirmItem.media_type);
        setImportLoading(false);

        if (res.success) {
            setConfirmItem(null);
            setResults(prev => prev.map(r => r.id === confirmItem.id ? { ...r, is_in_library: true } : r));
            if (activeTab === 'manage') loadLibrary();
        } else {
            alert('Erro ao importar: ' + res.error);
        }
    };

    const handleCollectionSuccess = () => {
        if (collectionImport) {
            setResults(prev => prev.map(r => r.id === collectionImport.item.id ? { ...r, is_in_library: true } : r));
        }
        setCollectionImport(null);
        if (activeTab === 'manage') loadLibrary();
    };

    // --- Batch Import Logic (Queue) ---
    const handleBatchImport = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Iniciar importação de ${selectedIds.length} itens?`)) return;

        setProcessingQueue(true);
        setQueueProgress({ current: 0, total: selectedIds.length, failed: 0 });

        // Process one by one (Sequential Queue)
        for (let i = 0; i < selectedIds.length; i++) {
            const id = selectedIds[i];
            const item = results.find(r => r.id === id);
            if (!item) continue;

            // Security Delay (1s) to prevent spamming
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const res = await importContentAction(item.id, item.media_type);
                if (res.success) {
                    setProcessedIds(prev => new Set(prev).add(id));
                    setResults(prev => prev.map(r => r.id === id ? { ...r, is_in_library: true } : r));
                } else {
                    console.error(`Failed to import ${id}`, res.error);
                    setQueueProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
                }
            } catch (e) {
                console.error(e);
            }

            setQueueProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        }

        setProcessingQueue(false);
        // Cleanup after delay
        setTimeout(() => {
            setIsSelectionMode(false);
            setSelectedIds([]);
            setQueueProgress(null);
            setProcessedIds(new Set());
        }, 2000);
    };

    return (
        <div className="space-y-6 relative min-h-[500px]">

            {/* Modals */}
            <ManageContentModal
                isOpen={!!manageItem}
                onClose={() => setManageItem(null)}
                item={manageItem}
                onSuccess={() => loadLibrary()}
            />

            <ImportConfirmationModal
                isOpen={!!confirmItem}
                onClose={() => setConfirmItem(null)}
                item={confirmItem}
                onConfirm={executeSingleImport}
                loading={importLoading}
            />

            <CollectionImportModal
                isOpen={!!collectionImport}
                onClose={() => setCollectionImport(null)}
                collectionId={collectionImport?.id || 0}
                initialItem={collectionImport?.item}
                onSuccess={handleCollectionSuccess}
            />

            {/* Sub-Tabs & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 border-b border-white/10 pb-4 justify-between items-start sm:items-center">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'add' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Plus size={16} /> Adicionar Novo
                    </button>
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Library size={16} /> Gerenciar Biblioteca
                    </button>
                </div>

                {/* Batch Selection Toggle */}
                {activeTab === 'add' && results.length > 0 && (
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedIds([]);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors border ${isSelectionMode ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <MousePointer2 size={14} />
                        {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar Vários'}
                    </button>
                )}
            </div>

            {activeTab === 'add' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-8 relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pesquise por filmes, séries ou franquias..."
                            className="w-full bg-black/40 border border-white/10 rounded-full pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg shadow-xl"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
                        </button>
                    </form>

                    {/* Results Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {results.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            const isProcessed = processedIds.has(item.id);
                            const isSelectable = isSelectionMode && !item.is_in_library && item.is_available;

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => isSelectable && toggleSelection(item.id)}
                                    className={`group relative bg-[#111] border rounded-xl overflow-hidden transition-all shadow-2xl
                                    ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[0.98]' : 'border-white/5 hover:border-white/20 hover:-translate-y-1'}
                                    ${isSelectable ? 'cursor-pointer' : ''}
                                `}
                                >
                                    {/* Poster */}
                                    <div className="aspect-[2/3] relative">
                                        <img
                                            src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/500x750?text=No+Image'}
                                            alt={item.title || item.name}
                                            className={`w-full h-full object-cover transition-opacity ${isSelected || item.is_in_library ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
                                        />

                                        {/* Selection Overlay */}
                                        {isSelectable && (
                                            <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-900/40' : 'bg-transparent hover:bg-white/5'}`}>
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-white/50 bg-black/40'}`}>
                                                    {isSelected && <Check size={18} className="text-white" />}
                                                </div>
                                            </div>
                                        )}

                                        {/* Success/In Library Checkmark Overlay (Always visible if added) */}
                                        {item.is_in_library && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                                        <Check size={24} className="text-white" />
                                                    </div>
                                                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-full">Na Biblioteca</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 flex flex-col gap-2">
                                            {/* Availability Status */}
                                            {item.is_available ? (
                                                !item.is_in_library && <div className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md animate-pulse">
                                                    <Check size={10} />
                                                </div>
                                            ) : (
                                                <div className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                                    <X size={10} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <div className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase">
                                                {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="text-white font-bold text-sm truncate mb-1" title={item.title || item.name}>
                                            {item.title || item.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4">
                                            {item.release_year || (item.release_date || item.first_air_date || '').split('-')[0]}
                                        </p>

                                        {/* Actions (Hidden in Selection Mode) */}
                                        {!isSelectionMode && (
                                            <div className="space-y-2">
                                                <button
                                                    disabled={!item.is_available || item.is_in_library || inspectingId === item.id}
                                                    onClick={(e) => { e.stopPropagation(); handleImportClick(item); }}
                                                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors
                                                    ${item.is_in_library
                                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                            : item.is_available
                                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                                                                : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                        }
                                                `}
                                                >
                                                    {inspectingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                                    {item.is_in_library ? 'Na Biblioteca' : 'Adicionar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Batch Selection Floating Bar */}
            {isSelectionMode && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-6 duration-300 w-[90%] max-w-lg">
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{selectedIds.length} Itens Selecionados</span>
                        <span className="text-xs text-gray-500">Prontos para importação segura</span>
                    </div>

                    <div className="flex-1" />

                    {processingQueue ? (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-blue-400 font-bold text-xs animate-pulse">Processando fila...</span>
                                <span className="text-white text-xs">{queueProgress?.current} / {queueProgress?.total}</span>
                            </div>
                            <Loader2 className="animate-spin text-blue-500" size={24} />
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                                title="Cancelar"
                            >
                                <X size={20} />
                            </button>
                            <button
                                onClick={handleBatchImport}
                                disabled={selectedIds.length === 0}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <PlayCircle size={18} /> Importar Itens
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'manage' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Filters & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        {/* Bubble Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-full border border-white/10">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterType('movie')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === 'movie' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Filmes
                            </button>
                            <button
                                onClick={() => setFilterType('tv')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filterType === 'tv' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Séries
                            </button>
                        </div>

                        {/* Library Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                type="text"
                                value={searchLibraryQuery}
                                onChange={(e) => setSearchLibraryQuery(e.target.value)}
                                placeholder="Filtrar biblioteca..."
                                className="w-full bg-black/40 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Library Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : results.length === 0 ? (
                        <div className="text-center p-12 text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                            <Library size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Sua biblioteca está vazia. Adicione filmes e séries na aba "Adicionar Novo".</p>
                        </div>
                    ) : filteredLibrary.length === 0 ? (
                        <div className="text-center p-12 text-gray-500">
                            <p>Nenhum resultado encontrado para o filtro.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredLibrary.map((item) => (
                                <div key={item.id} className="group relative bg-[#111] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1 shadow-2xl">
                                    {/* Poster */}
                                    <div className="aspect-[2/3] relative">
                                        <img
                                            src={item.poster_url ? `https://image.tmdb.org/t/p/w500${item.poster_url}` : 'https://placehold.co/500x750?text=No+Image'}
                                            alt={item.title}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <div className="absolute top-2 left-2">
                                            <div className="bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase">
                                                {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="text-white font-bold text-sm truncate mb-1" title={item.title}>
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4">
                                            {item.release_year || 'Ano desconhecido'}
                                        </p>

                                        {/* Actions */}
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => setManageItem(item)}
                                                className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors bg-white/10 hover:bg-white/20 text-white"
                                                title="Gerenciar Conteúdo"
                                            >
                                                <Layers size={14} /> Gerenciar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
