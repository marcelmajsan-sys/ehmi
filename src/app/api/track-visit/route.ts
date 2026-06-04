import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Records a login or page_view event for the current user.
// Insert goes through service_role (bypasses RLS); reads stay admin-only.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { event_type, path } = (await req.json().catch(() => ({}))) as {
    event_type?: string
    path?: string
  }
  const event = event_type === 'page_view' ? 'page_view' : 'login'

  const { data: appUser } = await supabase
    .from('app_users').select('role').eq('user_id', user.id).single()

  try {
    await supabaseAdmin.from('visit_log').insert({
      user_id: user.id,
      email: user.email ?? null,
      role: appUser?.role ?? null,
      event_type: event,
      path: typeof path === 'string' ? path.slice(0, 200) : null,
    })
  } catch {
    /* tracking must never break navigation */
  }

  return NextResponse.json({ ok: true })
}
