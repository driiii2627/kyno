'use client';

import { useState } from 'react';
import { Search, Plus, Check, X, Loader2, Film, Tv, Library, Layers } from 'lucide-react';
import { searchContentAction, importContentAction, importCollectionAction } from '@/app/actions/content';
import { useToast } from '@/components/ui/Toast';

export function ContentManager() {
    const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Import state
    const [importingId, setImportingId] = useState<number | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        const { results: data, error } = await searchContentAction(query);
        setLoading(false);

        if (data) setResults(data);
        else alert(error);
    };

    const handleImport = async (item: any) => {
        if (!confirm(`Importar "${item.title || item.name}" para o site?`)) return;

        setImportingId(item.id);
        const res = await importContentAction(item.id, item.media_type);
        setImportingId(null);

        if (res.success) {
            alert('Sucesso! Conteúdo adicionado.');
            // Update local state to show it's in library
            setResults(prev => prev.map(r => r.id === item.id ? { ...r, is_in_library: true } : r));
        } else {
            alert('Erro: ' + res.error);
        }
    };

    const handleImportCollection = async (collectionId: number) => {
        if (!confirm(`Tentar importar toda a franquia/coleção? Isso pode demorar um pouco.`)) return;

        // Use a toast or loading state here in real app
        const res = await importCollectionAction(collectionId);
        if (res.success) {
            alert(`Franquia processada! Importados: ${res.count}, Pulados: ${res.skipped}`);
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="space-y-6">
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
                                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                                        {/* Status Bubble */}
                                        {item.is_in_library ? (
                                            <div className="bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md">
                                                <Library size={10} /> Na Biblioteca
                                            </div>
                                        ) : item.is_available ? (
                                            <div className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md animate-pulse">
                                                <Check size={10} /> Disponível
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-md" title={item.availability_reason}>
                                                <X size={10} /> Indisponível
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
                                            disabled={!item.is_available || item.is_in_library || importingId === item.id}
                                            onClick={() => handleImport(item)}
                                            className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors
                                                ${item.is_in_library
                                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                    : item.is_available
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {importingId === item.id ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                            {item.is_in_library ? 'Adicionado' : 'Adicionar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'manage' && (
                <div className="text-center p-12 text-gray-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <Library size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Em breve: Lista de filmes e séries cadastrados para edição/remoção rápida.</p>
                </div>
            )}
        </div>
    );
}
