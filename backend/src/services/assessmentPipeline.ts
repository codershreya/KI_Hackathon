import type { AssessmentResult, ProjectInput, GeoLocation } from '../types';
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
    llmResult = buildFallbackResult();
  }

  // Step 7: Assemble final result
  const result: AssessmentResult = {
    projectId,
    generatedAt: new Date().toISOString(),
    gridOperator,
    technicalSummary,
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

function buildFallbackResult(): Partial<AssessmentResult> & { rawLlmTrace: string } {
  return {
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
