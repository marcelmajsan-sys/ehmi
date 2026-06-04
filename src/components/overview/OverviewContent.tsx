'use client'

import { useLang } from '@/lib/lang-context'
import { KpiCard } from '@/components/KpiCard'
import { SurveyBarChart, type ChartItem } from '@/components/charts/SurveyBarChart'
import { SurveyPieChart } from '@/components/charts/SurveyPieChart'
import type { OverviewStats } from '@/translations'
import { translateOption } from '@/translations/survey-data'

function xlat(data: ChartItem[], lang: string): ChartItem[] {
  if (lang === 'hr') return data
  return data.map(i => ({ ...i, option_value: translateOption(i.option_value) }))
}

export type OverviewData = {
  stats: OverviewStats
  charts: {
    q29: ChartItem[]; q28: ChartItem[]
    q04: ChartItem[]; q05: ChartItem[]
    q16: ChartItem[]; q17: ChartItem[]
    q10: ChartItem[]; q12: ChartItem[]
    q19: ChartItem[]; q20: ChartItem[]
    q24: ChartItem[]; q25: ChartItem[]
    q23: ChartItem[]; q30: ChartItem[]
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </section>
  )
}

export function OverviewContent({ data }: { data: OverviewData }) {
  const { t, lang } = useLang()
  const { stats: s, charts: raw } = data
  const c = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, xlat(v as ChartItem[], lang)])
  ) as typeof raw
  const o = t.overview

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{o.title}</h1>
        <p className="text-gray-500 mb-6">{o.subtitle}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label={o.kpi.respondents} value="173" />
          <KpiCard label={o.kpi.revenue} value={`${s.pctPromet500k}%`} />
          <KpiCard label={o.kpi.outsideCroatia} value={`${s.pctVanRH ?? 0}%`} />
          <KpiCard label={o.kpi.physicalStore} value={`${s.pctPlosc ?? 0}%`} />
          <KpiCard label={o.kpi.useAI} value={`${s.pctAI}%`} />
        </div>
      </div>

      <Section title={o.s1.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s1.body(s)}</p>
            <SurveyBarChart data={c.q29} title={o.s1.chart1} color="#2563eb" />
          </div>
          <SurveyPieChart data={c.q28} title={o.s1.chart2} />
        </div>
      </Section>

      <Section title={o.s2.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s2.body(s)}</p>
            <SurveyBarChart data={c.q04} title={o.s2.chart1} color="#7c3aed" />
          </div>
          <SurveyBarChart data={c.q05} title={o.s2.chart2} color="#0891b2" />
        </div>
      </Section>

      <Section title={o.s3.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s3.body(s)}</p>
            <SurveyBarChart data={c.q16} title={o.s3.chart1} color="#16a34a" />
          </div>
          <SurveyBarChart data={c.q17} title={o.s3.chart2} color="#ca8a04" />
        </div>
      </Section>

      <Section title={o.s4.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s4.body(s)}</p>
            <SurveyBarChart data={c.q10} title={o.s4.chart1} color="#dc2626" />
          </div>
          <SurveyBarChart data={c.q12} title={o.s4.chart2} color="#ea580c" />
        </div>
      </Section>

      <Section title={o.s5.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s5.body(s)}</p>
            <SurveyBarChart data={c.q19} title={o.s5.chart1} color="#2563eb" />
          </div>
          <SurveyBarChart data={c.q20} title={o.s5.chart2} color="#7c3aed" />
        </div>
      </Section>

      <Section title={o.s6.title}>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s6.body(s)}</p>
            <SurveyPieChart data={c.q24} title={o.s6.chart1} />
          </div>
          <div className="space-y-6">
            <SurveyBarChart data={c.q25} title={o.s6.chart2} color="#16a34a" />
            <div className="grid grid-cols-2 gap-4">
              <SurveyPieChart data={c.q23} title={o.s6.chart3} />
              <SurveyPieChart data={c.q30} title={o.s6.chart4} />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
