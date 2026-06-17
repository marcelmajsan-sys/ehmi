import { supabaseAdmin } from '@/lib/supabase/admin'

// Number of respondents who answered each question — the correct denominator for
// percentages. For multi-select questions this is far smaller than the sum of
// option counts (one respondent picks several options), so without it multi-select
// percentages read much too low. For single-select it equals the sum of counts, so
// those percentages are unchanged.
//
// Computed via the read-only analyst RPC (service role bypasses RLS on
// response_options); result is aggregate-only and safe to surface to partners.
// Same pattern as the "Ostalo" reconstruction on the /pitanja page.
const BASE_SQL = `
select q.key as question_key,
       case
         when q.type = 'multi' then (
           select count(distinct ro.respondent_id)::int
           from response_options ro
           where ro.question_key = q.key
         )
         else (
           select coalesce(sum(qa.count), 0)::int
           from question_aggregates qa
           where qa.question_key = q.key
         )
       end as respondent_count
from questions q
`.trim()

export async function fetchRespondentBase(): Promise<Record<string, number>> {
  const { data } = await supabaseAdmin.rpc('execute_analyst_query', { query_text: BASE_SQL })
  const rows = Array.isArray(data)
    ? (data as { question_key: string; respondent_count: number }[])
    : []
  const base: Record<string, number> = {}
  for (const r of rows) base[r.question_key] = r.respondent_count
  return base
}
