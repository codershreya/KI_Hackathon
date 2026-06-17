import type {
  AssessmentResult,
  ProjectInput,
  RetrievedChunk,
  TechnicalSummary,
  GridOperator,
  SystemOption,
} from '../types';

const MODEL = 'gemini-2.5-flash-lite';

async function callGemini(
  systemInstruction: string,
  userMessage: string,
  responseMimeType?: 'application/json'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('GEMINI_API_KEY or ANTHROPIC_API_KEY is not defined or is a placeholder in environment variables');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.1, responseMimeType },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const result = await response.json() as { candidates?: [{ content: { parts: [{ text: string }] } }] };
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');
  return text;
}

function buildSystemPrompt(): string {
  return `You are an expert AI assistant for solar PV energy planning in Germany.
Your task is to analyse a homeowner's PV project and produce a structured JSON assessment.

RULES:
1. Output ONLY valid JSON matching the schema — no prose, no markdown wrapper.
2. For every regulatory claim cite the chunkId(s) from the retrieved context in sourceIds[].
3. Set status to: "valid" (currently in force), "announced" (legislated but not effective yet),
   "transitional" (in force for existing installs only), "expired", or "unclear".
4. NEVER assert regulatory facts not present in the retrieved context. Use status="unclear" instead.
5. Write at layperson level. Add technicalNote for expert details.
6. Always respond in English.

SYSTEM OPTIONS INSTRUCTIONS:
Generate exactly 3 options in systemOptions[], using the technical pre-calculation as baseline kWp:
- Option A "Budget Optimized": ~60% of baseline kWp, NO battery (batteryKwh=0), lowest cost, fastest ROI
- Option B "Balanced": ~85% of baseline kWp, battery = recommendedStorageKwh, best cost/performance/future-proofing balance
- Option C "Energy Independence": ~110% of baseline kWp, battery = 1.5× recommendedStorageKwh, maximum self-consumption

PRICING GUIDELINES (EUR):
- PV system: 1,200–1,500 EUR/kWp installed
- Battery storage: 650–800 EUR/kWh installed
- Annual savings = (production × selfConsumptionPct/100 × 0.35 EUR/kWh) + (production × (1−selfConsumptionPct/100) × 0.082 EUR/kWh)
- selfConsumptionPct: Option A ~35%, Option B ~68% (with battery), Option C ~80% (with large battery)

RATINGS GUIDE (1–5 stars):
- technicalEfficiency: how well the system uses roof potential (A=3, B=4, C=5)
- runningEfficiency: expected self-consumption and operational performance (A=3, B=4, C=5)
- economicValue: return on investment quality (A=5, B=4, C=3)
- regulatorySimplicity: complexity of compliance for this system size (A=5, B=4, C=3 if >10kWp)
- futureReadiness: ability to add EV, heat pump, upgrades (A=2, B=4, C=5)

OUTPUT SCHEMA (return this exact JSON structure):
{
  "systemOptions": [
    {
      "label": "A",
      "name": "Budget Optimized",
      "tagline": "one-line tagline",
      "pvKwp": number,
      "batteryKwh": 0,
      "inverterKw": number,
      "wallboxCompatible": boolean,
      "heatPumpCompatible": boolean,
      "ratings": {
        "technicalEfficiency": 1-5,
        "runningEfficiency": 1-5,
        "economicValue": 1-5,
        "regulatorySimplicity": 1-5,
        "futureReadiness": 1-5
      },
      "estimatedInvestmentMin": number,
      "estimatedInvestmentMax": number,
      "estimatedAnnualProduction": number,
      "estimatedAnnualSavings": number,
      "selfConsumptionPct": number,
      "summary": "2-3 sentence explanation of why this option was generated and its key trade-offs"
    },
    { "label": "B", "name": "Balanced", ... },
    { "label": "C", "name": "Energy Independence", ... }
  ],
  "regulatoryClaims": [
    {
      "text": "short title",
      "detail": "explanation in plain language",
      "sourceRef": "§ reference · since date",
      "sourceIds": ["chunk-id"],
      "status": "valid|announced|transitional|expired|unclear",
      "uncertainty": "optional note if unclear",
      "technicalNote": "optional expert detail"
    }
  ],
  "subsidies": [
    {
      "name": "full name",
      "shortName": "abbreviation",
      "status": "valid|announced",
      "amount": "amount string",
      "description": "one-line description",
      "warning": "optional warning text"
    }
  ],
  "openPoints": ["list of items needing professional verification"],
  "nextSteps": [
    { "text": "action", "priority": "high|medium|low" }
  ],
  "installerQuestions": ["question with **bold** for key terms"],
  "trafficLight": "green|amber|red"
}`;
}

function buildUserMessage(
  input: ProjectInput,
  tech: TechnicalSummary,
  operator: GridOperator | null,
  chunks: RetrievedChunk[]
): string {
  const chunksText = chunks
    .map(
      (c) =>
        `[CHUNK ${c.id}] ${c.title} (${c.source} · ${c.status} · from ${c.validFrom}${c.validUntil ? ` until ${c.validUntil}` : ''}):\n${c.text}`
    )
    .join('\n\n---\n\n');

  return `PROJECT INPUT:
${JSON.stringify(input, null, 2)}

TECHNICAL PRE-CALCULATION:
- Baseline estimated system size: ${tech.estimatedKwp} kWp (use as baseline for option sizing)
- Module count: ${tech.moduleCountMin}–${tech.moduleCountMax}
- Annual yield at baseline: ${tech.annualKwh} kWh
- Self-consumption without storage: ${tech.selfConsumptionPct}%
- Self-consumption with storage: ${tech.selfConsumptionWithStoragePct}%
- Recommended battery storage: ${tech.recommendedStorageKwh} kWh
- Roof score: ${tech.roofScore}/10

GRID OPERATOR: ${operator ? `${operator.name}, ${operator.city}, ${operator.state}` : 'Unknown'}

REGULATORY CONTEXT CHUNKS:
${chunksText}

Generate the JSON assessment. For systemOptions: use ${tech.estimatedKwp} kWp as baseline.
Focus regulatory claims on this project (building: ${input.buildingType}, components: PV${input.planStorage ? '+storage' : ''}${input.planWallbox ? '+wallbox' : ''}${input.planHeatPump ? '+heat_pump' : ''}).`;
}

export async function callAssessmentLlm(
  input: ProjectInput,
  tech: TechnicalSummary,
  operator: GridOperator | null,
  chunks: RetrievedChunk[]
): Promise<Partial<AssessmentResult> & { rawLlmTrace: string }> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input, tech, operator, chunks);

  const rawText = await callGemini(systemPrompt, userMessage, 'application/json');

  let parsed: Partial<AssessmentResult>;
  try {
    const jsonStr = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch {
    console.error('LLM JSON parse error. Raw output:', rawText);
    throw new Error('LLM returned invalid JSON');
  }

  return { ...parsed, rawLlmTrace: rawText };
}

export async function answerChatQuestion(
  _projectId: string,
  question: string,
  context: Record<string, unknown>,
  language?: 'de' | 'en',
  selectedOption?: SystemOption
): Promise<{ answer: string; sources: string[] }> {
  const systemPrompt =
    'You are a German solar PV energy planning expert. Answer concisely in English.\n' +
    'Always cite your sources with §-references. End with a short disclaimer that this is not legal advice.';

  const optionContext = selectedOption
    ? `\n\nSELECTED RECOMMENDATION:\nOption ${selectedOption.label} — ${selectedOption.name}\n` +
      `PV: ${selectedOption.pvKwp} kWp | Battery: ${selectedOption.batteryKwh} kWh | ` +
      `Inverter: ${selectedOption.inverterKw} kW\n` +
      `Est. annual production: ${selectedOption.estimatedAnnualProduction.toLocaleString()} kWh | ` +
      `Self-consumption: ${selectedOption.selfConsumptionPct}%\n` +
      `Investment range: €${selectedOption.estimatedInvestmentMin.toLocaleString()}–€${selectedOption.estimatedInvestmentMax.toLocaleString()}\n` +
      `Summary: ${selectedOption.summary}`
    : '';

  const userMessage = `Project context: ${JSON.stringify(context)}${optionContext}\n\nQuestion: ${question}`;

  try {
    const answer = await callGemini(systemPrompt, userMessage);
    return { answer, sources: [] };
  } catch (err) {
    console.warn('Gemini chat failed, using local fallback:', err);
    return { answer: buildChatFallback(question), sources: [] };
  }
}

export async function translateText(text: string, targetLanguage: 'de' | 'en'): Promise<string> {
  const langName = targetLanguage === 'en' ? 'English' : 'German';
  const systemPrompt = `You are a professional translator. Translate the following text into ${langName}. Preserve all HTML tags, line breaks, emojis, and references exactly. Output ONLY the translated text.`;
  try {
    return await callGemini(systemPrompt, text);
  } catch (err) {
    console.error('Translation failed:', err);
    return text;
  }
}

function buildChatFallback(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('register') || q.includes('mastr') || q.includes('anmeld')) {
    return `<strong>Yes — two obligations:</strong><br><br><strong>1. MaStR registration</strong><br>Within 1 month after commissioning (marktstammdatenregister.de)<br><span style="font-size:10px;color:gray">📖 §§3 No.1, 5 MaStRV · 🟢 Current since 01.07.2017</span><br><br><strong>2. Network registration</strong><br>At least 4 weeks before installation.<br><span style="font-size:10px;color:gray">📖 §13 NAV · 🟢 Current</span>`;
  }
  if (q.includes('subsid') || q.includes('kfw') || q.includes('grant') || q.includes('fund')) {
    return `<strong>Subsidies for your project:</strong><br><br>🟢 <strong>KfW 270</strong> — Low-interest loan up to EUR 150,000 (active, apply before commissioning!)<br>🟡 <strong>KfW 442</strong> — Battery grant (announced, not yet active)<br>🟢 <strong>§3 No.72 EStG</strong> — Income tax exemption for PV income.`;
  }
  if (q.includes('tax') || q.includes('vat') || q.includes('estg')) {
    return `<strong>Tax rules:</strong><br><br>🟢 <strong>0% VAT</strong> on purchasing and installing PV components.<br>🟢 <strong>Income tax exemption</strong> under §3 No.72 EStG for systems up to 30 kWp on single-family homes.`;
  }
  if (q.includes('wallbox') || q.includes('14a') || q.includes('charger')) {
    return `<strong>§14a EnWG — Mandatory since 01.01.2024:</strong><br><br>Wallboxes >3.7 kW must be remotely controllable by the grid operator. In return, you receive reduced grid usage fees.`;
  }
  if (q.includes('feed') || q.includes('tariff') || q.includes('eeg') || q.includes('einspeis')) {
    return `<strong>Feed-in tariff (EEG 2023):</strong><br><br>For rooftop systems up to 10 kWp: approx. <strong>8.2 ct/kWh</strong>.<br>Guaranteed for 20 years from commissioning date.`;
  }
  if (q.includes('battery') || q.includes('storage') || q.includes('speicher')) {
    return `<strong>Battery storage:</strong><br><br>Batteries are not separately registered but must be declared in the MaStR entry. Smart meter gateway (iMSys) is required for systems ≥7 kWp. KfW 442 battery grant is announced but not yet active.`;
  }
  if (q.includes('smart meter') || q.includes('imsys') || q.includes('messsystem')) {
    return `<strong>Smart meter gateway (iMSys):</strong><br><br>For PV systems ≥7 kWp, installation of a certified smart meter gateway is required under §29 MsbG. The grid operator coordinates the rollout — no separate application needed from the homeowner.`;
  }

  return `The AI consultant is currently unavailable. Please check that the backend server is running and the API key is configured.<br><br><strong>General information:</strong><br>- MaStR registration required within 1 month of commissioning (§5 MaStRV)<br>- Network registration at least 4 weeks before installation (§13 NAV)<br>- PV systems up to 30 kWp are income tax-exempt (§3 No.72 EStG)`;
}
