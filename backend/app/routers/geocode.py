"""GET /api/geocode — address → lat/lng + grid operator in one call."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.models import GeoLocation, GridOperator
from app.services.geocoding import geocode_address, lookup_grid_operator

router = APIRouter()


class GeocodeResponse(BaseModel):
    lat: float
    lng: float
    displayName: str
    gridOperator: Optional[GridOperator] = None


@router.get("", response_model=GeocodeResponse)
async def geocode(address: str = Query(..., min_length=3)) -> GeocodeResponse:
    """
    Resolve a free-text address to coordinates and look up the grid operator
    in a single round-trip. Used by the frontend for live preview on address input.
    """
    try:
        geo = await geocode_address(address)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Geocoding failed: {exc}")

    if not geo:
        raise HTTPException(status_code=404, detail="Address not found")

    operator: Optional[GridOperator] = None
    try:
        operator = await lookup_grid_operator(geo.lat, geo.lng)
    except Exception:
        pass  # Grid operator lookup is best-effort

    return GeocodeResponse(
        lat=geo.lat,
        lng=geo.lng,
        displayName=geo.displayName,
        gridOperator=operator,
    )
