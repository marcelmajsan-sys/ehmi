'use client'

import { useLang } from '@/lib/lang-context'
import { KpiCard } from '@/components/KpiCard'
import { SurveyBarChart, type ChartItem } from '@/components/charts/SurveyBarChart'
import { SurveyPieChart } from '@/components/charts/SurveyPieChart'
import type { OverviewStats } from '@/translations'
import { translateOption } from '@/translations/survey-data'

const CTA_HREF = 'https://ecommerce.hr/o-udruzi/clanstvo/web-trgovine'

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
          <KpiCard label={o.kpi.visits100k} value={`${s.pctPosjeti100k}%`} />
          <KpiCard label={o.kpi.outsideCroatia} value={`${s.pctVanRH ?? 0}%`} />
          <KpiCard label={o.kpi.physicalStore} value={`${s.pctPlosc ?? 0}%`} />
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
          <SurveyBarChart data={c.q25} title={o.s6.chart2} color="#16a34a" />
        </div>
      </Section>

      <Section title={o.s7.title}>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{o.s7.body(s)}</p>
        <div className="grid sm:grid-cols-2 gap-8 max-w-2xl">
          <SurveyPieChart data={c.q23} title={o.s7.chart1} />
          <SurveyPieChart data={c.q30} title={o.s7.chart2} />
        </div>

        {/* CTA — članstvo u udruzi */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{o.cta.heading}</h3>
          <ul className="space-y-2.5 mb-6">
            {o.cta.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
                  <path d="M16.5 5.5L8 14l-4.5-4.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <a
            href={CTA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold tracking-wide hover:bg-blue-700 transition-colors"
          >
            {o.cta.button}
          </a>
        </div>
      </Section>
    </div>
  )
}
