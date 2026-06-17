/**
 * Ingestion script — run with: npm run ingest
 *
 * Reads regulatorySources.json, chunks each document, and upserts into ChromaDB.
 * ChromaDB must be running: docker run -p 8000:8000 chromadb/chroma
 */
import 'dotenv/config';
import { upsertChunks, deleteCollection } from './vectorDb';
import regulatorySources from './regulatorySources.json';
import type { RegulatoryDocument } from '../types';

const CHUNK_SIZE = 512; // approximate characters per chunk
const OVERLAP = 64;

function chunkText(text: string, size = CHUNK_SIZE, overlap = OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start += size - overlap;
  }
  return chunks;
}

async function ingest() {
  const sources = regulatorySources as RegulatoryDocument[];
  console.log(`Ingesting ${sources.length} regulatory sources…`);

  const chunks: { id: string; text: string; metadata: Record<string, string | null> }[] = [];

  for (const doc of sources) {
    const textChunks = chunkText(doc.chunkText);
    textChunks.forEach((chunk, idx) => {
      chunks.push({
        id: `${doc.id}-${idx}`,
        text: chunk,
        metadata: {
          docId: doc.id,
          title: doc.title,
          source: doc.source,
          sourceUrl: doc.sourceUrl,
          version: doc.version,
          validFrom: doc.validFrom,
          validUntil: doc.validUntil,
          status: doc.status,
          tags: doc.tags.join(','),
        },
      });
    });
  }

  console.log(`Upserting ${chunks.length} chunks into ChromaDB…`);
  await upsertChunks(chunks);
  console.log('Ingestion complete.');
}

ingest().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
