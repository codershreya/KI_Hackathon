"""POST /api/roof-image — Claude Vision roof photo analysis."""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from typing import List, Optional

from app.services.roof_image import analyze_roof_image

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


class RoofImageResponse(BaseModel):
    roofScoreEstimate: float
    estimatedAreaM2: Optional[float] = None
    orientationHint: Optional[str] = None
    shadingNotes: List[str]
    confidence: str
    notes: List[str]


@router.post("", response_model=RoofImageResponse)
async def analyze_roof(
    image: UploadFile = File(..., description="Roof photo (JPEG or PNG, max 10 MB)"),
) -> RoofImageResponse:
    """
    Analyze a roof photo using Claude Vision and return a structured
    assessment of suitability for PV installation.
    """
    content_type = image.content_type or "image/jpeg"
    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {content_type}. Use JPEG, PNG, or WebP.",
        )

    image_bytes = await image.read()
    if len(image_bytes) > _MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")

    try:
        result = await analyze_roof_image(image_bytes, content_type)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Roof image analysis error: %s", exc)
        raise HTTPException(status_code=500, detail="Roof analysis failed")

    return RoofImageResponse(**result)
