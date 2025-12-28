import { notFound } from 'next/navigation';
import { contentService } from '@/services/content';
import CategoryClient from './CategoryClient';

// Refresh data on every navigation to ensure catalog is up to date
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let title = '';
    let items: any[] = [];

    // Determine type and fetch data
    try {
        if (slug === 'filmes' || slug === 'movies') {
            title = 'Todos os Filmes';
            items = await contentService.getCatalogMovies();
        } else if (slug === 'series' || slug === 'tv') {
            title = 'Todas as Séries';
            items = await contentService.getCatalogSeries();
        } else if (slug === 'acao') {
            title = 'Filmes de Ação';
            const allMovies = await contentService.getCatalogMovies();
            items = allMovies.filter(m => {
                const combined = (m.genre?.toLowerCase() || '') + ' ' + (m.genres?.map(g => g.name.toLowerCase()).join(' ') || '');
                return combined.includes('ação') || combined.includes('action');
            });
        } else if (slug === 'comedia') {
            title = 'Comédia';
            const allMovies = await contentService.getCatalogMovies();
            items = allMovies.filter(m => {
                const combined = (m.genre?.toLowerCase() || '') + ' ' + (m.genres?.map(g => g.name.toLowerCase()).join(' ') || '');
                return combined.includes('comédia') || combined.includes('comedy');
            });
        } else if (slug === 'terror') {
            title = 'Terror';
            const allMovies = await contentService.getCatalogMovies();
            items = allMovies.filter(m => {
                const combined = (m.genre?.toLowerCase() || '') + ' ' + (m.genres?.map(g => g.name.toLowerCase()).join(' ') || '');
                return combined.includes('terror') || combined.includes('horror');
            });
        } else {
            return notFound();
        }
    } catch (e) {
        console.error("Failed to fetch category data", e);
        return <div>Erro ao carregar catálogo.</div>;
    }

    return <CategoryClient title={title} items={items} />;
}
