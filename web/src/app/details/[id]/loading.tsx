import Skeleton from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="relative w-full min-h-screen bg-[#02040a] text-white overflow-x-hidden">
            {/* Fake Hero Background */}
            <div className="absolute top-0 left-0 w-full h-[85vh] z-0">
                <Skeleton className="w-full h-full bg-slate-900/50" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#02040a] via-[#02040a]/60 to-transparent w-full md:w-2/3" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-[35vh] md:pt-[30vh] lg:pt-[25vh]">
                {/* Back Button Placeholder */}
                <div className="mb-8">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
                </div>

                <div className="flex flex-col gap-8 max-w-4xl">
                    {/* Logo / Title Area */}
                    <Skeleton className="h-32 w-3/4 max-w-md rounded-lg mb-4 bg-white/5" />

                    {/* Metadata Row */}
                    <div className="flex gap-4 items-center">
                        <Skeleton className="h-6 w-12 bg-white/10" />
                        <Skeleton className="h-6 w-16 bg-white/10" />
                        <Skeleton className="h-6 w-24 bg-white/10" />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-full max-w-2xl bg-white/10" />
                        <Skeleton className="h-4 w-11/12 max-w-2xl bg-white/10" />
                        <Skeleton className="h-4 w-4/5 max-w-2xl bg-white/10" />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mt-6">
                        <Skeleton className="h-14 w-48 rounded-2xl bg-white/20" />
                        <Skeleton className="h-14 w-14 rounded-2xl bg-white/10" />
                        <Skeleton className="h-14 w-14 rounded-2xl bg-white/10" />
                    </div>
                </div>

                {/* Tabs / Content Area */}
                <div className="mt-20">
                    <div className="flex gap-8 mb-8">
                        <Skeleton className="h-8 w-32 bg-white/10" />
                        <Skeleton className="h-8 w-32 bg-white/10" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-800/50" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
