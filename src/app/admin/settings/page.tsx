import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SettingsContent } from '@/components/settings/SettingsContent'

export type AppUser = {
  user_id: string
  email: string
  role: 'admin' | 'partner'
  created_at: string
}

async function addUser(formData: FormData) {
  'use server'
  const current = await getCurrentUser()
  if (!current || current.role !== 'admin') return { error: 'Forbidden' }

  const email    = (formData.get('email') as string).trim().toLowerCase()
  const password = (formData.get('password') as string)
  const role     = formData.get('role') as 'admin' | 'partner'

  if (!email || !password || !role) return { error: 'All fields required' }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return { error: error.message }

  await supabaseAdmin.from('app_users').upsert({
    user_id: data.user.id,
    email,
    role,
    created_by: current.user.id,
  })

  revalidatePath('/admin/settings')
}

async function deleteUser(userId: string) {
  'use server'
  const current = await getCurrentUser()
  if (!current || current.role !== 'admin') return { error: 'forbidden' }
  // Guard against an admin locking themselves out.
  if (userId === current.user.id) return { error: 'self' }

  // Deleting the auth user cascades to app_users (FK on delete cascade).
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
}

export default async function SettingsPage() {
  const current = await getCurrentUser()

  const { data: users } = await supabaseAdmin
    .from('app_users')
    .select('user_id, email, role, created_at')
    .order('created_at', { ascending: true })

  return (
    <SettingsContent
      users={(users ?? []) as AppUser[]}
      currentUserId={current?.user.id ?? ''}
      addUser={addUser}
      deleteUser={deleteUser}
    />
  )
}
