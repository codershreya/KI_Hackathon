import { ChromaClient, Collection } from 'chromadb';

const COLLECTION_NAME = 'plankton_pv_regulations';

let _client: ChromaClient | null = null;
let _collection: Collection | null = null;

function getClient(): ChromaClient {
  if (!_client) {
    _client = new ChromaClient({ path: process.env.CHROMA_URL ?? 'http://localhost:8000' });
  }
  return _client;
}

export async function getCollection(): Promise<Collection> {
  if (_collection) return _collection;
  const client = getClient();
  _collection = await client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { 'hnsw:space': 'cosine' },
  });
  return _collection;
}

export async function upsertChunks(
  chunks: {
    id: string;
    text: string;
    metadata: Record<string, string | string[] | null>;
  }[]
): Promise<void> {
  const collection = await getCollection();
  await collection.upsert({
    ids: chunks.map((c) => c.id),
    documents: chunks.map((c) => c.text),
    metadatas: chunks.map((c) => c.metadata as Record<string, string>),
  });
}

export async function deleteCollection(): Promise<void> {
  const client = getClient();
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
    _collection = null;
  } catch {
    // Collection may not exist yet
  }
}
