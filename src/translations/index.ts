export type Lang = 'en' | 'hr'

export type OverviewStats = {
  pctPromet500k: number
  pctOnline100: number
  topPlatforma: string
  pctVanRH: number
  pctPlosc: number
  pctPosjeti100k: number
  pctDostavaKuca: number
  pctGoogle: number
  pctAI: number
  pctCert: number
  pctClan: number
}

type S = OverviewStats

const en = {
  nav: {
    overview: 'Summary',
    questions: 'All results',
    explore: 'Explore data',
    users: 'Users',
    activity: 'Activity',
    settings: 'Settings',
    signOut: 'Sign out',
  },
  login: {
    heading: 'Sign in',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
  },
  overview: {
    title: 'Croatian Web Shop Survey 2026',
    subtitle: 'Key findings — eCommerce Hrvatska',
    kpi: {
      respondents: 'Respondents',
      revenue: 'Revenue > €500k',
      visits100k: 'Visits > 100k/mo',
      outsideCroatia: 'Sell outside Croatia',
      physicalStore: 'Have physical store',
    },
    s1: {
      title: '1. Shop Profiles',
      body: (s: S) => `The survey covers 173 web shops from Croatia. Small webshops dominate, yet ${s.pctPromet500k}% of respondents report annual revenue above €500,000. ${s.pctOnline100}% sell exclusively online. The most popular platform is ${s.topPlatforma}.`,
      chart1: 'Annual gross revenue',
      chart2: 'Share of online in total sales',
    },
    s2: {
      title: '2. Platforms & Hosting',
      body: (_: S) => 'The platform landscape is diverse — more than a dozen different solutions are in use. Hosting providers show similar variety, with many shops relying on domestic providers or specialised SaaS solutions.',
      chart1: 'Webshop platform (top 8)',
      chart2: 'Hosting provider (top 8)',
    },
    s3: {
      title: '3. Payments',
      body: (_: S) => 'When selecting a payment provider, respondents most often highlight security, reliability, and ease of integration. Leading payment gateways are a mix of local solutions and global players.',
      chart1: 'Payment gateway provider (top 8)',
      chart2: 'Most important provider criteria (top 8)',
    },
    s4: {
      title: '4. Delivery',
      body: (s: S) => `${s.pctDostavaKuca}% of webshops offer home delivery, while parcel lockers are growing. Key fulfilment challenges include inventory management, seasonal peaks, and returns. Most shops charge between €3 and €5 for delivery.`,
      chart1: 'Delivery methods',
      chart2: 'Delivery pricing',
    },
    s5: {
      title: '5. Marketing & Communication channels',
      body: (s: S) => `Google and Facebook remain the dominant marketing channels — ${s.pctGoogle}% of respondents use Google advertising. Email leads customer communication, and reviews are collected via Google Reviews and specialised tools.`,
      chart1: 'Advertising channels (top 8)',
      chart2: 'Customer communication channels (top 8)',
    },
    s6: {
      title: '6. Technology & AI',
      body: (s: S) => `${s.pctAI}% of respondents use AI tools in daily operations — primarily for content creation, product descriptions, and translations.`,
      chart1: 'AI tool usage',
      chart2: 'AI tool use cases (top 8)',
    },
    s7: {
      title: '7. Trust & Support',
      body: (s: S) => `${s.pctCert}% have certified their webshop, and ${s.pctClan}% are active members of the eCommerce Hrvatska association — a mark of trust and a supportive community.`,
      chart1: 'Webshop certification',
      chart2: 'Association membership',
    },
    cta: {
      heading: 'Not a member yet?',
      benefits: ['Safe Shop trust badge', 'Review collection system', 'Ticket to the CRO Commerce conference'],
      button: 'JOIN US',
    },
  },
  questions: {
    title: 'Questions',
    subtitle: 'All survey questions with aggregated responses',
    error: 'Error loading data.',
  },
  explore:  { title: 'Explore',  subtitle: 'Individual respondent data — coming soon.' },
  chat:     { title: 'Chat',     subtitle: 'AI-powered correlation analysis — coming soon.' },
  users:    { title: 'Users',    subtitle: 'User and role management — coming soon.' },
}

const hr: typeof en = {
  nav: {
    overview: 'Sažetak',
    questions: 'Svi rezultati',
    explore: 'Istraži podatke',
    users: 'Ispitanici',
    activity: 'Aktivnost',
    settings: 'Postavke',
    signOut: 'Odjava',
  },
  login: {
    heading: 'Prijava',
    password: 'Lozinka',
    submit: 'Prijava',
    submitting: 'Prijava...',
  },
  overview: {
    title: 'Istraživanje web trgovina 2026',
    subtitle: 'Pregled ključnih nalaza — eCommerce Hrvatska',
    kpi: {
      respondents: 'Ispitanika',
      revenue: 'Promet > 500k €',
      visits100k: 'Posjeti > 100k/mj',
      outsideCroatia: 'Prodaju van RH',
      physicalStore: 'Imaju poslovnicu',
    },
    s1: {
      title: '1. Profil trgovina',
      body: (s: S) => `Istraživanje obuhvaća 173 web trgovine iz Hrvatske. Dominiraju manji webshopovi, no ${s.pctPromet500k}% ispitanika bilježi promet iznad 500.000 €. ${s.pctOnline100}% prodaje isključivo online. Najpopularnija platforma je ${s.topPlatforma}.`,
      chart1: 'Godišnji bruto promet webshopa',
      chart2: 'Udio web trgovine u ukupnoj prodaji',
    },
    s2: {
      title: '2. Platforme i hosting',
      body: (_: S) => 'Slika platformi je šarolika — zastupljeno je više od desetak različitih rješenja. Na hostinškoj strani vlada sličan pluralizam, a mnogi se oslanjaju na domaće davatelje usluga ili specijalizirana SaaS rješenja.',
      chart1: 'Platforma webshopa (top 8)',
      chart2: 'Hosting (top 8)',
    },
    s3: {
      title: '3. Plaćanje',
      body: (_: S) => 'Kod odabira payment providera ispitanici najčešće ističu sigurnost, pouzdanost i jednostavnost integracije. Vodeći payment gateway provajderi su lokalna rješenja uz prisutnost globalnih igrača.',
      chart1: 'Payment gateway provider (top 8)',
      chart2: 'Najvažnije kod odabira providera (top 8)',
    },
    s4: {
      title: '4. Dostava',
      body: (s: S) => `Dostavu na kućnu adresu nudi ${s.pctDostavaKuca}% webshopova, a paketomati bilježe rast. Ključni izazovi su upravljanje zalihama, sezonski peakovi i povrati. Naplata dostave najčešće iznosi između 3 i 5 eura.`,
      chart1: 'Načini dostave',
      chart2: 'Naplata dostave',
    },
    s5: {
      title: '5. Marketing i kanali komunikacije',
      body: (s: S) => `Google i Facebook ostaju ključni marketinški kanali — Google oglašavanje koristi ${s.pctGoogle}% ispitanika. U komunikaciji s kupcima dominira email, a recenzije se prikupljaju putem Google Reviews i specijaliziranih alata.`,
      chart1: 'Kanali oglašavanja (top 8)',
      chart2: 'Komunikacija s kupcima (top 8)',
    },
    s6: {
      title: '6. Tehnologija i AI',
      body: (s: S) => `${s.pctAI}% ispitanika koristi AI alate u svakodnevnom poslovanju — uglavnom za izradu sadržaja, opise proizvoda i prijevode.`,
      chart1: 'Korištenje AI alata',
      chart2: 'Za što se koriste AI alati (top 8)',
    },
    s7: {
      title: '7. Povjerenje i podrška',
      body: (s: S) => `Certifikaciju webshopa provelo je ${s.pctCert}%, a ${s.pctClan}% je aktivni član udruge eCommerce Hrvatska — znak povjerenja i podrške zajednice.`,
      chart1: 'Certifikacija webshopa',
      chart2: 'Članstvo u udruzi',
    },
    cta: {
      heading: 'Još niste član?',
      benefits: ['Safe Shop oznaka povjerenja', 'Sustav za prikupljanje recenzija', 'Ulaznica na CRO Commerce konferenciju'],
      button: 'PRIDRUŽITE NAM SE',
    },
  },
  questions: {
    title: 'Pitanja',
    subtitle: 'Pregled svih pitanja i agregiranih odgovora',
    error: 'Greška pri učitavanju podataka.',
  },
  explore:  { title: 'Istraži',    subtitle: 'Pregled pojedinačnih odgovora ispitanika — uskoro.' },
  chat:     { title: 'Chat',       subtitle: 'Pretraživanje korelacija putem AI-a — uskoro.' },
  users:    { title: 'Korisnici',  subtitle: 'Upravljanje korisnicima i ulogama — uskoro.' },
}

export const translations = { en, hr }
export type T = typeof en
