import { supabaseAdmin } from '@/lib/supabase/admin'
import { ActivityContent } from '@/components/activity/ActivityContent'

export type QueryLog = {
  id: number
  user_id: string | null
  email: string | null
  role: string | null
  question: string
  sql: string | null
  row_count: number | null
  success: boolean
  error: string | null
  created_at: string
}

export type VisitLog = {
  id: number
  user_id: string | null
  email: string | null
  role: string | null
  event_type: 'login' | 'page_view'
  path: string | null
  created_at: string
}

export type AppUserRow = {
  user_id: string
  email: string
  role: 'admin' | 'partner'
  created_at: string
}

export default async function ActivityPage() {
  const [
    { data: queries },
    { data: visits },
    { data: users },
  ] = await Promise.all([
    supabaseAdmin.from('query_log').select('*').order('created_at', { ascending: false }).limit(2000),
    supabaseAdmin.from('visit_log').select('*').order('created_at', { ascending: false }).limit(5000),
    supabaseAdmin.from('app_users').select('user_id, email, role, created_at').order('created_at'),
  ])

  return (
    <ActivityContent
      queries={(queries ?? []) as QueryLog[]}
      visits={(visits ?? []) as VisitLog[]}
      users={(users ?? []) as AppUserRow[]}
    />
  )
}
