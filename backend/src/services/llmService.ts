import Anthropic from '@anthropic-ai/sdk';
import type {
  AssessmentResult,
  ProjectInput,
  RetrievedChunk,
  TechnicalSummary,
  GridOperator,
} from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

function buildSystemPrompt(): string {
  return `You are an expert AI assistant for solar PV regulatory compliance in Germany.
Your task is to analyse a homeowner's PV project and produce a structured JSON assessment.

RULES:
1. Output ONLY valid JSON matching the AssessmentResult schema — no prose, no markdown wrapper.
2. For every claim cite the chunkId(s) from the retrieved context in sourceIds[].
3. Set status to: "valid" (currently in force), "announced" (legislated but not effective yet),
   "transitional" (in force for existing installs only), "expired", or "unclear".
4. NEVER assert facts not present in the retrieved context. Use status="unclear" + uncertainty field instead.
5. Write at layperson level. Add technicalNote for expert details.
6. German language for all user-facing text (text, detail, descriptions, steps, questions).

OUTPUT SCHEMA (return this exact structure):
{
  "regulatoryClaims": [
    {
      "text": "short title",
      "detail": "explanation in plain German",
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
- Estimated system size: ${tech.estimatedKwp} kWp
- Module count: ${tech.moduleCountMin}–${tech.moduleCountMax}
- Annual yield: ${tech.annualKwh} kWh
- Self-consumption: ${tech.selfConsumptionPct}% (${tech.selfConsumptionWithStoragePct}% with storage)
- Recommended storage: ${tech.recommendedStorageKwh} kWh
- Roof score: ${tech.roofScore}/10

GRID OPERATOR: ${operator ? `${operator.name}, ${operator.city}, ${operator.state}` : 'Unknown'}

RETRIEVED REGULATORY CONTEXT:
${chunksText}

Now produce the JSON assessment following the schema in the system prompt.
Focus on rules relevant to this specific project (building type: ${input.buildingType},
components: PV${input.planStorage ? '+storage' : ''}${input.planWallbox ? '+wallbox' : ''}${input.planHeatPump ? '+heat_pump' : ''}).`;
}

export async function callAssessmentLlm(
  input: ProjectInput,
  tech: TechnicalSummary,
  operator: GridOperator | null,
  chunks: RetrievedChunk[]
): Promise<Partial<AssessmentResult> & { rawLlmTrace: string }> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input, tech, operator, chunks);

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  let parsed: Partial<AssessmentResult>;
  try {
    // Strip potential markdown fences
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
  context: Record<string, unknown>
): Promise<{ answer: string; sources: string[] }> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.1,
    system:
      'You are a German solar PV regulatory expert. Answer concisely in German. ' +
      'Always cite your sources with §-references. End with a disclaimer that this is not legal advice.',
    messages: [
      {
        role: 'user',
        content: `Project context: ${JSON.stringify(context)}\n\nQuestion: ${question}`,
      },
    ],
  });

  const answer = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  return { answer, sources: [] };
}
