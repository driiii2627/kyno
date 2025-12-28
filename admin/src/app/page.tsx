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

        {(profileError || logsError) && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl mb-6 text-red-200">
            <h3 className="font-bold mb-2 flex items-center gap-2">⚠️ Erro de Depuração (Debug)</h3>
            {profileError && (
              <div className="mb-2">
                <strong>Profiles Error:</strong> {JSON.stringify(profileError)}
              </div>
            )}
            {logsError && (
              <div>
                <strong>Logs Error:</strong> {JSON.stringify(logsError)}
              </div>
            )}
            <p className="mt-2 text-xs text-red-300">
              *Isso geralmente indica falta de permissões ou Variáveis de Ambiente incorretas na Vercel (SUPABASE_SERVICE_ROLE_KEY).
            </p>
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
