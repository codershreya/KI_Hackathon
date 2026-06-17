"""PVGIS irradiance proxy — free EU JRC solar irradiance API."""
from __future__ import annotations

import httpx

PVGIS_URL = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc"

# Regional default when PVGIS is unavailable (Germany average)
DEFAULT_IRRADIANCE = 950.0

_ORIENTATION_AZIMUTH: dict[str, float] = {
    "S": 0, "SW": 45, "SE": -45,
    "W": 90, "E": -90,
    "NW": 135, "NE": -135,
    "N": 180,
}


async def get_irradiance(
    lat: float,
    lng: float,
    roof_area_m2: float,
    orientation: str,
    pitch_deg: float,
) -> dict:
    """
    Call PVGIS to get location-specific irradiance.
    Returns dict with irradianceKwhPerKwp, source, region.
    Falls back to default 950 kWh/kWp if PVGIS is unavailable.
    """
    azimuth = _ORIENTATION_AZIMUTH.get(orientation.upper(), 0)
    params = {
        "lat": lat,
        "lon": lng,
        "peakpower": 1,          # 1 kWp reference system
        "loss": 14,              # 14% system losses
        "aspect": azimuth,
        "angle": pitch_deg,
        "outputformat": "json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(PVGIS_URL, params=params)
        if not resp.is_success:
            return _default_result()

        data = resp.json()
        # PVGIS returns E_y = yearly energy output in kWh for a 1 kWp system
        annual_kwh = data["outputs"]["totals"]["fixed"]["E_y"]
        return {
            "irradianceKwhPerKwp": round(float(annual_kwh), 1),
            "source": "pvgis",
            "region": f"{lat:.2f}°N {lng:.2f}°E",
        }
    except Exception:
        return _default_result()


def _default_result() -> dict:
    return {
        "irradianceKwhPerKwp": DEFAULT_IRRADIANCE,
        "source": "default",
        "region": "Deutschland (Durchschnitt)",
    }
