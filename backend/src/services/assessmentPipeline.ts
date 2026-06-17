import type { AssessmentResult, ProjectInput, GeoLocation, SystemOption } from '../types';
import { geocodeAddress, lookupGridOperator } from './geocoding';
import { calcTechnical } from './technicalCalc';
import { retrieveRelevantChunks } from './ragRetrieval';
import { callAssessmentLlm } from './llmService';

export async function runAssessmentPipeline(
  projectId: string,
  input: ProjectInput
): Promise<AssessmentResult> {
  // Step 1: Geocode address
  let geo: GeoLocation | null = null;
  try {
    geo = await geocodeAddress(input.address);
  } catch (e) {
    console.warn('Geocoding failed:', e);
  }

  // Step 2: Grid operator lookup
  let gridOperator = null;
  if (geo) {
    try {
      gridOperator = await lookupGridOperator(geo.lat, geo.lng);
    } catch (e) {
      console.warn('Grid operator lookup failed:', e);
    }
  }

  // Enrich input with resolved operator id
  if (gridOperator) {
    input = { ...input, gridOperatorId: gridOperator.id };
  }

  // Step 3: Technical pre-calculation
  const technicalSummary = calcTechnical(input);

  // Step 4 & 5: RAG retrieval
  const chunks = await retrieveRelevantChunks(input);

  // Step 6: LLM call
  let llmResult: Partial<AssessmentResult> & { rawLlmTrace: string };
  try {
    llmResult = await callAssessmentLlm(input, technicalSummary, gridOperator, chunks);
  } catch (e) {
    console.error('LLM call failed, using fallback:', e);
    // Fallback: return a minimal valid result if LLM is unavailable
    llmResult = buildFallbackResult(input.language ?? 'de');
  }

  // Step 7: Assemble final result
  const result: AssessmentResult = {
    projectId,
    generatedAt: new Date().toISOString(),
    gridOperator,
    technicalSummary,
    systemOptions: llmResult.systemOptions ?? buildFallbackOptions(technicalSummary.estimatedKwp, technicalSummary.recommendedStorageKwh),
    regulatoryClaims: llmResult.regulatoryClaims ?? [],
    subsidies: llmResult.subsidies ?? [],
    openPoints: llmResult.openPoints ?? [],
    nextSteps: llmResult.nextSteps ?? [],
    installerQuestions: llmResult.installerQuestions ?? [],
    trafficLight: llmResult.trafficLight ?? 'amber',
    rawLlmTrace: llmResult.rawLlmTrace,
  };

  return result;
}

function buildFallbackOptions(baseKwp: number, recBatteryKwh: number): SystemOption[] {
  const aKwp = Math.round(baseKwp * 0.6 * 2) / 2;
  const bKwp = Math.round(baseKwp * 0.85 * 2) / 2;
  const cKwp = Math.round(baseKwp * 1.1 * 2) / 2;
  const cBattery = Math.round(recBatteryKwh * 1.5 / 2.5) * 2.5;

  return [
    {
      label: 'A',
      name: 'Budget Optimized',
      tagline: 'Compact entry-level system, fastest payback',
      pvKwp: aKwp,
      batteryKwh: 0,
      inverterKw: aKwp,
      wallboxCompatible: true,
      heatPumpCompatible: false,
      ratings: { technicalEfficiency: 3, runningEfficiency: 3, economicValue: 5, regulatorySimplicity: 5, futureReadiness: 2 },
      estimatedInvestmentMin: Math.round(aKwp * 1200),
      estimatedInvestmentMax: Math.round(aKwp * 1500),
      estimatedAnnualProduction: Math.round(aKwp * 950 * 0.86),
      estimatedAnnualSavings: Math.round(aKwp * 950 * 0.86 * 0.35 * 0.35 + aKwp * 950 * 0.86 * 0.65 * 0.082),
      selfConsumptionPct: 35,
      summary: `A ${aKwp} kWp system covers your daytime consumption with no battery. All surplus is exported at the feed-in tariff. Lowest upfront cost with the fastest return on investment — ideal if budget is the primary concern.`,
    },
    {
      label: 'B',
      name: 'Balanced',
      tagline: 'Recommended — best cost, performance and future-proofing',
      pvKwp: bKwp,
      batteryKwh: recBatteryKwh,
      inverterKw: bKwp,
      wallboxCompatible: true,
      heatPumpCompatible: true,
      ratings: { technicalEfficiency: 4, runningEfficiency: 4, economicValue: 4, regulatorySimplicity: 4, futureReadiness: 4 },
      estimatedInvestmentMin: Math.round(bKwp * 1200 + recBatteryKwh * 650),
      estimatedInvestmentMax: Math.round(bKwp * 1500 + recBatteryKwh * 800),
      estimatedAnnualProduction: Math.round(bKwp * 950 * 0.86),
      estimatedAnnualSavings: Math.round(bKwp * 950 * 0.86 * 0.68 * 0.35 + bKwp * 950 * 0.86 * 0.32 * 0.082),
      selfConsumptionPct: 68,
      summary: `A ${bKwp} kWp system with a ${recBatteryKwh} kWh battery stores daytime surplus for evening use. This covers roughly 68% of your annual electricity needs from solar. The best balance of investment, savings, and future-proofing for most households.`,
    },
    {
      label: 'C',
      name: 'Energy Independence',
      tagline: 'Maximum self-sufficiency, largest system',
      pvKwp: cKwp,
      batteryKwh: cBattery,
      inverterKw: cKwp,
      wallboxCompatible: true,
      heatPumpCompatible: true,
      ratings: { technicalEfficiency: 5, runningEfficiency: 5, economicValue: 3, regulatorySimplicity: 3, futureReadiness: 5 },
      estimatedInvestmentMin: Math.round(cKwp * 1200 + cBattery * 650),
      estimatedInvestmentMax: Math.round(cKwp * 1500 + cBattery * 800),
      estimatedAnnualProduction: Math.round(cKwp * 950 * 0.86),
      estimatedAnnualSavings: Math.round(cKwp * 950 * 0.86 * 0.80 * 0.35 + cKwp * 950 * 0.86 * 0.20 * 0.082),
      selfConsumptionPct: 80,
      summary: `A ${cKwp} kWp system with a ${cBattery} kWh battery maximises energy independence, achieving around 80% self-consumption. Sized to support an EV wallbox and future heat pump. Higher upfront investment with the best long-term protection against rising electricity prices.`,
    },
  ];
}

function buildFallbackResult(language: 'de' | 'en'): Partial<AssessmentResult> & { rawLlmTrace: string } {
  if (language === 'en') {
    return {
      systemOptions: buildFallbackOptions(9.5, 10),
      regulatoryClaims: [
        {
          text: 'MaStR Registration (Mandatory)',
          detail: 'Within 1 month after commissioning · marktstammdatenregister.de',
          sourceRef: '§§3 No.1, 5 MaStRV · since 2017-07-01',
          sourceIds: ['mastr-rv'],
          status: 'valid',
        },
        {
          text: 'Grid connection request before installation (Mandatory)',
          detail: 'Notify the grid operator at least 4 weeks before commissioning',
          sourceRef: '§13 NAV · valid',
          sourceIds: ['nav-13'],
          status: 'valid',
        },
      ],
      subsidies: [
        {
          name: 'KfW 270 — Loan',
          shortName: 'KfW 270',
          status: 'valid',
          amount: 'up to EUR 150,000',
          description: '5–30 years · through your local bank · apply before commissioning!',
        },
      ],
      openPoints: [
        'LLM analysis not available — please check API key',
        'Request grid connection capacity from the grid operator',
      ],
      nextSteps: [
        { text: 'Submit grid connection request to the grid operator', priority: 'high' },
        { text: 'Apply for KfW 270 loan via local bank (before commissioning!)', priority: 'high' },
      ],
      installerQuestions: [
        'What technical requirements apply to this grid connection?',
        'How is the 70% active power limitation implemented according to VDE-AR-N 4105?',
      ],
      trafficLight: 'amber',
      rawLlmTrace: 'FALLBACK — LLM unavailable',
    };
  }

  return {
    systemOptions: buildFallbackOptions(9.5, 10),
    regulatoryClaims: [
      {
        text: 'MaStR-Registrierung (Pflicht)',
        detail: 'Binnen 1 Monat nach Inbetriebnahme · marktstammdatenregister.de',
        sourceRef: '§§3 Nr.1, 5 MaStRV · seit 01.07.2017',
        sourceIds: ['mastr-rv'],
        status: 'valid',
      },
      {
        text: 'Netzanmeldung vor Installation (Pflicht)',
        detail: 'Mindestens 4 Wochen vor Inbetriebnahme beim Netzbetreiber anzeigen',
        sourceRef: '§13 NAV · gültig',
        sourceIds: ['nav-13'],
        status: 'valid',
      },
    ],
    subsidies: [
      {
        name: 'KfW 270 — Kredit',
        shortName: 'KfW 270',
        status: 'valid',
        amount: 'bis 150.000 EUR',
        description: '5–30 Jahre · über Hausbank · vor Beauftragung beantragen!',
      },
    ],
    openPoints: [
      'LLM-Analyse nicht verfügbar — bitte API-Key prüfen',
      'Netzanschlusskapazität beim Netzbetreiber anfragen',
    ],
    nextSteps: [
      { text: 'Netzanschlussanfrage beim Netzbetreiber stellen', priority: 'high' },
      { text: 'KfW 270 über Hausbank beantragen (vor Beauftragung!)', priority: 'high' },
    ],
    installerQuestions: [
      'Welche technischen Anforderungen gelten für diesen Netzanschluss?',
      'Wie wird die 70%-Wirkleistungsbegrenzung nach VDE-AR-N 4105 umgesetzt?',
    ],
    trafficLight: 'amber',
    rawLlmTrace: 'FALLBACK — LLM unavailable',
  };
}
