import { ShieldCheck, LogOut } from 'lucide-react';

export function AdminHeader({ userEmail }: { userEmail?: string }) {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="text-blue-500" size={24} />
                    <span className="font-bold text-white text-lg tracking-wide">Kyno<span className="text-blue-500">Admin</span></span>
                </div>


            </div>

            <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>
                <form action="/auth/signout" method="post">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-200 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20">
                        <LogOut size={14} />
                        Sair
                    </button>
                </form>
            </div>
        </header>
    );
}
