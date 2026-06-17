"""GET /api/sources — port of routes/sources.ts."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Query

from app.models import RegulatoryDocument, RegulatoryStatus

router = APIRouter()

_SOURCES_PATH = Path(__file__).parent.parent / "services" / "knowledge" / "regulatory_sources.json"
_SOURCES: list[dict] = json.loads(_SOURCES_PATH.read_text(encoding="utf-8"))


@router.get("")
async def list_sources(
    tags: Optional[str] = Query(None, description="Comma-separated tag filter"),
    status: Optional[RegulatoryStatus] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    docs = [RegulatoryDocument(**d) for d in _SOURCES]

    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        docs = [d for d in docs if any(t in d.tags for t in tag_list)]
    if status:
        docs = [d for d in docs if d.status == status]

    start = (page - 1) * limit
    return {
        "total": len(docs),
        "page": page,
        "limit": limit,
        "data": [d.model_dump() for d in docs[start : start + limit]],
    }


@router.get("/{source_id}", response_model=RegulatoryDocument)
async def get_source(source_id: str) -> RegulatoryDocument:
    """Return a single regulatory document by ID — used by the source inspector drawer."""
    for raw in _SOURCES:
        if raw["id"] == source_id:
            return RegulatoryDocument(**raw)
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found")

