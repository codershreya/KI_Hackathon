"""GET /api/gridoperator — port of routes/gridoperator.ts."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models import GridOperator
from app.services.geocoding import lookup_grid_operator

router = APIRouter()


@router.get("", response_model=GridOperator)
async def get_grid_operator(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
) -> GridOperator:
    try:
        operator = await lookup_grid_operator(lat, lng)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Grid operator lookup error: %s", exc)
        raise HTTPException(status_code=500, detail="Lookup failed")

    if not operator:
        raise HTTPException(status_code=404, detail="Grid operator not found for this location")
    return operator
