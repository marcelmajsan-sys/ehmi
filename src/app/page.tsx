import { createClient } from '@/lib/supabase/server'
import { OverviewContent, type OverviewData } from '@/components/overview/OverviewContent'
import type { ChartItem } from '@/components/charts/SurveyBarChart'

type Agg = { question_key: string; option_value: string; count: number; respondent_count: number | null }
type AggMap = Record<string, ChartItem[]>
type BaseMap = Record<string, number>

// Per-question denominator = respondents who answered (respondent_count). For
// multi-select questions this is much smaller than the sum of option counts, so
// percentages reflect share of respondents rather than share of selections.
// Single-select questions have respondent_count == sum, so they're unchanged.
// Falls back to the sum where respondent_count isn't populated (pre-migration).
function buildBase(aggs: Agg[]): BaseMap {
  const base: BaseMap = {}
  const sum: BaseMap = {}
  for (const a of aggs) {
    sum[a.question_key] = (sum[a.question_key] ?? 0) + a.count
    if (a.respondent_count != null) base[a.question_key] = a.respondent_count
  }
  for (const key of Object.keys(sum)) {
    if (!base[key] || base[key] <= 0) base[key] = sum[key]
  }
  return base
}

function groupAggs(aggs: Agg[], base: BaseMap): AggMap {
  const map: AggMap = {}
  for (const a of aggs) {
    if (!map[a.question_key]) map[a.question_key] = []
    map[a.question_key].push({ option_value: a.option_value, count: a.count, pct: 0 })
  }
  for (const key of Object.keys(map)) {
    const total = base[key] ?? 0
    map[key] = map[key]
      .map(i => ({ ...i, pct: total > 0 ? Math.round((i.count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }
  return map
}

function topN(items: ChartItem[], n: number, total: number): ChartItem[] {
  if (items.length <= n) return items
  const top = items.slice(0, n)
  const rest = items.slice(n)
  const restCount = rest.reduce((s, i) => s + i.count, 0)
  return [...top, {
    option_value: 'Ostalo',
    count: restCount,
    pct: total > 0 ? Math.round((restCount / total) * 100) : 0,
  }]
}

function pct(map: AggMap, base: BaseMap, key: string, options: string[]): number {
  const items = map[key] ?? []
  const total = base[key] ?? 0
  const match = items.filter(i => options.includes(i.option_value)).reduce((s, i) => s + i.count, 0)
  return total > 0 ? Math.round((match / total) * 100) : 0
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: aggs, error } = await supabase
    .from('question_aggregates')
    .select('question_key,option_value,count,respondent_count')

  if (error || !aggs) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">
        Error loading data. Check configuration.
      </div>
    )
  }

  const base = buildBase(aggs)
  const byQ = groupAggs(aggs, base)
  const top = (key: string, n: number) => topN(byQ[key] ?? [], n, base[key] ?? 0)

  const data: OverviewData = {
    stats: {
      pctPromet500k:  pct(byQ, base, 'q29_godisnji_bruto_promet_vaseg_webshopa_izn', ['500.000 - 1.000.000 eura', 'Više od 1.000.000 eura']),
      pctVanRH:       pct(byQ, base, 'q01_prodajete_li_robu_usluge_van_rh', ['DA']),
      pctPlosc:       pct(byQ, base, 'q02_imate_li_fizicku_poslovnicu', ['DA']),
      pctPosjeti100k: pct(byQ, base, 'q21_koliko_posjeta_imate_mjesecno', ['Više od 100.000']),
      pctAI:          pct(byQ, base, 'q24_koristite_li_ai_alate_za_posao', ['DA']),
      pctOnline100:   pct(byQ, base, 'q28_koliki_vam_je_udio_web_trgovine_u_ukupno', ['100% (prodajem isključivo online)']),
      topPlatforma:  byQ['q04_na_kojoj_platformi_se_nalazi_vas_webshop']?.[0]?.option_value ?? '—',
      pctDostavaKuca: pct(byQ, base, 'q10_koji_nacin_dostave_nudite', ['dostava na kućnu adresu']),
      pctGoogle:     pct(byQ, base, 'q19_odaberite_nacine_oglasavanja_i_promocije', ['Google']),
      pctCert:       pct(byQ, base, 'q23_jeste_li_certificirali_svoj_webshop', ['Da']),
      pctClan:       pct(byQ, base, 'q30_jeste_li_clan_udruge_ecommerce_hrvatska', ['Da']),
    },
    charts: {
      q29: byQ['q29_godisnji_bruto_promet_vaseg_webshopa_izn'] ?? [],
      q28: byQ['q28_koliki_vam_je_udio_web_trgovine_u_ukupno'] ?? [],
      q04: top('q04_na_kojoj_platformi_se_nalazi_vas_webshop', 8),
      q05: top('q05_koji_hosting_koristite', 8),
      q16: top('q16_koji_payment_gateway_provider_koristite', 8),
      q17: top('q17_sto_vam_je_najvaznije_kod_odabira_paymen', 8),
      q10: byQ['q10_koji_nacin_dostave_nudite'] ?? [],
      q12: byQ['q12_koliko_naplacujete_dostavu'] ?? [],
      q19: top('q19_odaberite_nacine_oglasavanja_i_promocije', 8),
      q20: top('q20_odaberite_kanale_putem_kojih_komunicirat', 8),
      q24: byQ['q24_koristite_li_ai_alate_za_posao'] ?? [],
      q25: top('q25_za_sto_sve_koristite_ai_alate', 8),
      q23: byQ['q23_jeste_li_certificirali_svoj_webshop'] ?? [],
      q30: byQ['q30_jeste_li_clan_udruge_ecommerce_hrvatska'] ?? [],
    },
  }

  return <OverviewContent data={data} />
}
