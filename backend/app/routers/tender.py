"""POST /api/tender/{id} — installer tender brief generator."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List

from app.models import AssessmentResult
from app.services.tender import generate_tender

router = APIRouter()


class TenderResponse(BaseModel):
    tenderText: str
    suggestedQuestions: List[str]
    technicalSpecs: Dict[str, Any]


@router.post("/{project_id}", response_model=TenderResponse)
async def create_tender(project_id: str, assessment: AssessmentResult) -> TenderResponse:
    """
    Generate a structured installer tender brief (Angebotsanfrage) from an
    existing assessment. PRD milestone M8.
    """
    if not assessment.projectId:
        raise HTTPException(status_code=400, detail="Assessment data required")

    try:
        result = await generate_tender(assessment)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Tender generation error: %s", exc)
        raise HTTPException(status_code=500, detail="Tender generation failed")

    return TenderResponse(**result)
