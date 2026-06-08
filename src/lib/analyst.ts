import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'

export const BLACKLIST_ALWAYS = /\b(insert|update|delete|drop|alter|create|grant|truncate|copy|respondent_pii)\b/i
export const BLACKLIST_PARTNER = /\b(responses|response_options)\b/i

export type Role = 'admin' | 'partner'
export type AnalystResult = { sql: string; rows: Record<string, unknown>[]; analysis: string }

// Thrown for expected failures (bad SQL, blacklist, db error) so the caller can
// map them to an HTTP status + audit-log entry. `sql` is attached when known.
export class AnalystError extends Error {
  status: number
  sql?: string
  constructor(message: string, status: number, sql?: string) {
    super(message)
    this.name = 'AnalystError'
    this.status = status
    this.sql = sql
  }
}

export function stripCodeFence(s: string): string {
  return s.replace(/^```(?:sql)?\n?/i, '').replace(/\n?```$/i, '').trim().replace(/;+$/, '')
}

export function buildSystemPrompt(role: Role, schemaLines: string): string {
  if (role === 'partner') {
    return `You are a PostgreSQL analyst for a Croatian eCommerce survey (173 respondents).

You only have access to the pre-aggregated table:
• question_aggregates — columns: question_key (text), option_value (text), count (integer)

Survey questions (use question_key to filter):
${schemaLines}

Rules:
1. Return ONLY a single valid SQL SELECT. No explanation, no markdown.
2. Query ONLY the question_aggregates table.
3. Always end with LIMIT 50.`
  }

  return `You are a PostgreSQL analyst for a Croatian eCommerce survey (173 respondents).

Tables:
• responses — one row per respondent. Single-select columns: q01_..., q02_..., q06_..., q12_..., q21_..., q23_..., q24_..., q26_..., q27_..., q28_..., q29_..., q30_..., q31_...
• response_options — multi-select: respondent_id (uuid), question_key (text), option_value (text)
• question_aggregates — pre-counted: question_key, option_value, count (use for aggregate-only queries)

Survey questions:
${schemaLines}

IMPORTANT — ordinal "bucket" columns are stored as TEXT ranges, not numbers.
To compute an average/numeric aggregate over them, map each bucket to a numeric
midpoint with CASE and ignore "Ne znam/nisam siguran" (treat as NULL):

• q29 (godišnji promet, €):
  'do 40.000 eura'→20000, '40.000 - 100.000 eura'→70000,
  '100.000 - 200.000 eura'→150000, '200.000 - 500.000 eura'→350000,
  '500.000 - 1.000.000 eura'→750000, 'Više od 1.000.000 eura'→1500000
• q21 (mjesečni posjeti):
  'Do 10.000'→5000, '10.000 - 20.000'→15000, '20.000 - 50.000'→35000,
  '50.000 - 100.000'→75000, 'Više od 100.000'→150000
• q27 (prosječna košarica, €):
  'Do 50 €'→25, '50 do 100 €'→75, '100 do 200€'→150,
  '200 do 500€'→350, '500 do 1000€'→750, 'Više od 1000€'→1500

IMPORTANT — free-text "other" answers:
Multi-select questions let respondents type a custom answer under the
"Nešto drugo"/"Ostalo" marker. Those raw answers are NOT in the options list
above — they are stored verbatim as extra rows in response_options.option_value
for that question_key. So a brand/keyword the user asks about (e.g. a courier,
tool or platform) may only exist as free text. When the user names something
that is not a listed option, search response_options.option_value with a
case-insensitive ILIKE '%keyword%' instead of an exact match, and remember
spelling/spacing varies (e.g. "InTime", "IN Time", "in time"); match on the
core letters and use OR-ed ILIKE patterns when needed.

Rules:
1. Return ONLY a single valid SQL SELECT. No explanation, no markdown.
2. Never reference respondent_pii.
3. Always end with LIMIT 50.
4. Join responses ↔ response_options on respondent_id.
5. When the question asks "per X" / "po X" (e.g. po platformi, po prometu),
   GROUP BY that dimension — never return a single global number.
6. For multi-select dimensions (in response_options) exclude the free-text
   marker option ("Nešto drugo"/"Ostalo") from grouping.
7. To count distinct respondents matching a free-text brand, use
   COUNT(DISTINCT respondent_id) over response_options filtered by ILIKE.

Example — "Koji je prosječni godišnji promet po platformi?":
SELECT ro.option_value AS platforma,
       ROUND(AVG(CASE r.q29_godisnji_bruto_promet_vaseg_webshopa_izn
         WHEN 'do 40.000 eura' THEN 20000
         WHEN '40.000 - 100.000 eura' THEN 70000
         WHEN '100.000 - 200.000 eura' THEN 150000
         WHEN '200.000 - 500.000 eura' THEN 350000
         WHEN '500.000 - 1.000.000 eura' THEN 750000
         WHEN 'Više od 1.000.000 eura' THEN 1500000 END)) AS prosjecni_promet_eur,
       COUNT(*) AS n
FROM responses r
JOIN response_options ro ON ro.respondent_id = r.respondent_id
 AND ro.question_key = 'q04_na_kojoj_platformi_se_nalazi_vas_webshop'
WHERE ro.option_value <> 'Nešto drugo'
GROUP BY ro.option_value
ORDER BY prosjecni_promet_eur DESC NULLS LAST
LIMIT 50;`
}

// Runs the full text-to-SQL pipeline: load schema → Claude writes SQL → validate
// → execute via the read-only RPC → Claude writes a short analysis.
// `admin` must be a service-role client (bypasses RLS + PostgREST row cap).
export async function runAnalystQuery(opts: {
  question: string
  role: Role
  admin: SupabaseClient
  anthropic: Anthropic
}): Promise<AnalystResult> {
  const { question, role, admin, anthropic } = opts

  const { data: questions } = await admin
    .from('questions').select('key,label,type,options').order('ordinal')

  const schemaLines = (questions ?? []).map(q => {
    const opts = Array.isArray(q.options) && q.options.length
      ? `. Options: ${(q.options as string[]).slice(0, 12).join(', ')}${q.options.length > 12 ? '…' : ''}`
      : ''
    const loc = role === 'admin'
      ? (q.type === 'single'
          ? `column "${q.key}" in responses`
          : `response_options rows where question_key='${q.key}'`)
      : `question_key='${q.key}' in question_aggregates`
    return `- ${q.key} (${q.type}): "${q.label}" → ${loc}${opts}`
  }).join('\n')

  // Step 1: Generate SQL
  const sqlMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: buildSystemPrompt(role, schemaLines),
    messages: [{ role: 'user', content: question }],
  })

  const sql = stripCodeFence((sqlMsg.content[0] as { text: string }).text)

  // Validate
  if (!sql.toLowerCase().trimStart().startsWith('select')) {
    throw new AnalystError('AI did not generate a SELECT query', 422, sql)
  }
  if (BLACKLIST_ALWAYS.test(sql)) {
    throw new AnalystError('Query contains disallowed operations', 422, sql)
  }
  if (role === 'partner' && BLACKLIST_PARTNER.test(sql)) {
    throw new AnalystError('Partners can only query aggregated data', 422, sql)
  }

  // Execute
  const { data: rows, error: dbError } = await admin
    .rpc('execute_analyst_query', { query_text: sql })
  if (dbError) throw new AnalystError(dbError.message, 500, sql)

  // Step 2: Format response
  const formatMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Question: "${question}"\n\nResults:\n${JSON.stringify(rows, null, 2)}\n\nWrite a concise 2-4 sentence analysis with the key numbers. Reply in the same language as the question.`,
    }],
  })

  const analysis = (formatMsg.content[0] as { text: string }).text
  return { sql, rows: (rows ?? []) as Record<string, unknown>[], analysis }
}
