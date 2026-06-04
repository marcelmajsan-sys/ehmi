import { createClient } from '@/lib/supabase/server'
import { SurveyBarChart, type ChartItem } from '@/components/charts/SurveyBarChart'
import { SurveyPieChart } from '@/components/charts/SurveyPieChart'

type Question = { key: string; ordinal: number; label: string; type: string }
type Agg      = { question_key: string; option_value: string; count: number }

function buildChartData(aggs: Agg[], key: string): ChartItem[] {
  const items = aggs.filter(a => a.question_key === key)
  const total = items.reduce((s, a) => s + a.count, 0)
  return items
    .map(a => ({ option_value: a.option_value, count: a.count, pct: total > 0 ? Math.round((a.count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
}

export default async function PitanjaPage() {
  const supabase = await createClient()

  const [{ data: questions }, { data: aggs }] = await Promise.all([
    supabase.from('questions').select('key,ordinal,label,type').order('ordinal'),
    supabase.from('question_aggregates').select('question_key,option_value,count'),
  ])

  if (!questions || !aggs) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Greška pri učitavanju podataka.
      </div>
    )
  }

  const dataQuestions = questions.filter(q => q.type !== 'text')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pitanja</h1>
      <p className="text-gray-500 mb-8">Pregled svih pitanja i agregiranih odgovora</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataQuestions.map(q => {
          const data = buildChartData(aggs, q.key)
          if (data.length === 0) return null
          const isPie = data.length <= 4

          return (
            <div key={q.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-1">Q{q.ordinal}</p>
              <h3 className="text-sm font-semibold text-gray-800 mb-4 leading-snug">{q.label}</h3>
              {isPie
                ? <SurveyPieChart data={data} />
                : <SurveyBarChart data={data} />
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}
