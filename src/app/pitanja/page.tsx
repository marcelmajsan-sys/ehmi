import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { QuestionsContent } from '@/components/QuestionsContent'

type Question    = { key: string; ordinal: number; label: string; type: string }
type Agg         = { question_key: string; option_value: string; count: number; respondent_count: number | null }
type OtherAnswer = { question_key: string; answer_value: string; count: number }

// Reconstructs free-text "Ostalo / Nešto drugo" answers from response_options.
// A free-text value = held only by respondents who picked the "other" marker for
// that question, and never by a respondent without the marker (so real predefined
// options like "Magento" are excluded). Run via service role to bypass RLS + the
// PostgREST 1000-row cap; result is safe to show to partners.
const OTHER_ANSWERS_SQL = `
with markers as (
  select q.key as question_key, m.value as marker
  from questions q,
       lateral jsonb_array_elements_text(q.options) as m(value)
  where m.value ~* 'ostalo|nešto drugo'
),
marked_resp as (
  select distinct ro.respondent_id, ro.question_key
  from response_options ro
  join markers mk on mk.question_key = ro.question_key and ro.option_value = mk.marker
),
candidates as (
  select ro.question_key, ro.option_value, ro.respondent_id
  from response_options ro
  join marked_resp mr
    on mr.respondent_id = ro.respondent_id and mr.question_key = ro.question_key
  where not exists (
    select 1 from markers mk2
    where mk2.question_key = ro.question_key and mk2.marker = ro.option_value
  )
),
clean as (
  select c.question_key, c.option_value, c.respondent_id
  from candidates c
  where not exists (
    select 1 from response_options r2
    where r2.question_key = c.question_key
      and r2.option_value = c.option_value
      and not exists (
        select 1 from marked_resp mr2
        where mr2.respondent_id = r2.respondent_id
          and mr2.question_key = r2.question_key
      )
  )
)
select question_key,
       option_value as answer_value,
       count(distinct respondent_id)::int as count
from clean
group by question_key, option_value
order by question_key, count desc, answer_value
`.trim()

export default async function PitanjaPage() {
  const supabase = await createClient()

  const [{ data: questions }, { data: aggs }, { data: otherRaw }] = await Promise.all([
    supabase.from('questions').select('key,ordinal,label,type').order('ordinal'),
    supabase.from('question_aggregates').select('question_key,option_value,count,respondent_count'),
    supabaseAdmin.rpc('execute_analyst_query', { query_text: OTHER_ANSWERS_SQL }),
  ])

  const otherAnswers = Array.isArray(otherRaw) ? (otherRaw as OtherAnswer[]) : []

  return (
    <QuestionsContent
      questions={questions ?? []}
      aggs={aggs ?? []}
      otherAnswers={otherAnswers}
    />
  )
}
