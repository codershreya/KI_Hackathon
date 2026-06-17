import type { ProjectInput, RetrievedChunk, RegulatoryDocument } from '../types';
import { getCollection } from '../knowledge/vectorDb';
import regulatorySources from '../knowledge/regulatorySources.json';

const TOP_K = 5;
const MAX_CONTEXT_TOKENS = 6000; // approx chars

function buildQueries(input: ProjectInput): string[] {
  const queries: string[] = [
    'PV-Anlage Registrierung MaStR Pflichten Inbetriebnahme',
    'Netzanmeldung Netzbetreiber Einspeisevergütung EEG',
    'Steuerbefreiung Photovoltaik Einfamilienhaus §3 Nr.72 EStG',
  ];

  if (input.planWallbox || input.hasEV) {
    queries.push('§14a EnWG Wallbox Steuerbarkeit Netzentgelt');
  }
  if (input.planStorage) {
    queries.push('Batteriespeicher KfW Förderung Heimspeicher');
  }
  if (input.planHeatPump) {
    queries.push('Wärmepumpe §14a EnWG steuerbare Verbrauchseinrichtung');
  }
  if (input.existingPvKwp) {
    queries.push('Bestandsanlage EEG Vergütung Repowering Erweiterung');
  }

  return queries;
}

// MMR-style deduplication: prefer diverse chunks
function mmrDeduplicate(chunks: RetrievedChunk[], maxTokensBudget: number): RetrievedChunk[] {
  const selected: RetrievedChunk[] = [];
  const seen = new Set<string>();
  let totalChars = 0;

  for (const chunk of chunks.sort((a, b) => b.score - a.score)) {
    if (seen.has(chunk.id)) continue;
    // Simple overlap check: skip if another chunk from the same source has nearly same text
    const isDuplicate = selected.some(
      (s) => s.source === chunk.source && levenshteinSimilarity(s.text, chunk.text) > 0.8
    );
    if (isDuplicate) continue;

    totalChars += chunk.text.length;
    if (totalChars > maxTokensBudget * 4) break; // ~4 chars per token estimate

    seen.add(chunk.id);
    selected.push(chunk);
  }

  return selected;
}

function levenshteinSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  const editDistance = editDist(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function editDist(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export async function retrieveRelevantChunks(input: ProjectInput): Promise<RetrievedChunk[]> {
  const queries = buildQueries(input);
  const allChunks: RetrievedChunk[] = [];

  // Tags to filter by based on user selections
  const tagFilter: string[] = ['pv'];
  if (input.planWallbox || input.hasEV) tagFilter.push('wallbox');
  if (input.planStorage) tagFilter.push('storage');
  if (input.planHeatPump) tagFilter.push('heat_pump');

  try {
    const collection = await getCollection();

    for (const query of queries) {
      const results = await collection.query({
        queryTexts: [query],
        nResults: TOP_K,
        where: tagFilter.length > 1 ? { tags: { $in: tagFilter } } : undefined,
      });

      const ids = results.ids[0] ?? [];
      const distances = results.distances?.[0] ?? [];
      const metadatas = results.metadatas?.[0] ?? [];
      const documents = results.documents?.[0] ?? [];

      ids.forEach((id, idx) => {
        const meta = metadatas[idx] as Record<string, unknown> | null ?? {};
        allChunks.push({
          id: String(id),
          text: String(documents[idx] ?? ''),
          source: String(meta.source ?? ''),
          title: String(meta.title ?? ''),
          status: (meta.status as RetrievedChunk['status']) ?? 'unclear',
          validFrom: String(meta.validFrom ?? ''),
          validUntil: meta.validUntil ? String(meta.validUntil) : null,
          tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
          score: 1 - (distances[idx] ?? 1),
        });
      });
    }
  } catch {
    // Vector DB not available — fall back to static source metadata
    console.warn('Vector DB unavailable, falling back to static sources');
    const staticSources = regulatorySources as RegulatoryDocument[];
    return staticSources
      .filter((s) => tagFilter.some((t) => s.tags.includes(t)))
      .map((s, i) => ({
        id: s.id,
        text: s.chunkText,
        source: s.source,
        title: s.title,
        status: s.status,
        validFrom: s.validFrom,
        validUntil: s.validUntil,
        tags: s.tags,
        score: 1 - i * 0.05,
      }));
  }

  return mmrDeduplicate(allChunks, MAX_CONTEXT_TOKENS);
}
