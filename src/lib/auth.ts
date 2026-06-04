import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: appUser } = await supabase
    .from('app_users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return { user, role: (appUser?.role ?? 'partner') as 'admin' | 'partner' }
}
