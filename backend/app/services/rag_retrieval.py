"""RAG retrieval — port of services/ragRetrieval.ts."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List

from app.models import ProjectInput, RetrievedChunk, RegulatoryStatus

TOP_K = 5
MAX_CONTEXT_CHARS = 6000 * 4  # ~4 chars per token

_SOURCES_PATH = Path(__file__).parent / "knowledge" / "regulatory_sources.json"


def _build_queries(inp: ProjectInput) -> list[str]:
    queries = [
        "PV-Anlage Registrierung MaStR Pflichten Inbetriebnahme",
        "Netzanmeldung Netzbetreiber Einspeisevergütung EEG",
        "Steuerbefreiung Photovoltaik Einfamilienhaus §3 Nr.72 EStG",
    ]
    if inp.planWallbox or inp.hasEV:
        queries.append("§14a EnWG Wallbox Steuerbarkeit Netzentgelt")
    if inp.planStorage:
        queries.append("Batteriespeicher KfW Förderung Heimspeicher")
    if inp.planHeatPump:
        queries.append("Wärmepumpe §14a EnWG steuerbare Verbrauchseinrichtung")
    if inp.existingPvKwp:
        queries.append("Bestandsanlage EEG Vergütung Repowering Erweiterung")
    return queries


# ── Levenshtein / MMR helpers ────────────────────────────────────────────────

def _edit_dist(a: str, b: str) -> int:
    la, lb = len(a), len(b)
    dp = list(range(lb + 1))
    for i in range(1, la + 1):
        prev = dp[:]
        dp[0] = i
        for j in range(1, lb + 1):
            if a[i - 1] == b[j - 1]:
                dp[j] = prev[j - 1]
            else:
                dp[j] = 1 + min(prev[j], dp[j - 1], prev[j - 1])
    return dp[lb]


def _levenshtein_similarity(a: str, b: str) -> float:
    longer, shorter = (a, b) if len(a) >= len(b) else (b, a)
    if not longer:
        return 1.0
    return (len(longer) - _edit_dist(longer, shorter)) / len(longer)


def _mmr_deduplicate(chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
    selected: list[RetrievedChunk] = []
    seen: set[str] = set()
    total_chars = 0

    for chunk in sorted(chunks, key=lambda c: c.score, reverse=True):
        if chunk.id in seen:
            continue
        is_dup = any(
            s.source == chunk.source and _levenshtein_similarity(s.text, chunk.text) > 0.8
            for s in selected
        )
        if is_dup:
            continue
        total_chars += len(chunk.text)
        if total_chars > MAX_CONTEXT_CHARS:
            break
        seen.add(chunk.id)
        selected.append(chunk)

    return selected


# ── Static fallback ──────────────────────────────────────────────────────────

def _static_fallback(tag_filter: list[str]) -> list[RetrievedChunk]:
    sources = json.loads(_SOURCES_PATH.read_text(encoding="utf-8"))
    results = []
    for i, doc in enumerate(sources):
        if any(t in doc["tags"] for t in tag_filter):
            results.append(
                RetrievedChunk(
                    id=doc["id"],
                    text=doc["chunkText"],
                    source=doc["source"],
                    title=doc["title"],
                    status=RegulatoryStatus(doc["status"]),
                    validFrom=doc["validFrom"],
                    validUntil=doc.get("validUntil"),
                    tags=doc["tags"],
                    score=1.0 - i * 0.05,
                )
            )
    return results


# ── Main entry point ─────────────────────────────────────────────────────────

async def retrieve_relevant_chunks(inp: ProjectInput) -> List[RetrievedChunk]:
    queries = _build_queries(inp)
    tag_filter = ["pv"]
    if inp.planWallbox or inp.hasEV:
        tag_filter.append("wallbox")
    if inp.planStorage:
        tag_filter.append("storage")
    if inp.planHeatPump:
        tag_filter.append("heat_pump")

    all_chunks: list[RetrievedChunk] = []

    try:
        from app.services.knowledge.vector_db import get_collection

        collection = await get_collection()

        for query in queries:
            where = {"tags": {"$in": tag_filter}} if len(tag_filter) > 1 else None
            results = await collection.query(
                query_texts=[query],
                n_results=TOP_K,
                where=where,
            )

            ids = results["ids"][0] if results["ids"] else []
            distances = results["distances"][0] if results.get("distances") else []
            metadatas = results["metadatas"][0] if results.get("metadatas") else []
            documents = results["documents"][0] if results.get("documents") else []

            for idx, chunk_id in enumerate(ids):
                meta = metadatas[idx] or {}
                tags_raw = meta.get("tags", "")
                all_chunks.append(
                    RetrievedChunk(
                        id=str(chunk_id),
                        text=str(documents[idx] or ""),
                        source=str(meta.get("source", "")),
                        title=str(meta.get("title", "")),
                        status=RegulatoryStatus(meta.get("status", "unclear")),
                        validFrom=str(meta.get("validFrom", "")),
                        validUntil=meta.get("validUntil") or None,
                        tags=tags_raw.split(",") if tags_raw else [],
                        score=1.0 - float(distances[idx] if idx < len(distances) else 1.0),
                    )
                )
    except Exception:
        # Vector DB not available — fall back to static source metadata
        import warnings
        warnings.warn("Vector DB unavailable, falling back to static sources")
        return _static_fallback(tag_filter)

    return _mmr_deduplicate(all_chunks)
