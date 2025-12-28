import { login } from '../auth/actions'
import { Lock } from 'lucide-react'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { error } = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <form action={login} className="glass-panel p-8 rounded-2xl w-full max-w-md flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                        <Lock className="text-white" size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Kyno+</h1>
                    <p className="text-gray-400 text-sm">Área Restrita</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold" htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="bg-black/20 border border-white/5 rounded-lg p-3 text-white outline-none focus:border-white/20 transition-all"
                        placeholder="admin@kyno.com"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold" htmlFor="password">Senha</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="bg-black/20 border border-white/5 rounded-lg p-3 text-white outline-none focus:border-white/20 transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    className="bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors mt-2"
                >
                    Entrar
                </button>
            </form>
        </div>
    )
}
