import type { AssessmentResult } from '../types';

export const MOCK_ASSESSMENT: AssessmentResult = {
  projectId: 'mock-001',
  generatedAt: '2026-06-17T12:00:00Z',
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

export const CANNED_RESPONSES: Record<string, string> = {
  'Muss ich die Anlage anmelden?':
    '<strong>Ja — zwei Pflichten:</strong><br><br><strong>1. MaStR-Registrierung</strong><br>Binnen 1 Monat nach Inbetriebnahme (marktstammdatenregister.de)<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §§3 Nr.1, 5 MaStRV · 🟢 Aktuell seit 01.07.2017</span><br><br><strong>2. Netzanmeldung bei Avacon AG</strong><br>Mindestens 4 Wochen vor Installation<br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §13 NAV · 🟢 Aktuell · netz@avacon.de</span>',
  'Welche Förderung bekomme ich?':
    '<strong>Für Ihr Projekt:</strong><br><br>🟢 <strong>KfW 270</strong> — Kredit bis 150.000 EUR (aktiv, vor Beauftragung!)<br>🟡 <strong>KfW 442</strong> — ~300€/kWh Speicher (angekündigt, noch nicht aktiv)<br>🟢 <strong>§3 Nr.72 EStG</strong> — Steuerfreiheit automatisch (kein Antrag)<br><br><span style="font-size:10px;color:var(--color-text-warning)">⚠️ KfW 442 nicht in Planung einrechnen!</span>',
  'Muss ich Einnahmen versteuern?':
    '<strong>Nein</strong> — für Ihre 9,5-kWp-Anlage auf einem Einfamilienhaus gilt volle Steuerbefreiung.<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §3 Nr.72 EStG · 🟢 Aktuell seit 01.01.2023</span><br><br>Einspeisevergütung und Eigenverbrauch sind steuerfrei. Kein Antrag, kein Formular.',
  'Was gilt für meine Wallbox?':
    '<strong>§14a EnWG — Pflicht seit 01.01.2024:</strong><br><br>1. Wallbox &gt;3,7 kW muss technisch steuerbar sein<br>2. Anmeldung bei Avacon AG erforderlich<br>3. Als Gegenzug: reduzierte Netzentgelte<br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §14a EnWG · 🟢 Aktuell seit 01.01.2024</span>',
  'Wie hoch ist meine Einspeisevergütung?':
    '<strong>Aktuelle Vergütungssätze (EEG 2023):</strong><br><br>≤10 kWp: <strong>8,2 ct/kWh</strong><br>10–40 kWp: 7,1 ct/kWh<br><br>Für Ihre 9,5-kWp-Anlage: ~8,2 ct/kWh<br>Eingespeiste ~3.500 kWh × 8,2 ct = ca. <strong>287 EUR/Jahr</strong><br><br><span style="font-size:10px;color:var(--color-text-secondary)">📖 §21 EEG 2023 · 🟢 Aktuell</span><br><span style="font-size:10px;color:var(--color-text-warning)">🟡 EEG-Reform 2027 angekündigt</span>',
};
