import type { AssessmentResult } from '../types';

export const MOCK_ASSESSMENT: AssessmentResult = {
  projectId: 'mock-001',
  generatedAt: '2026-06-17T12:00:00Z',
  systemOptions: [
    {
      label: 'A',
      name: 'Budget Optimized',
      tagline: 'Compact entry-level system, fastest payback',
      pvKwp: 6.0,
      batteryKwh: 0,
      inverterKw: 6,
      wallboxCompatible: true,
      heatPumpCompatible: false,
      ratings: { technicalEfficiency: 3, runningEfficiency: 3, economicValue: 5, regulatorySimplicity: 5, futureReadiness: 2 },
      estimatedInvestmentMin: 7200,
      estimatedInvestmentMax: 9000,
      estimatedAnnualProduction: 4907,
      estimatedAnnualSavings: 940,
      selfConsumptionPct: 35,
      summary: 'A compact 6 kWp system covers daytime consumption without a battery. All surplus is exported at the feed-in tariff. The lowest upfront cost makes this the fastest to pay back — ideal for budget-conscious homeowners who plan to upgrade later.',
    },
    {
      label: 'B',
      name: 'Balanced',
      tagline: 'Recommended — best cost, performance and future-proofing',
      pvKwp: 8.5,
      batteryKwh: 10,
      inverterKw: 8,
      wallboxCompatible: true,
      heatPumpCompatible: true,
      ratings: { technicalEfficiency: 4, runningEfficiency: 4, economicValue: 4, regulatorySimplicity: 4, futureReadiness: 4 },
      estimatedInvestmentMin: 16700,
      estimatedInvestmentMax: 20750,
      estimatedAnnualProduction: 6951,
      estimatedAnnualSavings: 1650,
      selfConsumptionPct: 68,
      summary: 'An 8.5 kWp system with a 10 kWh battery stores daytime surplus for evening use, covering roughly 68% of your annual electricity needs from solar. The best balance of investment, savings, and future-proofing for a family home with a wallbox.',
    },
    {
      label: 'C',
      name: 'Energy Independence',
      tagline: 'Maximum self-sufficiency, largest system',
      pvKwp: 11.0,
      batteryKwh: 15,
      inverterKw: 10,
      wallboxCompatible: true,
      heatPumpCompatible: true,
      ratings: { technicalEfficiency: 5, runningEfficiency: 5, economicValue: 3, regulatorySimplicity: 3, futureReadiness: 5 },
      estimatedInvestmentMin: 23000,
      estimatedInvestmentMax: 28500,
      estimatedAnnualProduction: 8997,
      estimatedAnnualSavings: 2250,
      selfConsumptionPct: 80,
      summary: 'An 11 kWp system with a 15 kWh battery achieves around 80% self-consumption. Sized to support a wallbox and future heat pump, this option provides maximum protection against rising electricity prices with the highest long-term energy independence.',
    },
  ],
  gridOperator: {
    id: 'avacon',
    name: 'Avacon AG',
    city: '30161 Hannover',
    state: 'Niedersachsen',
    portalUrl: 'https://netz.avacon.de',
    email: 'netz@avacon.de',
  },
  technicalSummary: {
    estimatedKwp: 9.5,
    moduleCountMin: 18,
    moduleCountMax: 22,
    annualKwh: 9200,
    selfConsumptionPct: 62,
    selfConsumptionWithStoragePct: 78,
    recommendedStorageKwh: 10,
    roofScore: 8.5,
    orientation: 'Süd',
    confidence: 'medium',
    notes: [
      'Kamin erkannt (ca. 2 Module abzuziehen)',
      'keine signifikante Verschattung',
    ],
  },
  regulatoryClaims: [
    {
      text: 'MaStR-Registrierung (Pflicht)',
      detail: 'Binnen 1 Monat nach Inbetriebnahme · marktstammdatenregister.de',
      sourceRef: '§§3 Nr.1, 5 MaStRV · seit 01.07.2017',
      sourceIds: ['mastr-rv'],
      status: 'valid',
    },
    {
      text: 'Steuerbefreiung ≤30 kWp (Einfamilienhaus)',
      detail: 'Einspeisung + Eigenverbrauch steuerfrei · kein Antrag nötig',
      sourceRef: '§3 Nr.72 EStG · seit 01.01.2023',
      sourceIds: ['estg-3-72'],
      status: 'valid',
    },
    {
      text: 'Netzanmeldung vor Installation (Pflicht)',
      detail: 'Mindestens 4 Wochen vor Inbetriebnahme bei Avacon AG anzeigen',
      sourceRef: '§13 NAV · gültig · netz@avacon.de',
      sourceIds: ['nav-13'],
      status: 'valid',
    },
    {
      text: 'VDE-AR-N 4105 — technische Anforderungen',
      detail: '70%-Wirkleistungsbegrenzung oder Smart-Meter-Gateway',
      sourceRef: 'VDE-AR-N 4105:2018-11 · seit 01.11.2018',
      sourceIds: ['vde-arn-4105'],
      status: 'valid',
    },
    {
      text: '§14a EnWG — Wallbox Steuerbarkeit (Pflicht)',
      detail: 'Wallbox >3,7 kW muss steuerbar sein · Anmeldung bei Avacon + reduzierte Netzentgelte',
      sourceRef: '§14a EnWG · seit 01.01.2024',
      sourceIds: ['enwg-14a'],
      status: 'valid',
    },
    {
      text: 'KfW 442 Heimspeicher 2026',
      detail: '~300 €/kWh Zuschuss angekündigt — Programm noch NICHT aktiv!',
      sourceRef: 'KfW Pressemitteilung · noch kein Programmstart',
      sourceIds: ['kfw-442'],
      status: 'announced',
    },
    {
      text: 'EEG-Reform 2027 — Einspeisevergütung',
      detail: 'Abschaffung fixer Tarife geplant · bestehende Anlagen 20 Jahre geschützt',
      sourceRef: 'BMWK Referentenentwurf 2026 · noch kein Gesetz',
      sourceIds: ['eeg-reform-2027'],
      status: 'announced',
    },
  ],
  subsidies: [
    {
      name: 'KfW 270 — Kredit',
      shortName: 'KfW 270',
      status: 'valid',
      amount: 'bis 150.000 EUR',
      description: '5–30 Jahre · über Hausbank · vor Beauftragung!',
    },
    {
      name: 'KfW 442 — Speicher',
      shortName: 'KfW 442',
      status: 'announced',
      amount: '~300 €/kWh',
      description: 'Noch nicht aktiv — nicht einrechnen!',
      warning: 'Noch nicht aktiv — nicht einrechnen!',
    },
    {
      name: '§3 Nr.72 EStG',
      shortName: 'EStG',
      status: 'valid',
      amount: 'Steuerfreiheit',
      description: 'Alle Einnahmen steuerfrei · kein Antrag',
    },
    {
      name: '§14a Netzentgelt',
      shortName: '§14a',
      status: 'valid',
      amount: 'Reduziert',
      description: 'Automatisch für steuerbare Wallbox/WP',
    },
  ],
  openPoints: [
    'Netzanschlusskapazität bei Avacon AG am Standort unbekannt',
    'Messkonzept (Zweirichtungszähler vs. Summenzähler) noch nicht gewählt',
    'Genaue Dachmaße unbestätigt — Fachbetrieb-Aufmaß empfohlen',
  ],
  nextSteps: [
    { text: 'Netzanschlussanfrage bei Avacon AG stellen (sofort, vor Installation)', priority: 'high' },
    { text: '3 Installateurangebote einholen — diesen Bericht mitbringen', priority: 'high' },
    { text: 'KfW 270 über Hausbank beantragen (vor Beauftragung!)', priority: 'high' },
    { text: 'KfW 442 Programmstart überwachen unter kfw.de', priority: 'medium' },
    { text: 'Nach Inbetriebnahme: MaStR-Registrierung binnen 30 Tagen', priority: 'high' },
  ],
  installerQuestions: [
    'Können Sie die Netzanschlusskapazität bei **Avacon AG** für diesen Standort vorab prüfen?',
    'Welches Messkonzept empfehlen Sie — Zweirichtungszähler oder Summenzähler?',
    'Wie ist die **11-kW-Wallbox** gemäß §14a EnWG technisch steuerbar ausgeführt?',
    'Ist das Angebot mit dem **KfW 270** Kredit kompatibel?',
    'Welche Garantie gilt separat für Wechselrichter, Module und Speicher?',
    'Wie wird die **70%-Wirkleistungsbegrenzung** nach VDE-AR-N 4105 umgesetzt?',
  ],
  trafficLight: 'green',
};

export const CANNED_RESPONSES: Record<string, { de: string; en: string }> = {
  // German keys
  'Muss ich die Anlage anmelden?': {
    de: '<strong>Ja — zwei Pflichten:</strong><br><br><strong>1. MaStR-Registrierung</strong><br>Binnen 1 Monat nach Inbetriebnahme (marktstammdatenregister.de)<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 Nr.1, 5 MaStRV · 🟢 Aktuell seit 01.07.2017</span><br><br><strong>2. Netzanmeldung bei Avacon AG</strong><br>Mindestens 4 Wochen vor Installation<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Aktuell · netz@avacon.de</span>',
    en: '<strong>Yes — two obligations:</strong><br><br><strong>1. MaStR registration</strong><br>Within 1 month after commissioning (marktstammdatenregister.de)<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 No.1, 5 MaStRV · 🟢 Current since 01.07.2017</span><br><br><strong>2. Network registration with Avacon AG</strong><br>At least 4 weeks before installation<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Current · netz@avacon.de</span>'
  },
  'Welche Förderung bekomme ich?': {
    de: '<strong>Für Ihr Projekt:</strong><br><br>🟢 <strong>KfW 270</strong> — Kredit bis 150.000 EUR (aktiv, vor Beauftragung!)<br>🟡 <strong>KfW 442</strong> — ~300€/kWh Speicher (angekündigt, noch nicht aktiv)<br>🟢 <strong>§3 Nr.72 EStG</strong> — Steuerfreiheit automatisch (kein Antrag)<br><br><span style="font-size:10px;color:var(--color-text-warning)">⚠️ KfW 442 nicht in Planung einrechnen!</span>',
    en: '<strong>For your project:</strong><br><br>🟢 <strong>KfW 270</strong> — Loan up to EUR 150,000 (active, before commissioning!)<br>🟡 <strong>KfW 442</strong> — ~300€/kWh battery storage (announced, not yet active)<br>🟢 <strong>§3 No.72 EStG</strong> — Tax exemption automatically (no application)<br><br><span style="font-size:10px;color:var(--color-text-warning)">⚠️ Do not include KfW 442 in your planning!</span>'
  },
  'Muss ich Einnahmen versteuern?': {
    de: '<strong>Nein</strong> — für Ihre 9,5-kWp-Anlage auf einem Einfamilienhaus gilt volle Steuerbefreiung.<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §3 Nr.72 EStG · 🟢 Aktuell seit 01.01.2023</span><br><br>Einspeisevergütung und Eigenverbrauch sind steuerfrei. Kein Antrag, kein Formular.',
    en: '<strong>No</strong> — full tax exemption applies to your 9.5 kWp system on a single-family home.<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §3 No.72 EStG · 🟢 Current since 01.01.2023</span><br><br>Feed-in tariff and self-consumption are tax-free. No application, no form required.'
  },
  'Was gilt für meine Wallbox?': {
    de: '<strong>§14a EnWG — Pflicht seit 01.01.2024:</strong><br><br>1. Wallbox &gt;3,7 kW muss technisch steuerbar sein<br>2. Anmeldung bei Avacon AG erforderlich<br>3. Als Gegenzug: reduzierte Netzentgelte<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §14a EnWG · 🟢 Aktuell seit 01.01.2024</span>',
    en: '<strong>§14a EnWG — Mandatory since 01.01.2024:</strong><br><br>1. Wallbox &gt;3.7 kW must be technically controllable<br>2. Registration with Avacon AG required<br>3. In return: reduced grid fees<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §14a EnWG · 🟢 Current since 01.01.2024</span>'
  },
  'Wie hoch ist meine Einspeisevergütung?': {
    de: '<strong>Aktuelle Vergütungssätze (EEG 2023):</strong><br><br>≤10 kWp: <strong>8,2 ct/kWh</strong><br>10–40 kWp: 7,1 ct/kWh<br><br>Für Ihre 9,5-kWp-Anlage: ~8,2 ct/kWh<br>Eingespeiste ~3.500 kWh × 8,2 ct = ca. <strong>287 EUR/Jahr</strong><br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §21 EEG 2023 · 🟢 Aktuell</span><br><span style="font-size:10px;color:var(--color-text-warning)">🟡 EEG-Reform 2027 angekündigt</span>',
    en: '<strong>Current feed-in tariffs (EEG 2023):</strong><br><br>≤10 kWp: <strong>8.2 ct/kWh</strong><br>10–40 kWp: 7.1 ct/kWh<br><br>For your 9.5 kWp system: ~8.2 ct/kWh<br>Fed-in ~3,500 kWh × 8.2 ct = approx. <strong>287 EUR/year</strong><br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §21 EEG 2023 · 🟢 Current</span><br><span style="font-size:10px;color:var(--color-text-warning)">🟡 EEG reform 2027 announced</span>'
  },

  // English keys
  'Do I have to register my PV system?': {
    de: '<strong>Ja — zwei Pflichten:</strong><br><br><strong>1. MaStR-Registrierung</strong><br>Binnen 1 Monat nach Inbetriebnahme (marktstammdatenregister.de)<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 Nr.1, 5 MaStRV · 🟢 Aktuell seit 01.07.2017</span><br><br><strong>2. Netzanmeldung bei Avacon AG</strong><br>Mindestens 4 Wochen vor Installation<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Aktuell · netz@avacon.de</span>',
    en: '<strong>Yes — two obligations:</strong><br><br><strong>1. MaStR registration</strong><br>Within 1 month after commissioning (marktstammdatenregister.de)<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 No.1, 5 MaStRV · 🟢 Current since 01.07.2017</span><br><br><strong>2. Network registration with Avacon AG</strong><br>At least 4 weeks before installation<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Current · netz@avacon.de</span>'
  },
  'Which subsidies do I get?': {
    de: '<strong>Für Ihr Projekt:</strong><br><br>🟢 <strong>KfW 270</strong> — Kredit bis 150.000 EUR (aktiv, vor Beauftragung!)<br>🟡 <strong>KfW 442</strong> — ~300€/kWh Speicher (angekündigt, noch nicht aktiv)<br>🟢 <strong>§3 Nr.72 EStG</strong> — Steuerfreiheit automatisch (kein Antrag)<br><br><span style="font-size:10px;color:var(--color-text-warning)">⚠️ KfW 442 nicht in Planung einrechnen!</span>',
    en: '<strong>For your project:</strong><br><br>🟢 <strong>KfW 270</strong> — Loan up to EUR 150,000 (active, before commissioning!)<br>🟡 <strong>KfW 442</strong> — ~300€/kWh battery storage (announced, not yet active)<br>🟢 <strong>§3 No.72 EStG</strong> — Tax exemption automatically (no application)<br><br><span style="font-size:10px;color:var(--color-text-warning)">⚠️ Do not include KfW 442 in your planning!</span>'
  },
  'Do I have to pay tax on income?': {
    de: '<strong>Nein</strong> — für Ihre 9,5-kWp-Anlage auf einem Einfamilienhaus gilt volle Steuerbefreiung.<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §3 Nr.72 EStG · 🟢 Aktuell seit 01.01.2023</span><br><br>Einspeisevergütung und Eigenverbrauch sind steuerfrei. Kein Antrag, kein Formular.',
    en: '<strong>No</strong> — full tax exemption applies to your 9.5 kWp system on a single-family home.<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §3 No.72 EStG · 🟢 Current since 01.01.2023</span><br><br>Feed-in tariff and self-consumption are tax-free. No application, no form required.'
  },
  'What rules apply to my wallbox?': {
    de: '<strong>§14a EnWG — Pflicht seit 01.01.2024:</strong><br><br>1. Wallbox &gt;3,7 kW muss technisch steuerbar sein<br>2. Anmeldung bei Avacon AG erforderlich<br>3. Als Gegenzug: reduzierte Netzentgelte<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §14a EnWG · 🟢 Aktuell seit 01.01.2024</span>',
    en: '<strong>§14a EnWG — Mandatory since 01.01.2024:</strong><br><br>1. Wallbox &gt;3.7 kW must be technically controllable<br>2. Registration with Avacon AG required<br>3. In return: reduced grid fees<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §14a EnWG · 🟢 Current since 01.01.2024</span>'
  },
  'How high is my feed-in tariff?': {
    de: '<strong>Aktuelle Vergütungssätze (EEG 2023):</strong><br><br>≤10 kWp: <strong>8,2 ct/kWh</strong><br>10–40 kWp: 7,1 ct/kWh<br><br>Für Ihre 9,5-kWp-Anlage: ~8,2 ct/kWh<br>Eingespeiste ~3.500 kWh × 8,2 ct = ca. <strong>287 EUR/Jahr</strong><br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §21 EEG 2023 · 🟢 Aktuell</span><br><span style="font-size:10px;color:var(--color-text-warning)">🟡 EEG-Reform 2027 angekündigt</span>',
    en: '<strong>Current feed-in tariffs (EEG 2023):</strong><br><br>≤10 kWp: <strong>8.2 ct/kWh</strong><br>10–40 kWp: 7.1 ct/kWh<br><br>For your 9.5 kWp system: ~8.2 ct/kWh<br>Fed-in ~3,500 kWh × 8.2 ct = approx. <strong>287 EUR/year</strong><br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §21 EEG 2023 · 🟢 Current</span><br><span style="font-size:10px;color:var(--color-text-warning)">🟡 EEG reform 2027 announced</span>'
  }
};
