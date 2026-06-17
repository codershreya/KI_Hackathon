"""POST /api/export/{id} — port of routes/export.ts."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.models import AssessmentResult
from app.services.pdf_export import generate_pdf

router = APIRouter()


@router.post("/{assessment_id}")
async def export_pdf(assessment_id: str, assessment: AssessmentResult) -> Response:
    if not assessment.projectId:
        raise HTTPException(status_code=400, detail="Assessment data required in request body")

    try:
        pdf_bytes = generate_pdf(assessment)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("PDF generation error: %s", exc)
        raise HTTPException(status_code=500, detail="PDF generation failed")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="plankton-pv-{assessment_id}.pdf"',
        },
    )
