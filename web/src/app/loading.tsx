import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#060606] text-white">
            <div className="relative w-full h-[60vh] md:h-[85vh] bg-zinc-900/50 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-[#060606] via-transparent to-transparent" />
            </div>
            <div className="container mx-auto px-4 -mt-32 relative z-10 space-y-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3 rounded-lg bg-zinc-800" />
                    <Skeleton className="h-4 w-1/4 rounded bg-zinc-800" />
                    <Skeleton className="h-20 w-2/3 rounded-lg bg-zinc-800" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-40 rounded bg-zinc-800" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="w-[160px] h-[240px] rounded-xl flex-shrink-0 bg-zinc-800" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
