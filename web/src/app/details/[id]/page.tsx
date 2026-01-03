import { Suspense } from 'react';
import MovieDetailsContent from '@/components/details/MovieDetailsContent';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: uuid } = await params;

    return (
        <div className="min-h-screen bg-[#02040a]">
            <Suspense
                fallback={
                    <div className="flex h-screen w-full items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                }
            >
                <MovieDetailsContent uuid={uuid} />
            </Suspense>
        </div>
    );
}
