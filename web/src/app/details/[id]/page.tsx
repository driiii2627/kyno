import { Suspense } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { contentService } from '@/services/content';
import { tmdb, getImageUrl } from '@/services/tmdb';
import styles from '@/app/details/[id]/Details.module.css';
import DetailsBackground from '@/components/details/DetailsBackground';
import SmartBackButton from '@/components/ui/SmartBackButton';
import DetailsHeroInfo from '@/components/details/DetailsHero';
import DetailsExtras from '@/components/details/DetailsExtras';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: uuid } = await params;

    // 1. Fetch Basic Identity Fast
    const item = await contentService.getItemByUuid(uuid);

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <h1 className="text-2xl mb-4">Conteúdo não encontrado</h1>
                <Link href="/" className="flex items-center gap-2 text-gray-400">
                    <ArrowLeft size={20} /> Voltar
                </Link>
            </div>
        );
    }

    // 2. Prepare Background (Can be done from 'item' usually, but textless needs fetch)
    // We can do a quick check. If we have backdrop_url in item, use it immediately.
    // If not, we might need a quick TMDB fetch, but ideally we utilize what we have.
    const dbBackdrop = item.backdrop_url
        ? (item.backdrop_url.startsWith('http') ? item.backdrop_url : `https://image.tmdb.org/t/p/original${item.backdrop_url}`)
        : null;

    // We can try to fetch textless poster in parallel or just fallback to null for now for speed.
    // Let's fire a background promise we don't await blocking? Next.js Server Components must await.
    // We will stick to 'dbBackdrop' for instant render if possible.
    // If we want textless poster, we unfortunately have to wait or pass it to a client component to fetch.
    // Let's pass the "Promise" of textless poster to the Client Component? No, too complex.
    // We will just use what we have.

    // Fallback for Textless Poster for Mobile
    let mobilePosterUrl = null;
    if (item.textless_poster_url) {
        mobilePosterUrl = getImageUrl(item.textless_poster_url, 'original');
    }

    return (
        <div className={styles.container}>
            <DetailsBackground backdropUrl={dbBackdrop} mobilePoster={mobilePosterUrl} />

            <SmartBackButton className={styles.backButton} iconSize={18}>
                <ArrowLeft size={18} /> Voltar
            </SmartBackButton>

            <div className={styles.content}>
                {/* Critical Hero Info - Fetches basic details */}
                <DetailsHeroInfo item={item} />

                {/* Heavy Extras - Fetches Seasons, Recs, Credits */}
                <Suspense
                    fallback={
                        <div className="w-full h-96 flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    }
                >
                    <DetailsExtras item={item} />
                </Suspense>
            </div>

            <div style={{ height: '100px' }} />
        </div>
    );
}
