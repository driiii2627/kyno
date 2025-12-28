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
  // Assuming 'profiles' table has 'id' matching 'auth.users.id'
  // Fetch profiles
  const userIds = users?.map(u => u.id) || []
  let profiles: any[] = []
  if (userIds.length > 0) {
    const { data } = await admin
      .from('profiles')
      .select('*')
      .in('user_id', userIds)
    profiles = data || []
  }

  // [NEW] Fetch Security Logs for IPs
  let securityLogs: any[] = []
  if (userIds.length > 0) {
    // We want the LATEST log for each user to get their last known IP.
    // Since we can't easily doing "distinct on" via simple client syntax sometimes, 
    // we'll just fetch all logs for these users (if dataset is small) or 
    // better: assumes there's one entry per user if it's updated on login, 
    // OR we just fetch the registration/last_ip from the logs table.
    // Looking at `registerAction` it inserts. Looking at `loginAction`... it doesn't seem to update LAST_IP in the provided snippet?
    // Wait, `loginAction` snippet didn't show updating security logs table.
    // `registerAction` inserts: user_id, registration_ip, last_ip.
    // Let's assume there is at least one entry per user from registration.

    const { data } = await admin
      .from('kyno_user_security_logs')
      .select('user_id, last_ip, registration_ip')
      .in('user_id', userIds)
    // If there are multiple, we might get duplicates. 
    // We will just process them client side to find the match.

    securityLogs = data || []
  }

  // Merge data
  const mergedUsers = users?.map(u => {
    const userProfiles = profiles.filter(p => p.user_id === u.id)
    // Find log for this user. If multiple, take the most recent? 
    // The table might just have one row per user or log history. 
    // Assuming we want any IP we can find:
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

        {/* Create Tabs UI in Client Component */}
        <section className="glass-panel rounded-2xl p-6 min-h-[600px]">
          <UsersTable users={mergedUsers} />
        </section>
      </div>
    </main>
  )
}
