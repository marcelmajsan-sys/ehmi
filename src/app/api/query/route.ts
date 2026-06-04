import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const BLACKLIST = /\b(insert|update|delete|drop|alter|create|grant|truncate|copy|respondent_pii)\b/i

function stripCodeFence(s: string): string {
  return s.replace(/^```(?:sql)?\n?/i, '').replace(/\n?```$/i, '').trim()
}

export async function POST(req: NextRequest) {
  // Auth + admin check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: appUser } = await supabase
    .from('app_users').select('role').eq('user_id', user.id).single()
  if (appUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { question } = await req.json() as { question: string }
  if (!question?.trim()) return NextResponse.json({ error: 'Question required' }, { status: 400 })

  // Load schema
  const { data: questions } = await supabaseAdmin
    .from('questions').select('key,label,type,options').order('ordinal')

  const schemaLines = (questions ?? []).map(q => {
    const opts = Array.isArray(q.options) && q.options.length
      ? `. Options: ${(q.options as string[]).slice(0, 12).join(', ')}${q.options.length > 12 ? '...' : ''}`
      : ''
    const loc = q.type === 'single'
      ? `column "${q.key}" in responses`
      : `response_options rows where question_key='${q.key}'`
    return `- ${q.key} (${q.type}): "${q.label}" → ${loc}${opts}`
  }).join('\n')

  const systemPrompt = `You are a PostgreSQL analyst for a Croatian eCommerce survey (173 respondents).

Tables:
• responses — one row per respondent. Single-select columns: q01_..., q02_..., q06_..., q12_..., q21_..., q23_..., q24_..., q26_..., q27_..., q28_..., q29_..., q30_..., q31_...
• response_options — multi-select: respondent_id (uuid), question_key (text), option_value (text)
• question_aggregates — pre-counted: question_key, option_value, count (use for aggregate-only queries)

Survey questions:
${schemaLines}

Rules:
1. Return ONLY a single valid SQL SELECT. No explanation, no markdown.
2. Never reference respondent_pii.
3. Always end with LIMIT 50 unless user explicitly needs more.
4. Join responses ↔ response_options on respondent_id.
5. For multi-select questions use response_options table.`

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Step 1: Generate SQL
  const sqlMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }],
  })

  const sql = stripCodeFence((sqlMsg.content[0] as { text: string }).text)

  // Validate
  if (!sql.toLowerCase().trimStart().startsWith('select')) {
    return NextResponse.json({ error: 'AI did not generate a SELECT query', sql }, { status: 422 })
  }
  if (BLACKLIST.test(sql)) {
    return NextResponse.json({ error: 'Query contains disallowed operations', sql }, { status: 422 })
  }

  // Execute
  const { data: rows, error: dbError } = await supabaseAdmin
    .rpc('execute_analyst_query', { query_text: sql })

  if (dbError) {
    return NextResponse.json({ error: dbError.message, sql }, { status: 500 })
  }

  // Step 2: Format response in the language of the question
  const formatMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Question: "${question}"\n\nResults:\n${JSON.stringify(rows, null, 2)}\n\nWrite a concise 2-4 sentence analysis with the key numbers. Reply in the same language as the question.`,
    }],
  })

  const analysis = (formatMsg.content[0] as { text: string }).text

  return NextResponse.json({ sql, rows, analysis })
}
