'use client'

import { useLang } from '@/lib/lang-context'
import { SurveyBarChart, type ChartItem } from '@/components/charts/SurveyBarChart'
import { SurveyPieChart } from '@/components/charts/SurveyPieChart'
import { translateOption, translateLabel } from '@/translations/survey-data'

type Question = { key: string; ordinal: number; label: string; type: string }
type Agg = { question_key: string; option_value: string; count: number }
type OtherAnswer = { question_key: string; answer_value: string; count: number }

// Free-text "Ostalo" write-ins are excluded from the bars (they belong only in
// the "Ostalo" breakdown), but stay in `total` so predefined-option percentages
// are unchanged.
function buildChartData(aggs: Agg[], key: string, exclude: Set<string>): ChartItem[] {
  const items = aggs.filter(a => a.question_key === key)
  const total = items.reduce((s, a) => s + a.count, 0)
  return items
    .filter(a => !exclude.has(a.option_value))
    .map(a => ({ option_value: a.option_value, count: a.count, pct: total > 0 ? Math.round((a.count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
}

type Props = { questions: Question[]; aggs: Agg[]; otherAnswers?: OtherAnswer[] }

export function QuestionsContent({ questions, aggs, otherAnswers = [] }: Props) {
  const { t, lang } = useLang()
  const isEn = lang === 'en'
  const dataQuestions = questions.filter(q => q.type !== 'text')

  const otherByKey = new Map<string, OtherAnswer[]>()
  for (const o of otherAnswers) {
    const arr = otherByKey.get(o.question_key) ?? []
    arr.push(o)
    otherByKey.set(o.question_key, arr)
  }

  if (!questions.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        {t.questions.error}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.questions.title}</h1>
      <p className="text-gray-500 mb-8">{t.questions.subtitle}</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {dataQuestions.map(q => {
          const others = otherByKey.get(q.key) ?? []
          const otherValues = new Set(others.map(o => o.answer_value))
          const rawData = buildChartData(aggs, q.key, otherValues)
          if (rawData.length === 0) return null
          const data = lang === 'en'
            ? rawData.map(i => ({ ...i, option_value: translateOption(i.option_value) }))
            : rawData
          const label = lang === 'en' ? translateLabel(q.label) : q.label
          const isPie = data.length <= 4
          const otherTotal = others.reduce((s, o) => s + o.count, 0)

          return (
            <div key={q.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 mb-1">Q{q.ordinal}</p>
              <h3 className="text-sm font-semibold text-gray-800 mb-4 leading-snug">{label}</h3>
              {isPie ? <SurveyPieChart data={data} /> : <SurveyBarChart data={data} />}

              {others.length > 0 && (
                <details className="mt-4 border-t border-gray-100 pt-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-700">
                    {isEn
                      ? `"Other" answers (${others.length} distinct · ${otherTotal} responses)`
                      : `Odgovori pod "Ostalo" (${others.length} različitih · ${otherTotal} odgovora)`}
                  </summary>
                  <ul className="mt-2.5 space-y-1">
                    {others.map((o, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
                        <span className="flex-1 break-words">{o.answer_value}</span>
                        {o.count > 1 && (
                          <span className="text-gray-400 tabular-nums shrink-0">×{o.count}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
