import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsersClient } from '@/components/users/users-client'
import type { Profile } from '@/types'

export default async function UsersPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    .returns<Pick<Profile, 'role'>>()

  if (currentProfile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Profile[]>()

  return <UsersClient users={users ?? []} currentUserId={user.id} />
}
