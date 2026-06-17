"""Technical PV pre-calculations — port of services/technicalCalc.ts."""
from __future__ import annotations

from app.models import Confidence, ProjectInput, TechnicalSummary

# Orientation efficiency factors (fraction of south-facing yield)
_ORIENTATION_FACTOR: dict[str, float] = {
    "S": 1.0,
    "SE": 0.95,
    "SW": 0.95,
    "E": 0.85,
    "W": 0.85,
    "NE": 0.70,
    "NW": 0.70,
    "N": 0.55,
}

_ORIENT_LABEL: dict[str, str] = {
    "S": "Süd",
    "SE": "Südost",
    "SW": "Südwest",
    "E": "Ost",
    "W": "West",
    "N": "Nord",
    "NE": "Nordost",
    "NW": "Nordwest",
}

# Regional average irradiance (kWh/kWp/year) — Germany average
_DEFAULT_IRRADIANCE_KWH_PER_KWP = 950

# Module area density: 20% efficiency → 200 Wp per m²
_MODULE_EFFICIENCY = 0.20


def _pitch_factor(deg: float) -> float:
    """Pitch correction factor (optimal ~30°)."""
    if 25 <= deg <= 40:
        return 1.0
    if deg >= 15:
        return 0.97
    if deg >= 5:
        return 0.90
    return 0.87  # flat roof


def calc_technical(inp: ProjectInput, irradiance_kwh_per_kwp: float = _DEFAULT_IRRADIANCE_KWH_PER_KWP) -> TechnicalSummary:
    orient_factor = _ORIENTATION_FACTOR.get(inp.roofOrientation.value, 0.85)
    pitch_f = _pitch_factor(inp.roofPitchDeg)
    usable_area = inp.roofAreaM2 * 0.75  # usability factor

    estimated_kwp = round(usable_area * orient_factor * pitch_f * _MODULE_EFFICIENCY, 1)

    module_wp = 430  # typical module Wp
    module_count = round((estimated_kwp * 1000) / module_wp)
    module_count_min = max(1, module_count - 2)
    module_count_max = module_count + 2

    if irradiance_kwh_per_kwp == _DEFAULT_IRRADIANCE_KWH_PER_KWP:
        annual_kwh = round(estimated_kwp * _DEFAULT_IRRADIANCE_KWH_PER_KWP * 0.86)  # 14% system losses
    else:
        annual_kwh = round(estimated_kwp * irradiance_kwh_per_kwp)

    # Self-consumption without storage
    if inp.annualKwhElec > 0:
        raw_sc = min(inp.annualKwhElec / annual_kwh, 1.0) if annual_kwh > 0 else 0.45
    else:
        raw_sc = 0.45
    self_consumption_pct = round(raw_sc * 100)

    # Self-consumption with storage (+20% with storage)
    storage_factor = 1.20 if inp.planStorage else 1.0
    self_consumption_with_storage_pct = min(round(raw_sc * storage_factor * 100), 95)

    # Recommended storage: ~1 kWh per kWp
    recommended_storage_kwh = round(estimated_kwp)

    # Roof score: area (30%), orientation (30%), pitch (20%), shading placeholder (20%)
    area_score = min(inp.roofAreaM2 / 100, 1.0) * 10
    orient_score = orient_factor * 10
    pitch_score = pitch_f * 10
    shading_score = 8.0  # placeholder — unknown without image analysis
    roof_score = round(
        area_score * 0.3 + orient_score * 0.3 + pitch_score * 0.2 + shading_score * 0.2,
        1,
    )

    return TechnicalSummary(
        estimatedKwp=estimated_kwp,
        moduleCountMin=module_count_min,
        moduleCountMax=module_count_max,
        annualKwh=annual_kwh,
        selfConsumptionPct=self_consumption_pct,
        selfConsumptionWithStoragePct=self_consumption_with_storage_pct,
        recommendedStorageKwh=recommended_storage_kwh,
        roofScore=roof_score,
        orientation=_ORIENT_LABEL.get(inp.roofOrientation.value, inp.roofOrientation.value),
        confidence=Confidence.medium,
        notes=[],
    )
