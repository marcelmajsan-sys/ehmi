// The fixed example questions shown on /explore. Their answers are precomputed
// into explore-cache.json (see scripts/precompute-explore.ts) so clicking one
// renders instantly instead of waiting on two Claude round-trips.
export const EXAMPLES = [
  {
    hr: 'Koje načine dostave biraju trgovci ovisno o prosječnom iznosu košarice?',
    en: 'Which delivery methods do merchants choose by average cart value?',
  },
  {
    hr: 'Koji hosting koriste WooCommerce trgovci?',
    en: 'Which hosting providers do WooCommerce merchants use?',
  },
  {
    hr: 'Koji se kanali oglašavanja koriste po broju mjesečnih posjeta?',
    en: 'Which advertising channels are used by monthly visit count?',
  },
  {
    hr: 'U koje svrhe trgovci koriste AI alate ovisno o svom godišnjem prometu?',
    en: 'For what purposes do merchants use AI tools by their annual revenue?',
  },
  {
    hr: 'Koliko trgovaca koristi WooCommerce?',
    en: 'How many merchants use WooCommerce?',
  },
  {
    hr: 'Koji je prosječni godišnji promet po platformi?',
    en: 'What is the average annual revenue per platform?',
  },
] as const

export type CachedAnswer = {
  question: string
  sql: string
  rows: Record<string, unknown>[]
  analysis: string
}
