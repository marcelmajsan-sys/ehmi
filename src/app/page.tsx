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
          Istraživanje web trgovina 2026
        </h1>
        <p className="text-gray-500 mb-6">
          Pregled ključnih nalaza — eCommerce Hrvatska
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="Ispitanika" value="173" />
          <KpiCard label="Promet &gt; 500k €" value={`${pctPromet500k}%`} />
          <KpiCard label="Prodaju van RH" value={`${pctVanRH}%`} />
          <KpiCard label="Imaju poslovnicu" value={`${pctPlosc}%`} />
          <KpiCard label="Koriste AI" value={`${pctAI}%`} />
        </div>
      </div>

      {/* 1. Profil */}
      <Section title="1. Profil trgovina">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Istraživanje obuhvaća 173 web trgovine iz Hrvatske. Dominiraju manji webshopovi,
              no <strong>{pctPromet500k}%</strong> ispitanika bilježi godišnji promet iznad 500.000 €,
              što svjedoči o zrelosti dijela sektora. <strong>{pctOnline100}%</strong> ispitanika
              prodaje isključivo online, dok ostatak kombinira fizičku i online prodaju.
              Najpopularnija platforma je <strong>{topPlatforma}</strong>.
            </p>
            <SurveyBarChart data={q29} title="Godišnji bruto promet webshopa" color="#2563eb" />
          </div>
          <SurveyPieChart data={q28} title="Udio web trgovine u ukupnoj prodaji" />
        </div>
      </Section>

      {/* 2. Platforme */}
      <Section title="2. Platforme i hosting">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Slika platformi je šarolika — zastupljeno je više od desetak različitih rješenja.
              Na hostinškoj strani vlada sličan pluralizam, a mnogi se oslanjaju
              na domaće davatelje usluga ili specijalizirana SaaS rješenja.
            </p>
            <SurveyBarChart data={q04} title="Platforma webshopa (top 8)" color="#7c3aed" />
          </div>
          <SurveyBarChart data={q05} title="Hosting (top 8)" color="#0891b2" />
        </div>
      </Section>

      {/* 3. Plaćanje */}
      <Section title="3. Plaćanje">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Kod odabira payment providera ispitanici najčešće ističu sigurnost,
              pouzdanost i jednostavnost integracije kao ključne kriterije.
              Vodeći payment gateway provajderi su lokalna rješenja
              uz prisutnost globalnih igrača.
            </p>
            <SurveyBarChart data={q16} title="Payment gateway provider (top 8)" color="#16a34a" />
          </div>
          <SurveyBarChart data={q17} title="Najvažnije kod odabira providera (top 8)" color="#ca8a04" />
        </div>
      </Section>

      {/* 4. Dostava */}
      <Section title="4. Dostava i logistika">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Dostavu na kućnu adresu nudi <strong>{pctDostavaKuca}%</strong> webshopova,
              a paketomati bilježe rast popularnosti. Ključni izazovi u fulfillmentu
              su upravljanje zalihama, sezonski peakovi i povrati.
              Naplata dostave najčešće iznosi između 3 i 5 eura.
            </p>
            <SurveyBarChart data={q10} title="Načini dostave" color="#dc2626" />
          </div>
          <SurveyBarChart data={q12} title="Naplata dostave" color="#ea580c" />
        </div>
      </Section>

      {/* 5. Marketing */}
      <Section title="5. Marketing i kupci">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Google i Facebook ostaju ključni marketinški kanali —
              Google oglašavanje koristi <strong>{pctGoogle}%</strong> ispitanika.
              U komunikaciji s kupcima dominira email, a recenzije se prikupljaju
              putem Google Reviews i specijaliziranih alata.
            </p>
            <SurveyBarChart data={q19} title="Kanali oglašavanja (top 8)" color="#2563eb" />
          </div>
          <SurveyBarChart data={q20} title="Komunikacija s kupcima (top 8)" color="#7c3aed" />
        </div>
      </Section>

      {/* 6. Tehnologija */}
      <Section title="6. Tehnologija i zajednica">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              <strong>{pctAI}%</strong> ispitanika koristi AI alate u svakodnevnom poslovanju —
              uglavnom za izradu sadržaja, opise proizvoda i prijevode.
              Certifikaciju webshopa provelo je <strong>{pctCert}%</strong>,
              a <strong>{pctClan}%</strong> je aktivni član udruge eCommerce Hrvatska.
            </p>
            <SurveyPieChart data={q24} title="Korištenje AI alata" />
          </div>
          <div className="space-y-6">
            <SurveyBarChart data={q25} title="Za što se koriste AI alati (top 8)" color="#16a34a" />
            <div className="grid grid-cols-2 gap-4">
              <SurveyPieChart data={q23} title="Certifikacija" />
              <SurveyPieChart data={q30} title="Članstvo u udruzi" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
