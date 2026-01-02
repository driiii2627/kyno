import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#02040a] px-4 pt-28 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="container mx-auto mb-12 flex flex-col items-center gap-6 mt-10">
                <Skeleton className="h-16 w-3/4 md:w-1/2 lg:w-1/3 rounded-2xl bg-zinc-800" />
                <Skeleton className="h-6 w-1/2 max-w-md rounded-lg opacity-60" />
            </div>

            {/* Grid */}
            <div className="container mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5">
                        <Skeleton className="w-full h-full bg-zinc-800" />
                    </div>
                ))}
            </div>
        </div>
    );
}
