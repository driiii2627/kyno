import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'kaicolivsantos@gmail.com') {
    redirect('/login')
  }

  const admin = await createAdminClient()

  // [DEBUG] Check Environment Keys
  // Common mistake: Putting the Anon Key in the Service Role Key variable.
  const serviceKeyInfo = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKeyInfo = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const isKeyConfigError = !serviceKeyInfo || serviceKeyInfo === anonKeyInfo || !serviceKeyInfo.startsWith('eyJ')

  // Also check if admin client has a user session attached which implies it might be using the cookie session + anon key
  const { data: adminSession } = await admin.auth.getSession()
  // If we have a session AND the key is suspect, it confirms the issue.

  // Fetch columns: ID, Email, Last Sign In, Created At
  // Pagination? For now, list first 1000 to catch everyone.
  const { data: { users }, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  })

  // Fetch profiles for these users to show names if available
  // Fetch profiles
  const userIds = users?.map(u => u.id) || []
  let profiles: any[] = []
  let profileError: any = null

  if (userIds.length > 0) {
    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .in('user_id', userIds)

    if (error) {
      console.error('Error fetching profiles:', error)
      profileError = error
    }
    profiles = data || []
  }

  // [NEW] Fetch Security Logs for IPs
  let securityLogs: any[] = []
  let logsError: any = null

  if (userIds.length > 0) {
    const { data, error } = await admin
      .from('kyno_user_security_logs')
      .select('user_id, last_ip, registration_ip')
      .in('user_id', userIds)

    if (error) {
      console.error('Error fetching logs:', error)
      logsError = error
    }

    securityLogs = data || []
  }

  // Merge data
  const mergedUsers = users?.map(u => {
    const userProfiles = profiles.filter(p => p.user_id === u.id)
    const userLog = securityLogs.find(l => l.user_id === u.id)

    return {
      ...u,
      profiles: userProfiles,
      last_ip: userLog?.last_ip || userLog?.registration_ip || null
    }
  }) || []

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel Admin</h1>
            <p className="text-gray-400">Gerenciamento de Usuários e Conteúdo</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="glass-button px-4 py-2 rounded-lg text-sm text-white hover:bg-red-500/20 hover:text-red-200">
                Sair
              </button>
              {/* Note: Need to implement signout action or just use client supabase.auth.signOut() */}
            </form>
          </div>
        </header>

        {(profileError || logsError || isKeyConfigError) && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6 text-red-200">
            <h3 className="font-bold mb-2 flex items-center gap-2">⚠️ Diagnóstico do Sistema</h3>

            {isKeyConfigError && (
              <div className="mb-4 bg-red-900/40 p-3 rounded border border-red-500/30">
                <strong className="text-red-100 block mb-1">ERRO DE CONFIGURAÇÃO (Variáveis de Ambiente):</strong>
                <p className="text-sm mb-2">
                  O painel está rodando com permissões limitadas de usuário, não como Admin.
                  Isso acontece quando a chave <code>SUPABASE_SERVICE_ROLE_KEY</code> na Vercel está incorreta (igual à Anon Key).
                </p>
                <div className="text-xs font-mono bg-black/50 p-2 rounded mb-2 space-y-1">
                  <p>Service Key Configurada: {serviceKeyInfo ? serviceKeyInfo.substring(0, 10) + '...' : 'NÃO DEFINIDA'}</p>
                  <p>Anon Key Configurada: {anonKeyInfo ? anonKeyInfo.substring(0, 10) + '...' : 'NÃO DEFINIDA'}</p>
                </div>
                <p className="text-xs text-yellow-300">
                  SOLUÇÃO: Vá em Vercel Configuration {'>'} Environment Variables e defina a `SUPABASE_SERVICE_ROLE_KEY` correta (pegue no Supabase Dashboard).
                </p>
              </div>
            )}

            {profileError && (
              <div className="mb-2">
                <strong>Erro ao buscar Perfis:</strong> {JSON.stringify(profileError)}
              </div>
            )}
            {logsError && (
              <div>
                <strong>Erro ao buscar Logs:</strong> {JSON.stringify(logsError)}
              </div>
            )}
          </div>
        )}

        {/* Create Tabs UI in Client Component */}
        <section className="glass-panel rounded-2xl p-6 min-h-[600px]">
          <UsersTable users={mergedUsers} />
        </section>
      </div>
    </main>
  )
}
