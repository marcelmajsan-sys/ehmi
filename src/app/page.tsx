import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/KpiCard'
import { SurveyBarChart, type ChartItem } from '@/components/charts/SurveyBarChart'
import { SurveyPieChart } from '@/components/charts/SurveyPieChart'

type Agg = { question_key: string; option_value: string; count: number }
type AggMap = Record<string, ChartItem[]>

function groupAggs(aggs: Agg[]): AggMap {
  const map: AggMap = {}
  for (const a of aggs) {
    if (!map[a.question_key]) map[a.question_key] = []
    map[a.question_key].push({ option_value: a.option_value, count: a.count, pct: 0 })
  }
  for (const key of Object.keys(map)) {
    const total = map[key].reduce((s, i) => s + i.count, 0)
    map[key] = map[key]
      .map(i => ({ ...i, pct: total > 0 ? Math.round((i.count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }
  return map
}

function topN(items: ChartItem[], n: number): ChartItem[] {
  if (items.length <= n) return items
  const top = items.slice(0, n)
  const rest = items.slice(n)
  const total = items.reduce((s, i) => s + i.count, 0)
  const restCount = rest.reduce((s, i) => s + i.count, 0)
  return [...top, {
    option_value: 'Ostalo',
    count: restCount,
    pct: total > 0 ? Math.round((restCount / total) * 100) : 0,
  }]
}

function pctOptions(map: AggMap, key: string, options: string[]): number {
  const items = map[key] ?? []
  const total = items.reduce((s, i) => s + i.count, 0)
  const matching = items.filter(i => options.includes(i.option_value)).reduce((s, i) => s + i.count, 0)
  return total > 0 ? Math.round((matching / total) * 100) : 0
}

function topOption(map: AggMap, key: string): string {
  return map[key]?.[0]?.option_value ?? '—'
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-5">{title}</h2>
      {children}
    </section>
  )
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: aggs, error } = await supabase
    .from('question_aggregates')
    .select('question_key,option_value,count')

  if (error || !aggs) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Greška pri učitavanju podataka. Provjeri konfiguraciju.
      </div>
    )
  }

  const byQ = groupAggs(aggs)

  // Hero KPIs
  const pctPromet500k = pctOptions(byQ, 'q29_godisnji_bruto_promet_vaseg_webshopa_izn', [
    '500.000 - 1.000.000 eura', 'Više od 1.000.000 eura',
  ])
  const pctVanRH    = pctOptions(byQ, 'q01_prodajete_li_robu_usluge_van_rh', ['DA'])
  const pctPlosc    = pctOptions(byQ, 'q02_imate_li_fizicku_poslovnicu', ['DA'])
  const pctAI       = pctOptions(byQ, 'q24_koristite_li_ai_alate_za_posao', ['DA'])

  // Interpolated stats
  const pctOnline100   = pctOptions(byQ, 'q28_koliki_vam_je_udio_web_trgovine_u_ukupno', ['100% (prodajem isključivo online)'])
  const topPlatforma   = topOption(byQ, 'q04_na_kojoj_platformi_se_nalazi_vas_webshop')
  const pctDostavaKuca = pctOptions(byQ, 'q10_koji_nacin_dostave_nudite', ['dostava na kućnu adresu'])
  const pctGoogle      = pctOptions(byQ, 'q19_odaberite_nacine_oglasavanja_i_promocije', ['Google'])
  const pctCert        = pctOptions(byQ, 'q23_jeste_li_certificirali_svoj_webshop', ['Da'])
  const pctClan        = pctOptions(byQ, 'q30_jeste_li_clan_udruge_ecommerce_hrvatska', ['Da'])

  // Chart datasets
  const q29 = byQ['q29_godisnji_bruto_promet_vaseg_webshopa_izn'] ?? []
  const q28 = byQ['q28_koliki_vam_je_udio_web_trgovine_u_ukupno'] ?? []
  const q04 = topN(byQ['q04_na_kojoj_platformi_se_nalazi_vas_webshop'] ?? [], 8)
  const q05 = topN(byQ['q05_koji_hosting_koristite'] ?? [], 8)
  const q16 = topN(byQ['q16_koji_payment_gateway_provider_koristite'] ?? [], 8)
  const q17 = topN(byQ['q17_sto_vam_je_najvaznije_kod_odabira_paymen'] ?? [], 8)
  const q10 = byQ['q10_koji_nacin_dostave_nudite'] ?? []
  const q12 = byQ['q12_koliko_naplacujete_dostavu'] ?? []
  const q19 = topN(byQ['q19_odaberite_nacine_oglasavanja_i_promocije'] ?? [], 8)
  const q20 = topN(byQ['q20_odaberite_kanale_putem_kojih_komunicirat'] ?? [], 8)
  const q24 = byQ['q24_koristite_li_ai_alate_za_posao'] ?? []
  const q25 = topN(byQ['q25_za_sto_sve_koristite_ai_alate'] ?? [], 8)
  const q23 = byQ['q23_jeste_li_certificirali_svoj_webshop'] ?? []
  const q30 = byQ['q30_jeste_li_clan_udruge_ecommerce_hrvatska'] ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Croatian Web Shop Survey 2026
        </h1>
        <p className="text-gray-500 mb-6">
          Key findings — eCommerce Hrvatska
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Respondents" value="173" />
          <KpiCard label="Revenue &gt; €500k" value={`${pctPromet500k}%`} />
          <KpiCard label="Sell outside Croatia" value={`${pctVanRH}%`} />
          <KpiCard label="Have physical store" value={`${pctPlosc}%`} />
          <KpiCard label="Use AI tools" value={`${pctAI}%`} />
        </div>
      </div>

      {/* 1. Profil */}
      <Section title="1. Shop Profiles">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              The survey covers 173 web shops from Croatia. Small webshops dominate, yet{' '}
              <strong>{pctPromet500k}%</strong> of respondents report annual revenue above €500,000,
              reflecting the maturity of part of the sector. <strong>{pctOnline100}%</strong> sell
              exclusively online, while the rest combine physical and online sales.
              The most popular platform is <strong>{topPlatforma}</strong>.
            </p>
            <SurveyBarChart data={q29} title="Annual gross revenue" color="#2563eb" />
          </div>
          <SurveyPieChart data={q28} title="Share of online in total sales" />
        </div>
      </Section>

      {/* 2. Platforme */}
      <Section title="2. Platforms & Hosting">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              The platform landscape is diverse — more than a dozen different solutions are in use.
              Hosting providers show similar variety, with many shops relying on domestic
              providers or specialised SaaS solutions.
            </p>
            <SurveyBarChart data={q04} title="Webshop platform (top 8)" color="#7c3aed" />
          </div>
          <SurveyBarChart data={q05} title="Hosting provider (top 8)" color="#0891b2" />
        </div>
      </Section>

      {/* 3. Plaćanje */}
      <Section title="3. Payments">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              When selecting a payment provider, respondents most often highlight security,
              reliability, and ease of integration as key criteria. Leading payment gateways
              are a mix of local solutions and global players.
            </p>
            <SurveyBarChart data={q16} title="Payment gateway provider (top 8)" color="#16a34a" />
          </div>
          <SurveyBarChart data={q17} title="Most important provider criteria (top 8)" color="#ca8a04" />
        </div>
      </Section>

      {/* 4. Dostava */}
      <Section title="4. Delivery & Logistics">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              <strong>{pctDostavaKuca}%</strong> of webshops offer home delivery, while parcel
              lockers are growing in popularity. Key fulfilment challenges include inventory
              management, seasonal peaks, and returns. Most shops charge between €3 and €5
              for delivery.
            </p>
            <SurveyBarChart data={q10} title="Delivery methods" color="#dc2626" />
          </div>
          <SurveyBarChart data={q12} title="Delivery pricing" color="#ea580c" />
        </div>
      </Section>

      {/* 5. Marketing */}
      <Section title="5. Marketing & Customers">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Google and Facebook remain the dominant marketing channels —{' '}
              <strong>{pctGoogle}%</strong> of respondents use Google advertising.
              Email leads customer communication, and reviews are collected primarily
              via Google Reviews and specialised tools.
            </p>
            <SurveyBarChart data={q19} title="Advertising channels (top 8)" color="#2563eb" />
          </div>
          <SurveyBarChart data={q20} title="Customer communication channels (top 8)" color="#7c3aed" />
        </div>
      </Section>

      {/* 6. Tehnologija */}
      <Section title="6. Technology & Community">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              <strong>{pctAI}%</strong> of respondents use AI tools in daily operations —
              primarily for content creation, product descriptions, and translations.{' '}
              <strong>{pctCert}%</strong> have certified their webshop, and{' '}
              <strong>{pctClan}%</strong> are active members of the eCommerce Hrvatska association.
            </p>
            <SurveyPieChart data={q24} title="AI tool usage" />
          </div>
          <div className="space-y-6">
            <SurveyBarChart data={q25} title="AI tool use cases (top 8)" color="#16a34a" />
            <div className="grid grid-cols-2 gap-4">
              <SurveyPieChart data={q23} title="Webshop certification" />
              <SurveyPieChart data={q30} title="Association membership" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
