"""GET /api/irradiance — PVGIS solar irradiance proxy."""
from __future__ import annotations

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.pvgis import get_irradiance

router = APIRouter()


class IrradianceResponse(BaseModel):
    irradianceKwhPerKwp: float
    source: str  # 'pvgis' | 'default'
    region: str


@router.get("", response_model=IrradianceResponse)
async def irradiance(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    roofAreaM2: float = Query(50.0, gt=0),
    orientation: str = Query("S", description="Roof orientation (S, SE, SW, E, W, N, NE, NW)"),
    pitch: float = Query(30.0, ge=0, le=90, description="Roof pitch in degrees"),
) -> IrradianceResponse:
    """
    Return location-specific annual solar irradiance (kWh/kWp/year) from PVGIS.
    Falls back to the Germany average (950 kWh/kWp) if PVGIS is unavailable.
    """
    result = await get_irradiance(lat, lng, roofAreaM2, orientation, pitch)
    return IrradianceResponse(**result)
