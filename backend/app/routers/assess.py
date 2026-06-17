"""POST /api/assess — port of routes/assess.ts."""
from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.models import AssessmentResult, ProjectInput
from app.services.assessment_pipeline import run_assessment_pipeline

router = APIRouter()


@router.post("", response_model=AssessmentResult)
async def assess(inp: ProjectInput) -> AssessmentResult:
    if not inp.address or not inp.roofAreaM2:
        raise HTTPException(status_code=400, detail="address and roofAreaM2 are required")

    project_id = str(uuid4())
    try:
        return await run_assessment_pipeline(project_id, inp)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Assessment pipeline error: %s", exc)
        raise HTTPException(status_code=500, detail="Assessment failed")


@router.get("/{assessment_id}", response_model=dict)
async def get_assessment(assessment_id: str) -> dict:
    # In production: look up from DB. For MVP, return 404.
    raise HTTPException(
        status_code=404,
        detail="Assessment not found (persistence not yet implemented)",
    )
