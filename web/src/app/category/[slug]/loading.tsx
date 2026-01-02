import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#02040a] px-4 pt-24 pb-12">
            {/* Header */}
            <div className="container mx-auto mb-12 flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-6 w-96 max-w-full rounded-lg opacity-60" />
            </div>

            {/* Grid */}
            <div className="container mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden">
                        <Skeleton className="w-full h-full bg-slate-800/50" />
                    </div>
                ))}
            </div>
        </div>
    );
}
