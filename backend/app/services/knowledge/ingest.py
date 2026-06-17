"""Ingestion script — port of knowledge/ingest.ts.

Run with:
    python -m app.services.knowledge.ingest
ChromaDB must be running: docker run -p 8000:8000 chromadb/chroma
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

# Allow running as a script from the backend/ directory
sys.path.insert(0, str(Path(__file__).resolve().parents[4]))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[4] / ".env")

from app.services.knowledge.vector_db import delete_collection, upsert_chunks

CHUNK_SIZE = 512
OVERLAP = 64
_JSON_PATH = Path(__file__).parent / "regulatory_sources.json"


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start += size - overlap
    return chunks


async def ingest() -> None:
    sources = json.loads(_JSON_PATH.read_text(encoding="utf-8"))
    print(f"Ingesting {len(sources)} regulatory sources…")

    chunks: list[dict] = []
    for doc in sources:
        text_chunks = chunk_text(doc["chunkText"])
        for idx, chunk in enumerate(text_chunks):
            chunks.append(
                {
                    "id": f"{doc['id']}-{idx}",
                    "text": chunk,
                    "metadata": {
                        "docId": doc["id"],
                        "title": doc["title"],
                        "source": doc["source"],
                        "sourceUrl": doc["sourceUrl"],
                        "version": doc["version"],
                        "validFrom": doc["validFrom"],
                        "validUntil": doc.get("validUntil") or "",
                        "status": doc["status"],
                        "tags": ",".join(doc["tags"]),
                    },
                }
            )

    print(f"Upserting {len(chunks)} chunks into ChromaDB…")
    await upsert_chunks(chunks)
    print("Ingestion complete.")


if __name__ == "__main__":
    asyncio.run(ingest())
