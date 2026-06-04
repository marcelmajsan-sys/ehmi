// Croatian → English mapping for survey option values and question labels.
// Falls back to the original string if not found.

export const questionLabels: Record<string, string> = {
  'Prodajete li robu/usluge van RH?': 'Do you sell goods/services outside Croatia?',
  'Imate li fizičku poslovnicu?': 'Do you have a physical store?',
  'Koliko fizičkih poslovnica imate?': 'How many physical stores do you have?',
  'Na kojoj platformi se nalazi vaš webshop?': 'Which platform is your webshop on?',
  'Koji hosting koristite?': 'Which hosting do you use?',
  'Koliko proizvoda imate u ponudi?': 'How many products do you offer?',
  'Kakve proizvode prodajete?': 'What kind of products do you sell?',
  'Kategorija koja najbliže opisuje vaše proizvode je?': 'The category that best describes your products is?',
  'Kako dostavljate svoje proizvode?': 'How do you deliver your products?',
  'Koji način dostave nudite?': 'Which delivery methods do you offer?',
  'Što smatrate najvećom prednosti paketomata?': 'What do you consider the biggest advantage of parcel lockers?',
  'Koliko naplaćujete dostavu?': 'How much do you charge for delivery?',
  'Gdje skladištite proizvode za online prodaju?': 'Where do you store products for online sales?',
  'Koji su vam najveći izazovi u fulfillment procesu?': 'What are your biggest challenges in the fulfillment process?',
  'Koje sve mogućnosti plaćanja omogućujete?': 'Which payment options do you offer?',
  'Koji Payment Gateway Provider koristite?': 'Which Payment Gateway Provider do you use?',
  'Što vam je najvažnije kod odabira payment providera?': 'What matters most when choosing a payment provider?',
  'Što vam danas predstavlja najveći izazov kod kartične online naplate?': 'What is your biggest challenge with online card payments?',
  'Odaberite načine oglašavanja i promocije koje koristite': 'Select the advertising and promotion methods you use',
  'Odaberite kanale putem kojih komunicirate s kupcima': 'Select the channels you use to communicate with customers',
  'Koliko posjeta imate mjesečno?': 'How many visits do you have per month?',
  'Na koji način prikupljate recenzije kupaca?': 'How do you collect customer reviews?',
  'Jeste li certificirali svoj webshop?': 'Have you certified your webshop?',
  'Koristite li AI alate za posao?': 'Do you use AI tools for work?',
  'Za što sve koristite AI alate?': 'What do you use AI tools for?',
  'Na vašem webshopu radi...': 'Your webshop is run by...',
  'Koji vam je prosječni iznos košarice?': 'What is your average cart value?',
  'Koliki vam je udio web trgovine u ukupnoj prodaji?': 'What is the share of web store in total sales?',
  'Godišnji bruto promet vašeg webshopa iznosi': "Your webshop's annual gross revenue is",
  'Jeste li član udruge eCommerce Hrvatska?': 'Are you a member of the eCommerce Croatia association?',
  'Želite li da vam pošaljemo kod za 20% popusta za prvo učlanjenje?': 'Would you like a 20% discount code for first membership?',
  'Zašto ne poslujete van granica RH?': "Why don't you operate outside Croatia?",
  'Zašto ste se učlanili u Udrugu eCommerce Hrvatska?': 'Why did you join the eCommerce Croatia Association?',
}

export const optionValues: Record<string, string> = {
  // Ostalo (added by topN helper)
  'Ostalo': 'Other',

  // q01 — sell outside Croatia
  'DA': 'YES',
  'NE': 'NO',
  'NE, ali planiram': 'NO, but I plan to',

  // q02 — physical store
  'NE, ali planiram imati': 'NO, but I plan to have one',

  // q03 — number of stores
  'više od 15': 'more than 15',

  // q06 — products
  'Do 10': 'Up to 10',
  'od 10 do 100': '10 to 100',
  '100 do 1000': '100 to 1,000',
  '1000 do 10.000': '1,000 to 10,000',
  '10.000 do 100.000': '10,000 to 100,000',
  'Više od 100.000': 'More than 100,000',

  // q04 — platform
  'Custom rješenje': 'Custom solution',
  'Nešto drugo': 'Something else',
  'Ne znam/nisam siguran': "I don't know / not sure",

  // q07 — product types
  'Fizičke': 'Physical',
  'Fizičke + usluga': 'Physical + service',
  'Digitalne (tečajeve, audio knjige, softver...)': 'Digital (courses, audiobooks, software...)',
  'Iskustva (ulaznice, putovanja...)': 'Experiences (tickets, travel...)',
  'Usluge (osiguranja i sl)': 'Services (insurance, etc.)',

  // q10 — delivery methods
  'dostava na kućnu adresu': 'home address delivery',
  'preuzimanje na paketomatu': 'pickup at a parcel locker',
  'preuzimanje na pickup pointu ili kiosku': 'pickup at a pickup point or kiosk',
  'preuzimanje u poslovnici ili skladištu tvrtke': 'pickup at company store or warehouse',
  'Preuzimanje na adresi obrta': 'pickup at the business address',

  // q11 — parcel locker advantages
  'Niži trošak dostave': 'Lower delivery cost',
  'Fleksibilnost preuzimanja': 'Pickup flexibility',
  'Brža dostava': 'Faster delivery',
  'Manji broj povrata': 'Fewer returns',
  'Jednostavnije korisničko iskustvo': 'Simpler user experience',
  'Veća uspješnost uručenja': 'Higher delivery success rate',

  // q12 — delivery pricing
  'do 3 eura': 'up to 3 euros',
  '3-4 eura': '3-4 euros',
  '4-5 eura': '4-5 euros',
  'više od 5 eura': 'more than 5 euros',
  'dostava je besplatna za sve narudžbe': 'delivery is free for all orders',
  'Moji paketi su teži od 2 kg / ne mogu odgovoriti': 'My parcels are heavier than 2 kg / can\'t answer',

  // q13 — storage
  'U vlastitom skladištu': 'In our own warehouse',
  'U unajmljenom skladištu': 'In a rented warehouse',
  'Kod kuće': 'At home',
  'Kod fulfillment partnera': 'At a fulfillment partner',
  'Ne držimo zalihe': "We don't keep stock",
  'U fizičkoj trgovini': 'In physical store',
  'U prostoru ducana': 'In the store space',
  'Po narudžbi': 'On order',

  // q14 — fulfillment challenges
  'Upravljanje zalihama': 'Inventory management',
  'Sezonski peakovi': 'Seasonal peaks',
  'Povrati': 'Returns',
  'Kašnjenja u obradi': 'Processing delays',
  'Cross-border logistika': 'Cross-border logistics',
  'Integracije i automatizacija': 'Integrations and automation',
  'Cijena': 'Price',
  'Ništa od navedenog': 'None of the above',

  // q15 — payment options
  'Virmanski/uplatnicom': 'Bank transfer / payment slip',
  'Pouzećem (samo gotovina)': 'Cash on delivery (cash only)',
  'Pouzećem (gotovina i kartice)': 'Cash on delivery (cash and cards)',
  'Kartično': 'Card',
  'Plaćanje u poslovnici': 'Payment in store',
  'Apple i Google Pay': 'Apple & Google Pay',
  'Keks Pay': 'Keks Pay',

  // q17 — payment provider criteria
  'sigurnost i pouzdanost': 'security and reliability',
  'jednostavnost integracije': 'ease of integration',
  'cijena': 'price',
  'stabilnost sustava': 'system stability',
  'lokalna podrška': 'local support',
  'brzina onboardinga / aktivacije': 'onboarding / activation speed',
  'reporting i administracija': 'reporting and administration',
  'broj metode plaćanja': 'number of payment methods',
  'UX checkouta': 'checkout UX',

  // q18 — payment challenges
  'visoki troškovi': 'high costs',
  'odbijene transakcije': 'declined transactions',
  'spora aktivacija': 'slow activation',
  'ništa od navedenog': 'none of the above',
  'komplicirana integracija': 'complicated integration',
  'podrška i komunikacija': 'support and communication',
  'sigurnost': 'security',
  'nedostatak lokalnih metoda plaćanja': 'lack of local payment methods',

  // q19 — advertising
  'Televizija': 'Television',
  'Tisak': 'Print',
  'Outdoor oglašavanje': 'Outdoor advertising',
  'Suradnje s influencerima': 'Influencer collaborations',
  'Usporedilice cijena (jeftinije.hr, nabava.net)': 'Price comparison sites',
  'Indoor u poslovnicama': 'Indoor in stores',
  'Javna događanja, promocije, sajmovi': 'Public events, promotions, fairs',
  'od usta do usta': 'Word of mouth',

  // q20 — customer communication
  'Telefonski pozivi': 'Phone calls',
  'Online chat': 'Online chat',

  // q21 — monthly visits (shared keys already defined above)
  'Do 10.000': 'Up to 10,000',
  '10.000 - 20.000': '10,000 - 20,000',
  '20.000 - 50.000': '20,000 - 50,000',
  '50.000 - 100.000': '50,000 - 100,000',

  // q22 — reviews
  'Ne prikupljamo recenzije kupaca': "We don't collect customer reviews",
  'Koristimo vlastiti sustav za prikupljanje recenzija': 'We use our own system to collect reviews',
  'Uz pomoć oznake povjerenja (npr Safe Shop)': 'With a trust mark (e.g. Safe Shop)',

  // q23 — certification
  'Da': 'Yes',
  'Ne': 'No',
  'Ne, ali planiram': 'No, but I plan to',

  // q24 — AI tools
  'NE, ali planiram početi': 'NO, but I plan to start',

  // q25 — AI tool uses
  'Izrada opisa proizvoda': 'Writing product descriptions',
  'Izrada tekstova za web i social': 'Writing copy for web and social',
  'Izrada/dorada fotografija': 'Creating/editing photos',
  'Komunikacija s kupcima (AI Chatbotovi)': 'Customer communication (AI chatbots)',
  'Istraživanje konkurencije': 'Competitor research',
  'CRM sustav': 'CRM system',
  'Dorada webshopa (pluginovi, automatizacije...)': 'Webshop improvements (plugins, automations...)',
  'Izrada strategije za razvoj webshopa': 'Creating a webshop development strategy',
  'Izrada webshopa': 'Building the webshop',
  'Analiza webshopa': 'Webshop analysis',
  'Prijevode': 'Translations',
  'Newsletter izrada': 'Newsletter creation',
  'programiranje': 'Programming',

  // q26 — team size
  '1 osoba iz tvrtke': '1 person from the company',
  '2-5 ljudi iz tvrtke': '2-5 people from the company',
  '5-10 ljudi iz tvrtke': '5-10 people from the company',
  'Više od 10 ljudi iz tvrtke': 'More than 10 people from the company',

  // q27 — average cart
  'Do 50 €': 'Up to €50',
  '50 do 100 €': '€50 to €100',
  '100 do 200€': '€100 to €200',
  '200 do 500€': '€200 to €500',
  '500 do 1000€': '€500 to €1,000',
  'Više od 1000€': 'More than €1,000',

  // q28 — web share
  'do 10%': 'up to 10%',
  '10 - 20 %': '10 - 20%',
  'Preko 20 %': 'Over 20%',
  '100% (prodajem isključivo online)': '100% (online only)',
  'ne znam / nisam siguran': "I don't know / not sure",

  // q29 — annual revenue
  'do 40.000 eura': 'up to €40,000',
  '40.000 - 100.000 eura': '€40,000 - €100,000',
  '100.000 - 200.000 eura': '€100,000 - €200,000',
  '200.000 - 500.000 eura': '€200,000 - €500,000',
  '500.000 - 1.000.000 eura': '€500,000 - €1,000,000',
  'Više od 1.000.000 eura': 'More than €1,000,000',

  // q30 — association member
  'Ne, ali planiram biti': 'No, but I plan to be',
}

export function translateOption(value: string): string {
  return optionValues[value] ?? value
}

export function translateLabel(label: string): string {
  return questionLabels[label] ?? label
}
