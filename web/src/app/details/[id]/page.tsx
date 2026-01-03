import { Suspense } from 'react';
import MovieDetailsContent from '@/components/details/MovieDetailsContent';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: uuid } = await params;

    return (
        <div className="min-h-screen bg-[#02040a]">
            {/* 
                Removing Suspense to force blocking navigation. 
                The 'useTransition' in DelayedLink will keep the old page visible 
                until this component is fully ready, preventing the black screen.
            */}
            <MovieDetailsContent uuid={uuid} />
        </div>
    );
}
