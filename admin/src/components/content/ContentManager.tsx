'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Loader2, Library, Layers, MousePointer2, PlayCircle, StopCircle, Trash2, Flame, TrendingUp, Star, Film, Tv, RefreshCw } from 'lucide-react';
import { searchContentAction, importContentAction, getLibraryContent, getItemDetailsAction, getPopularContentAction, syncContentAction, syncGenresAction } from '@/app/actions/content';
import { ManageContentModal } from './ManageContentModal';
import { ImportConfirmationModal } from './ImportConfirmationModal';
import { CollectionImportModal } from './CollectionImportModal';

export function ContentManager() {
    // Modes
    const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
    const [viewMode, setViewMode] = useState<'search' | 'discovery'>('discovery'); // Default to discovery

    // Search State
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Discovery State
    const [popularData, setPopularData] = useState<any>(null);
    const [isLoadingPopular, setIsLoadingPopular] = useState(false);

    // Library State
    const [libraryResults, setLibraryResults] = useState<any[]>([]);
    const [isLibraryLoading, setIsLibraryLoading] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'trailers'>('all');
    const [searchLibraryQuery, setSearchLibraryQuery] = useState('');

    // Import Flow State
    const [inspectingId, setInspectingId] = useState<number | null>(null);
    const [confirmItem, setConfirmItem] = useState<any>(null);
    const [collectionImport, setCollectionImport] = useState<{ id: number, item: any } | null>(null);
    const [importLoading, setImportLoading] = useState(false);

    // Batch Import State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [processingQueue, setProcessingQueue] = useState<boolean>(false);
    const [queueProgress, setQueueProgress] = useState<{ current: number, total: number, failed: number } | null>(null);
    const [processedIds, setProcessedIds] = useState<Set<number>>(new Set());

    // Manage Item
    const [manageItem, setManageItem] = useState<any>(null);

    // Initial Data Fetch
    useEffect(() => {
        if (activeTab === 'manage') loadLibrary();
        if (activeTab === 'add' && viewMode === 'discovery' && !popularData) loadPopularContent();
    }, [activeTab, viewMode]);

    const loadLibrary = async () => {
        setIsLibraryLoading(true);
        const { data, error } = await getLibraryContent();
        setIsLibraryLoading(false);
        if (data) setLibraryResults(data);
    };

    const loadPopularContent = async () => {
        setIsLoadingPopular(true);
        const { data, error } = await getPopularContentAction();
        setIsLoadingPopular(false);
        if (data) setPopularData(data);
        else console.error(error);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setViewMode('search'); // Switch to search view
        setIsSearching(true);
        setIsSelectionMode(false);
        setSelectedIds([]);
        const { results: data, error } = await searchContentAction(query);
        setIsSearching(false);

        if (data) setSearchResults(data);
        else alert(error);
    };

    // --- Interaction Helpers ---

    const toggleSelection = (id: number) => {
        if (!isSelectionMode) return;

        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleImportClick = async (item: any) => {
        if (isSelectionMode) {
            if (item.is_in_library) return;
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
            updateLocalStateAsImported(confirmItem.id);
            if (activeTab === 'manage') loadLibrary();
        } else {
            alert('Erro ao importar: ' + res.error);
        }
    };

    const handleCollectionSuccess = () => {
        if (collectionImport) updateLocalStateAsImported(collectionImport.item.id);
        setCollectionImport(null);
        if (activeTab === 'manage') loadLibrary();
    };

    const handleBatchImport = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Iniciar importação de ${selectedIds.length} itens?`)) return;

        setProcessingQueue(true);
        setQueueProgress({ current: 0, total: selectedIds.length, failed: 0 });

        // Process one by one (Sequential Queue)
        for (let i = 0; i < selectedIds.length; i++) {
            const id = selectedIds[i];

            // Find item object (Search or Popular)
            let item = searchResults.find(r => r.id === id);
            if (!item && popularData) {
                const allPopular = [
                    ...popularData.trendingDay,
                    ...popularData.trendingWeek,
                    ...popularData.popularMovies,
                    ...popularData.popularSeries,
                    ...popularData.topRatedMovies
                ];
                item = allPopular.find(r => r.id === id);
            }

            if (!item) continue;

            // Security Delay (1s)
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const res = await importContentAction(item.id, item.media_type);
                if (res.success) {
                    setProcessedIds(prev => new Set(prev).add(id));
                    updateLocalStateAsImported(id);
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
        // Cleanup
        setTimeout(() => {
            setIsSelectionMode(false);
            setSelectedIds([]);
            setQueueProgress(null);
            setProcessedIds(new Set());
        }, 2000);
    };



    const handleSyncMissingTrailers = async () => {
        // Find items without trailers
        const itemsToSync = libraryResults.filter(item => !item.trailer_url);

        if (itemsToSync.length === 0) {
            alert('Todos os itens já possuem trailer!');
            return;
        }

        if (!confirm(`Encontrados ${itemsToSync.length} itens sem trailer. Deseja sincronizar do TMDB agora? Isso pode levar um tempo.`)) return;

        setProcessingQueue(true);
        setQueueProgress({ current: 0, total: itemsToSync.length, failed: 0 });

        // Process Queue
        for (let i = 0; i < itemsToSync.length; i++) {
            const item = itemsToSync[i];

            // Security Delay (1s)
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                // Use syncContentAction (Updated to fetch trailer)
                const res = await importContentAction(item.tmdb_id, item.media_type);
                // Wait, use import or sync? Sync is safer for existing items, but my sync logic uses ID.
                // importContentAction is specifically for "New or Full Update". logic is robust.
                // But syncContentAction was just updated to fetch trailers too.
                // Let's use `syncContentAction` but we need `tmdb_id`.

                // Oops, I updated `syncContentAction` to take (id, type, tmdbId).
                // Let's import `syncContentAction` properly at the top first if needed, logic is:
                // export async function syncContentAction(id: number, type: 'movie' | 'tv', tmdbId: number)

                const { syncContentAction } = await import('@/app/actions/content'); // Dynamic import to ensure latest version? No, standard import.

                // Re-using sync logic
                const resSync = await syncContentAction(item.id, item.media_type, item.tmdb_id);

                if (resSync.success) {
                    // Update local state locally to reflect "Has Trailer" without full reload?
                    // Ideally reload library after batch.
                } else {
                    setQueueProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
                    console.error(`Failed to sync ${item.title}`, resSync.error);
                }
            } catch (e) {
                console.error(e);
            }

            setQueueProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        }

        setProcessingQueue(false);
        loadLibrary(); // Refresh library to show new trailers status
        alert('Sincronização de trailers concluída!');
        setQueueProgress(null);
    };

    // START NEW FUNCTION
    const handleSyncGenres = async () => {
        // Find items without genres (null or empty string)
        const itemsToSync = libraryResults.filter(item => !item.genre || item.genre.trim() === '');

        if (itemsToSync.length === 0) {
            alert('Todos os itens já possuem gênero cadastrado!');
            return;
        }

        if (!confirm(`Encontrados ${itemsToSync.length} itens sem gênero. Iniciar sincronização sequencial?`)) return;

        setProcessingQueue(true);
        setQueueProgress({ current: 0, total: itemsToSync.length, failed: 0 });

        let successCount = 0;
        let failCount = 0;

        // Process Queue Client-Side
        for (let i = 0; i < itemsToSync.length; i++) {
            const item = itemsToSync[i];

            // Security Delay (500ms to avoid rate limits)
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                // Using syncContentAction which now properly updates genres
                const res = await syncContentAction(item.id, item.media_type, item.tmdb_id);

                if (res.success) {
                    successCount++;
                } else {
                    console.error(`Failed to sync genre for ${item.title}`, res.error);
                    failCount++;
                    setQueueProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
                }
            } catch (e) {
                console.error(e);
                failCount++;
            }

            setQueueProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        }

        setProcessingQueue(false);
        setQueueProgress(null);

        loadLibrary(); // Refresh list to fill in the new genres
        alert(`Sincronização finalizada!\n\n✅ Sucessos: ${successCount}\n❌ Falhas: ${failCount}\n\nSe houve falhas, verifique o console ou as chaves de API.`);
    };
    // END NEW FUNCTION

    const updateLocalStateAsImported = (id: number) => {
        const markAsImported = (item: any) => item.id === id ? { ...item, is_in_library: true } : item;

        setSearchResults(prev => prev.map(markAsImported));
        if (popularData) {
            setPopularData({
                trendingDay: popularData.trendingDay.map(markAsImported),
                trendingWeek: popularData.trendingWeek.map(markAsImported),
                popularMovies: popularData.popularMovies.map(markAsImported),
                popularSeries: popularData.popularSeries.map(markAsImported),
                topRatedMovies: popularData.topRatedMovies.map(markAsImported)
            });
        }
    };

    // --- Styled Components ---

    const CustomScrollbar = () => (
        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
                height: 6px; /* Slimmer */
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                transition: background 0.3s;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `}</style>
    );

    const ContentCard = ({ item }: { item: any }) => {
        const isSelected = selectedIds.includes(item.id);
        const isSelectable = isSelectionMode && !item.is_in_library && item.is_available;

        return (
            <div
                onClick={() => isSelectable && toggleSelection(item.id)}
                className={`group relative bg-[#111] border rounded-xl overflow-hidden transition-all duration-300 shadow-xl w-[150px] md:w-[170px] flex flex-col
                    ${isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 scale-[0.98]'
                        : 'border-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-blue-900/10'
                    }
                    ${isSelectable ? 'cursor-pointer' : ''}
                `}
            >
                {/* Poster - Fixed Aspect Ratio */}
                <div className="aspect-[2/3] relative overflow-hidden bg-gray-900">
                    <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/500x750?text=No+Image'}
                        alt={item.title || item.name}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isSelected || item.is_in_library ? 'opacity-40' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`}
                    />

                    {/* Subtle Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#111] to-transparent opacity-60" />

                    {/* Selection Overlay */}
                    {isSelectable && (
                        <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-900/40' : 'bg-transparent hover:bg-white/5'}`}>
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-white/50 bg-black/40'}`}>
                                {isSelected && <Check size={18} className="text-white" />}
                            </div>
                        </div>
                    )}

                    {/* Status Badge (Available/Unavailable) */}
                    <div className="absolute top-2 right-2 z-10">
                        {item.is_available ? (
                            !item.is_in_library && <div className="bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                <Check size={8} />
                            </div>
                        ) : (
                            <div className="bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                <X size={8} />
                            </div>
                        )}
                    </div>

                    {/* In Library Badge - Centered */}
                    {item.is_in_library && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <Check size={28} className="text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                        </div>
                    )}
                </div>

                {/* Footer Info - Fixed Height */}
                <div className="p-3 bg-[#111] border-t border-white/5 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-white font-bold text-xs mb-1 line-clamp-1" title={item.title || item.name}>
                            {item.title || item.name}
                        </h3>
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2">
                            <span>{item.release_year || (item.release_date || item.first_air_date || '').split('-')[0]}</span>
                            <div className="flex items-center gap-1">
                                <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                <span>{item.vote_average?.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    {!isSelectionMode && (
                        <button
                            disabled={!item.is_available || item.is_in_library || inspectingId === item.id}
                            onClick={(e) => { e.stopPropagation(); handleImportClick(item); }}
                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all
                                ${item.is_in_library
                                    ? 'bg-transparent border border-white/10 text-gray-600 cursor-not-allowed hidden' // Hide button if in library for cleaner look? Or keep disabled. User likes clean.
                                    : item.is_available
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                }
                            `}
                        >
                            {inspectingId === item.id ? <Loader2 className="animate-spin" size={12} /> : <Plus size={12} />}
                            {item.is_in_library ? 'Na Biblioteca' : 'Adicionar'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const HorizontalList = ({ title, icon: Icon, items }: { title: string, icon: any, items: any[] }) => (
        <div className="space-y-3"> {/* Reduced spacing */}
            <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 rounded-lg bg-white/5 text-blue-400">
                    <Icon size={16} />
                </div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
            </div>
            {/* Custom scrollbar applied here */}
            <div className="custom-scrollbar flex gap-4 overflow-x-auto pb-4 px-1 snap-x">
                {items.map(item => (
                    <div key={item.id} className="snap-start flex-shrink-0">
                        <ContentCard item={item} />
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 relative min-h-[500px]">
            <CustomScrollbar />
            {/* Modals */}
            <ManageContentModal isOpen={!!manageItem} onClose={() => setManageItem(null)} item={manageItem} onSuccess={() => loadLibrary()} />
            <ImportConfirmationModal isOpen={!!confirmItem} onClose={() => setConfirmItem(null)} item={confirmItem} onConfirm={executeSingleImport} loading={importLoading} />
            <CollectionImportModal isOpen={!!collectionImport} onClose={() => setCollectionImport(null)} collectionId={collectionImport?.id || 0} initialItem={collectionImport?.item} onSuccess={handleCollectionSuccess} />

            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-xl z-30 pt-4">
                {/* Mode Segmented Control */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'add' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Plus size={16} /> Adicionar
                    </button>
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Library size={16} /> Biblioteca
                    </button>
                </div>

                {/* Discovery Actions */}
                {activeTab === 'add' && (
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                        <button
                            onClick={() => setViewMode('discovery')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border whitespace-nowrap
                                ${viewMode === 'discovery' ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <Flame size={14} /> Em Alta
                        </button>

                        <button
                            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border whitespace-nowrap
                                ${isSelectionMode
                                    ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <MousePointer2 size={14} />
                            {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar Vários'}
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            {activeTab === 'add' ? (
                <div className="animate-in fade-in duration-500 pb-24">
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
                        <button type="submit" disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors">
                            {isSearching ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
                        </button>
                    </form>

                    {/* View: Discovery */}
                    {viewMode === 'discovery' && !query && (
                        <div className="space-y-8"> {/* Reduced global spacing */}
                            {isLoadingPopular ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-purple-500" size={48} />
                                    <p className="text-gray-400 animate-pulse">Carregando tendências...</p>
                                </div>
                            ) : popularData ? (
                                <>
                                    <div className="flex justify-end px-2">
                                        <button onClick={loadPopularContent} className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                                            <RefreshCw size={12} /> Atualizar
                                        </button>
                                    </div>
                                    <HorizontalList title="🔥 Bombando Hoje" icon={Flame} items={popularData.trendingDay} />
                                    <HorizontalList title="⚡ Destaques da Semana" icon={TrendingUp} items={popularData.trendingWeek} />
                                    <HorizontalList title="🎬 Filmes Populares" icon={Film} items={popularData.popularMovies} />
                                    <HorizontalList title="📺 Séries em Alta" icon={Tv} items={popularData.popularSeries} />
                                    <HorizontalList title="⭐ Aclamação da Crítica" icon={Star} items={popularData.topRatedMovies} />
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* View: Search Results */}
                    {viewMode === 'search' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {searchResults.map((item) => <ContentCard key={item.id} item={item} />)}
                        </div>
                    )}
                </div>
            ) : (
                /* Manage Tab */
                <div className="animate-in fade-in duration-500 pb-20">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                        {/* Filter Bubbles */}
                        <div className="flex p-1 bg-white/5 rounded-full border border-white/10">
                            {['all', 'movie', 'tv', 'trailers'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t as any)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${filterType === t ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {t === 'all' ? 'Todos' : t === 'movie' ? 'Filmes' : t === 'tv' ? 'Séries' : 'Com Trailer'}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64 flex gap-2">
                            <input
                                type="text"
                                value={searchLibraryQuery}
                                onChange={(e) => setSearchLibraryQuery(e.target.value)}
                                placeholder="Filtrar biblioteca..."
                                className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/20 transition-all"
                            />
                            {/* Sync Trailers Button (Only visible in 'trailers' or 'all' filter) */}
                            {['trailers', 'all'].includes(filterType) && (
                                <>
                                    <button
                                        onClick={handleSyncMissingTrailers}
                                        title="Sincronizar Trailers Ausentes"
                                        className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                    <button
                                        onClick={handleSyncGenres}
                                        title="Reparar Gêneros (Sync DB)"
                                        className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 hover:text-white hover:bg-blue-600 transition-colors"
                                    >
                                        <Layers size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isLibraryLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {libraryResults
                                .filter(item => {
                                    const matchesSearch = item.title?.toLowerCase().includes(searchLibraryQuery.toLowerCase());
                                    if (!matchesSearch) return false;

                                    if (filterType === 'all') return true;
                                    if (filterType === 'trailers') return item.trailer_url && item.show_trailer;
                                    return item.media_type === filterType;
                                })
                                .map((item) => (
                                    <div key={item.id} className="group relative bg-[#111] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1 shadow-2xl">
                                        <div className="aspect-[2/3] relative">
                                            <img src={item.poster_url ? `https://image.tmdb.org/t/p/w500${item.poster_url}` : 'https://placehold.co/500x750?text=No+Image'} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-white font-bold text-sm truncate mb-1">{item.title}</h3>
                                            <button onClick={() => setManageItem(item)} className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white"><Layers size={14} /> Gerenciar</button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )
            }

            {/* Batch Selection Floating Bar (Common) */}
            {
                isSelectionMode && (
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
                                <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
                                <button onClick={handleBatchImport} disabled={selectedIds.length === 0} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"><PlayCircle size={18} /> Importar Itens</button>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
