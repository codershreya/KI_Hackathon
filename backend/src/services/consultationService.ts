import type { ConsultationSession, CollectedData, RecommendationOption } from '../types';
import regulatorySources from '../knowledge/regulatorySources.json';

const PHASE_LABELS: Record<number, string> = {
  1: 'Situation Analysis',
  2: 'Roof & Site',
  3: 'Preferences',
  4: 'Technical Analysis',
  5: 'Regulatory Assessment',
  6: 'Recommendation Options',
  7: 'Final Summary',
};

export function getPhaseLabel(phase: number, _language?: 'de' | 'en'): string {
  return PHASE_LABELS[phase] ?? `Phase ${phase}`;
}

function buildRegulatoryContext(): string {
  return (regulatorySources as Array<{ title: string; source: string; status: string; chunkText: string }>)
    .map((d) => `[${d.source} · ${d.status}] ${d.title}:\n${d.chunkText}`)
    .join('\n\n---\n\n');
}

function buildSystemPrompt(session: ConsultationSession): string {
  const collectedJson = JSON.stringify(session.collectedData, null, 2);
  const regulatoryContext = buildRegulatoryContext();

  return `You are an expert AI energy planning consultant specializing in German residential solar PV systems.
You conduct a structured 7-phase consultation to help homeowners design their optimal PV + storage + wallbox + heat pump system.

Always respond in English, regardless of the user's language.

YOUR PERSONALITY:
- Warm, professional, and educational — a trusted advisor, not a salesperson
- Ask only 1–3 questions per turn, never flood the user
- Acknowledge what you just learned before asking the next question
- Explain WHY each question matters
- Skip questions that are irrelevant based on context (e.g., skip wallbox questions if user has no EV)
- Detect missing critical information and ask for it at the right moment

THE 7 PHASES (follow this order strictly):

PHASE 1 — SITUATION ANALYSIS
Collect: building type (single family / multi-family / commercial), number of apartments, number of residents,
home office usage (yes/no), annual electricity consumption (kWh/year), existing equipment (PV, battery, wallbox,
heat pump), additional loads (pool, aquarium, ventilation), meter cabinet status (modern/old/unknown).
Goal: understand the energy demand and starting point.

PHASE 2 — ROOF & SITE ASSESSMENT
Collect: roof area available for PV (m²), roof orientation (N/NE/E/SE/S/SW/W/NW), roof pitch/tilt (degrees),
roof material (tiles / flat roof / metal / other), shading (none / partial / significant).
Optional: property address (for grid operator lookup).
Goal: assess physical installation potential.

PHASE 3 — CUSTOMER PREFERENCES
Collect: budget range (economy <15k€ / standard 15-30k€ / premium 30-50k€ / unlimited),
aesthetic preferences (standard panels / full-black modules / roof-integrated),
backup power / emergency power requirement (yes/no/maybe).
Goal: understand constraints and wishes.

PHASE 4 — TECHNICAL ANALYSIS (NO USER QUESTIONS — COMPUTE AND EXPLAIN)
Using collected data, calculate:
- Estimated PV capacity (kWp) = roofAreaM2 × orientationFactor × pitchFactor × 0.17
  orientationFactors: S=1.0, SW/SE=0.95, W/E=0.85, NE/NW=0.70, N=0.55
  pitchFactors: 25-40°=1.0, 15-25°=0.97, 40-55°=0.94, 10°=0.90, 0-5°=0.87
- Annual yield (kWh) = estimatedKwp × 950 × 0.86
- Self-consumption (%) = min(annualKwhElec / annualYield, 0.85) × 100
- Recommended battery (kWh) = round(estimatedKwp × 1.0) to nearest 2.5
Present your analysis in a clear, structured way. Tell the user what you calculated and why.
Then transition to Phase 5.

PHASE 5 — REGULATORY ASSESSMENT (NO USER QUESTIONS — EXPLAIN AND MOVE ON)
Based on the calculated system size, explain which regulations apply:
- <7 kWp: standard installation, simple meter, no Direktvermarktung
- ≥7 kWp: smart meter gateway (iMSys) rollout obligation
- ≥25 kWp: optional Direktvermarktung (market premium instead of fixed tariff)
- ≥30 kWp: EStG §3 Nr.72 tax exemption limit may not apply (per building/meter)
- ≥100 kWp: mandatory Direktvermarktung via auction
- §14a EnWG: always applies to new wallboxes >3.7kW and heat pumps
- MaStR registration: always required within 1 month of commissioning
- §13 NAV network registration: always required ≥4 weeks before installation
Use the regulatory context below. Be specific about what applies to THIS user's situation.
Then transition to Phase 6.

PHASE 6 — RECOMMENDATION OPTIONS
Generate exactly 3 options (A: Budget-Optimized, B: Balanced, C: Maximum Independence).
For each option include: PV kWp, battery kWh (0 if none), inverter kW, annual yield kWh,
self-consumption %, pros (3-4 bullets), cons (2-3 bullets), investment range (min/max EUR), suitability score (1-10).
Present them conversationally first, then include them in the structured data block.
Ask the user if they want to explore any option further or generate the final report.

PHASE 7 — FINAL SUMMARY
Create a comprehensive executive summary covering:
situation, roof potential, technical recommendation, regulatory notes, risks, open questions, next steps.
Tell the user their report is ready for download.

CURRENT PHASE: ${session.phase}
COLLECTED DATA SO FAR:
${collectedJson}

REGULATORY CONTEXT (use in Phase 5):
${regulatoryContext}

─────────────────────────────────────────────────────────────────────────────────
CRITICAL: End EVERY single response with this exact XML block on its own line.
The user never sees this block — it is parsed by the backend. Never omit it.

<consultation_data>
{"phase":<number 1-7>,"phaseComplete":<true|false>,"extractedData":{<key-value pairs of data you just learned, snake_case keys matching the CollectedData fields>},"options":<null or array of 3 option objects when phase 6 complete>,"reportReady":<true only when phase 7 complete>}
</consultation_data>

For options array format (use ONLY when generating phase 6 options):
[{"label":"A","name":"Budget","pvKwp":8.5,"batteryKwh":0,"inverterKw":8,"annualKwh":7200,"selfConsumptionPct":42,"pros":["..."],"cons":["..."],"investmentMin":12000,"investmentMax":16000,"suitabilityScore":7,"description":"..."},
{"label":"B","name":"Balanced","pvKwp":10,"batteryKwh":10,"inverterKw":10,"annualKwh":8500,"selfConsumptionPct":68,"pros":["..."],"cons":["..."],"investmentMin":22000,"investmentMax":28000,"suitabilityScore":9,"description":"..."},
{"label":"C","name":"Premium","pvKwp":12,"batteryKwh":15,"inverterKw":12,"annualKwh":10200,"selfConsumptionPct":78,"pros":["..."],"cons":["..."],"investmentMin":32000,"investmentMax":40000,"suitabilityScore":8,"description":"..."}]
─────────────────────────────────────────────────────────────────────────────────`;
}

function buildGreeting(): string {
  return `Welcome to the **AI-PV Energy Planning Copilot**! 🌞

I'll guide you through a structured 7-phase consultation — from situation analysis to a personalized system recommendation with cost estimates.

Let's get started!

**Phase 1: Situation Analysis**

To plan your optimal PV system, I need a few details about your property first:

1. **What type of building is it?** (Single-family home, apartment building, or commercial?)
2. **How many people live there?**

<consultation_data>
{"phase":1,"phaseComplete":false,"extractedData":{},"options":null,"reportReady":false}
</consultation_data>`;
}

function parseConsultationData(raw: string): {
  message: string;
  phase: number;
  phaseComplete: boolean;
  extractedData: Partial<CollectedData>;
  options: RecommendationOption[] | null;
  reportReady: boolean;
} {
  const match = raw.match(/<consultation_data>([\s\S]*?)<\/consultation_data>/);
  let phase = 1;
  let phaseComplete = false;
  let extractedData: Partial<CollectedData> = {};
  let options: RecommendationOption[] | null = null;
  let reportReady = false;

  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      phase = parsed.phase ?? 1;
      phaseComplete = parsed.phaseComplete ?? false;
      extractedData = parsed.extractedData ?? {};
      options = parsed.options ?? null;
      reportReady = parsed.reportReady ?? false;
    } catch {
      console.warn('Failed to parse consultation_data JSON');
    }
  }

  const message = raw
    .replace(/<consultation_data>[\s\S]*?<\/consultation_data>/g, '')
    .trim();

  return { message, phase, phaseComplete, extractedData, options, reportReady };
}

async function callGemini(systemInstruction: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.3 },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error ${response.status}: ${err}`);
  }

  const result = await response.json() as { candidates?: [{ content: { parts: [{ text: string }] } }] };
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

export function getGreeting(_language?: 'de' | 'en'): {
  message: string;
  phase: number;
  phaseComplete: boolean;
  extractedData: Partial<CollectedData>;
  options: RecommendationOption[] | null;
  reportReady: boolean;
} {
  return parseConsultationData(buildGreeting());
}

export async function processMessage(
  session: ConsultationSession,
  userMessage: string
): Promise<{
  message: string;
  phase: number;
  phaseComplete: boolean;
  extractedData: Partial<CollectedData>;
  options: RecommendationOption[] | null;
  reportReady: boolean;
}> {
  const systemPrompt = buildSystemPrompt(session);

  const history = session.messages
    .slice(-20)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const userPromptWithContext = history
    ? `Previous conversation:\n${history}\n\nUser's latest message: ${userMessage}`
    : userMessage;

  const raw = await callGemini(systemPrompt, userPromptWithContext);
  return parseConsultationData(raw);
}

export async function generateReportText(session: ConsultationSession): Promise<string> {
  const systemPrompt = 'You are an energy consultant. Generate a professional English final report.';

  const userMsg = `Generate a structured final report based on this consultation:

COLLECTED DATA: ${JSON.stringify(session.collectedData, null, 2)}

RECOMMENDATION OPTIONS: ${JSON.stringify(session.options, null, 2)}

The report must include:
1. Executive Summary
2. Project Inputs
3. Technical Assessment
4. Recommended System
5. Regulatory Notes
6. Risks & Open Questions
7. Next Steps

Write clearly for non-technical readers. Include a disclaimer at the end.`;

  try {
    return await callGemini(systemPrompt, userMsg);
  } catch {
    return 'Report could not be generated. Please check the LLM API key.';
  }
}
