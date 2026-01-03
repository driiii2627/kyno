import { notFound } from 'next/navigation';
import { contentService } from '@/services/content';
import CategoryClient from './CategoryClient';

// Refresh data on every navigation to ensure catalog is up to date
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Shared Helper (Should ideally be a utility, but keeping inline for simplicity as per current pattern)
const filterItems = (items: any[], keywords: string[]) => {
    return items.filter(m => {
        const dbGenre = m.genre?.toLowerCase() || '';
        const tmdbGenres = m.genres?.map((g: any) => g.name.toLowerCase()).join(' ') || '';
        // Normalize for accent-insensitive matching
        const combined = `${dbGenre} ${tmdbGenres}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        return keywords.some(k => {
            const normK = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return combined.includes(normK);
        });
    });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Artificial Delay for Premium Feel
    await new Promise(resolve => setTimeout(resolve, 800));

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
            items = filterItems(allMovies, ['ação', 'action', 'aventura', 'adventure']);
        } else if (slug === 'comedia') {
            title = 'Comédia';
            const allMovies = await contentService.getCatalogMovies();
            // Expanded keywords
            items = filterItems(allMovies, ['comédia', 'comedy', 'stand-up', 'stand up', 'comedia', 'humor', 'engraçado']);
        } else if (slug === 'terror') {
            title = 'Terror e Suspense';
            const allMovies = await contentService.getCatalogMovies();
            items = filterItems(allMovies, ['terror', 'horror', 'suspense', 'thriller', 'medo', 'assustador']).filter(m => {
                const combined = (m.genre || '') + (m.genres?.map((g: any) => g.name).join(' ') || '');
                const isAction = /ação|action|aventura|adventure/i.test(combined);
                const isHorror = /terror|horror/i.test(combined);
                if (isAction && !isHorror) return false;
                return true;
            });
        } else if (slug === 'animacao') {
            title = 'Animação';
            const allMovies = await contentService.getCatalogMovies();
            items = filterItems(allMovies, ['animação', 'animation', 'anime', 'animes', 'desenho', 'cartoon', 'infantil']);
        } else if (slug === 'ficcao') {
            title = 'Ficção Científica';
            const allMovies = await contentService.getCatalogMovies();
            items = filterItems(allMovies, ['ficção', 'fiction', 'sci-fi', 'scifi', 'futuro', 'espaço', 'space']);
        } else {
            return notFound();
        }
    } catch (e) {
        console.error("Failed to fetch category data", e);
        return <div>Erro ao carregar catálogo.</div>;
    }

    return <CategoryClient title={title} items={items} />;
}
