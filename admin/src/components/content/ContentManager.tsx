'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Loader2, Library, Layers } from 'lucide-react';
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

    // Fetch library when tab changes
    useEffect(() => {
        if (activeTab === 'manage') {
            loadLibrary();
        } else {
            setResults([]);
        }
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
        const { results: data, error } = await searchContentAction(query);
        setLoading(false);

        if (data) setResults(data);
        else alert(error);
    };

    // Step 1: User clicks "Add" -> Inspect details to check for collection
    const handleImportClick = async (item: any) => {
        setInspectingId(item.id);

        // Fetch full details to check for collection
        const { data: details, error } = await getItemDetailsAction(item.id, item.media_type);
        setInspectingId(null);

        if (error || !details) {
            alert('Erro ao obter detalhes: ' + error);
            return;
        }

        // Check if belongs to collection (and user hasn't forced single import logic yet)
        if (item.media_type === 'movie' && details.belongs_to_collection) {
            setCollectionImport({
                id: details.belongs_to_collection.id,
                item: { ...item, ...details } // Merge info
            });
        } else {
            // Standard Single Import (Series or Movie without collection)
            setConfirmItem(item); // Open confirmation modal
        }
    };

    // Step 2A: Confirm Single Import
    const executeSingleImport = async () => {
        if (!confirmItem) return;

        setImportLoading(true);
        const res = await importContentAction(confirmItem.id, confirmItem.media_type);
        setImportLoading(false);

        if (res.success) {
            setConfirmItem(null);
            // Update UI to show "In Library"
            setResults(prev => prev.map(r => r.id === confirmItem.id ? { ...r, is_in_library: true } : r));

            // If we are in 'manage' mode or just want to refresh library cache
            if (activeTab === 'manage') loadLibrary();
        } else {
            alert('Erro ao importar: ' + res.error);
        }
    };

    // Step 2B: Collection Import Finished
    const handleCollectionSuccess = () => {
        // Refresh whatever view we are in. If in search, we might want to mark the original item as added?
        if (collectionImport) {
            setResults(prev => prev.map(r => r.id === collectionImport.item.id ? { ...r, is_in_library: true } : r));
        }
        setCollectionImport(null);
        if (activeTab === 'manage') loadLibrary();
    };

    return (
        <div className="space-y-6">

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

            {/* Sub-Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
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

            {activeTab === 'add' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        {results.map((item) => (
                            <div key={item.id} className="group relative bg-[#111] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1 shadow-2xl">
                                {/* Poster */}
                                <div className="aspect-[2/3] relative">
                                    <img
                                        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/500x750?text=No+Image'}
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                        {/* Status Bubble */}
                                        {item.is_in_library ? (
                                            <div className="bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                                <Check size={10} />
                                            </div>
                                        ) : item.is_available ? (
                                            <div className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md animate-pulse">
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

                                    {/* Actions */}
                                    <div className="space-y-2">
                                        <button
                                            disabled={!item.is_available || item.is_in_library || inspectingId === item.id}
                                            onClick={() => handleImportClick(item)}
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
                                </div>
                            </div>
                        ))}
                    </div>
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
