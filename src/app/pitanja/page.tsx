import { createClient } from '@/lib/supabase/server'
import { QuestionsContent } from '@/components/QuestionsContent'

type Question = { key: string; ordinal: number; label: string; type: string }
type Agg      = { question_key: string; option_value: string; count: number }

export default async function PitanjaPage() {
  const supabase = await createClient()

  const [{ data: questions }, { data: aggs }] = await Promise.all([
    supabase.from('questions').select('key,ordinal,label,type').order('ordinal'),
    supabase.from('question_aggregates').select('question_key,option_value,count'),
  ])

  return <QuestionsContent questions={questions ?? []} aggs={aggs ?? []} />
}
