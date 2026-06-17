"""ChromaDB client singleton — port of knowledge/vectorDb.ts."""
from __future__ import annotations

import os
from typing import Any, Optional

import chromadb

COLLECTION_NAME = "plankton_pv_regulations"

_client: Optional[chromadb.AsyncHttpClient] = None
_collection: Optional[Any] = None


def _get_client() -> chromadb.AsyncHttpClient:
    global _client
    if _client is None:
        chroma_url = os.getenv("CHROMA_URL", "http://localhost:8000")
        _client = chromadb.AsyncHttpClient(host=chroma_url.replace("http://", "").split(":")[0],
                                           port=int(chroma_url.split(":")[-1]))
    return _client


async def get_collection() -> Any:
    global _collection
    if _collection is not None:
        return _collection
    client = _get_client()
    _collection = await client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


async def upsert_chunks(chunks: list[dict]) -> None:
    """Upsert a list of {id, text, metadata} dicts into ChromaDB."""
    collection = await get_collection()
    await collection.upsert(
        ids=[c["id"] for c in chunks],
        documents=[c["text"] for c in chunks],
        metadatas=[c["metadata"] for c in chunks],
    )


async def delete_collection() -> None:
    global _collection
    client = _get_client()
    try:
        await client.delete_collection(name=COLLECTION_NAME)
        _collection = None
    except Exception:
        pass  # Collection may not exist yet
