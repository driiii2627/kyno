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
  // Pagination? For now, list first 50.
  const { data: { users }, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 50
  })

  // Fetch profiles for these users to show names if available
  // Assuming 'profiles' table has 'id' matching 'auth.users.id'
  const userIds = users?.map(u => u.id) || []
  let profiles: any[] = []

  if (userIds.length > 0) {
    const { data } = await admin
      .from('profiles')
      .select('*')
      .in('id', userIds)

    profiles = data || []
  }

  // Merge data
  const mergedUsers = users?.map(u => {
    const profile = profiles.find(p => p.id === u.id)
    return {
      ...u,
      profile // Access via .profile
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
