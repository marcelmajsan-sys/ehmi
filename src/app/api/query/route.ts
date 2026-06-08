import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { runAnalystQuery, AnalystError, type Role } from '@/lib/analyst'

type QueryLogRow = {
  user_id: string
  email: string | null
  role: string
  question: string
  sql?: string | null
  row_count?: number | null
  success: boolean
  error?: string | null
}

// Best-effort audit log of every Explore query. Never blocks the response.
async function logQuery(row: QueryLogRow) {
  try {
    await supabaseAdmin.from('query_log').insert(row)
  } catch {
    /* logging must not break the query flow */
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: appUser } = await supabase
    .from('app_users').select('role').eq('user_id', user.id).single()
  const role = appUser?.role as Role | undefined
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { question } = await req.json() as { question: string }
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const logBase = { user_id: user.id, email: user.email ?? null, role, question }

  try {
    const result = await runAnalystQuery({ question, role, admin: supabaseAdmin, anthropic })
    await logQuery({ ...logBase, sql: result.sql, row_count: result.rows.length, success: true })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof AnalystError) {
      await logQuery({ ...logBase, sql: e.sql ?? null, success: false, error: e.message })
      return NextResponse.json({ error: e.message, sql: e.sql }, { status: e.status })
    }
    throw e
  }
}
