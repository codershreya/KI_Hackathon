"""Assessment pipeline — port of services/assessmentPipeline.ts."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict
from uuid import uuid4

from app.models import AssessmentResult, Claim, GeoLocation, GridOperator, Priority, ProjectInput, RegulatoryStatus, Step, Subsidy, TechnicalSummary, TrafficLight
from app.services.geocoding import geocode_address, lookup_grid_operator
from app.services.technical_calc import calc_technical
from app.services.pvgis import get_irradiance
from app.services.rag_retrieval import retrieve_relevant_chunks
from app.services.llm_service import _build_fallback_result, call_assessment_llm

log = logging.getLogger(__name__)


def _coerce_claims(raw: list[dict]) -> list[Claim]:
    result = []
    for c in raw:
        try:
            result.append(Claim(**c))
        except Exception:
            pass
    return result


def _coerce_subsidies(raw: list[dict]) -> list[Subsidy]:
    result = []
    for s in raw:
        try:
            result.append(Subsidy(**s))
        except Exception:
            pass
    return result


def _coerce_steps(raw: list[dict]) -> list[Step]:
    result = []
    for s in raw:
        try:
            result.append(Step(**s))
        except Exception:
            pass
    return result


async def run_assessment_pipeline(project_id: str, inp: ProjectInput) -> AssessmentResult:
    # Step 1: Geocode address
    geo: GeoLocation | None = None
    try:
        geo = await geocode_address(inp.address)
    except Exception as e:
        log.warning("Geocoding failed: %s", e)

    # Step 2: Grid operator lookup
    grid_operator: GridOperator | None = None
    if geo:
        try:
            grid_operator = await lookup_grid_operator(geo.lat, geo.lng)
        except Exception as e:
            log.warning("Grid operator lookup failed: %s", e)

    # Enrich input with resolved operator id
    if grid_operator:
        inp = inp.model_copy(update={"gridOperatorId": grid_operator.id})

    # Step 3: Technical pre-calculation (with PVGIS irradiance)
    irradiance_val = 950.0
    if geo:
        try:
            irr_data = await get_irradiance(
                geo.lat, geo.lng, inp.roofAreaM2, inp.roofOrientation.value, inp.roofPitchDeg
            )
            irradiance_val = irr_data.get("irradianceKwhPerKwp", 950.0)
        except Exception as e:
            log.warning("Irradiance lookup failed: %s", e)

    technical_summary = calc_technical(inp, irradiance_val)

    # Step 4 & 5: RAG retrieval
    chunks = await retrieve_relevant_chunks(inp)

    # Step 6: LLM call
    try:
        llm_result = await call_assessment_llm(inp, technical_summary, grid_operator, chunks)
    except Exception as e:
        log.error("LLM call failed, using fallback: %s", e)
        llm_result = _build_fallback_result()

    # Step 7: Assemble final result
    return AssessmentResult(
        projectId=project_id,
        generatedAt=datetime.now(timezone.utc).isoformat(),
        gridOperator=grid_operator,
        technicalSummary=technical_summary,
        regulatoryClaims=_coerce_claims(llm_result.get("regulatoryClaims", [])),
        subsidies=_coerce_subsidies(llm_result.get("subsidies", [])),
        openPoints=llm_result.get("openPoints", []),
        nextSteps=_coerce_steps(llm_result.get("nextSteps", [])),
        installerQuestions=llm_result.get("installerQuestions", []),
        trafficLight=TrafficLight(llm_result.get("trafficLight", "amber")),
        rawLlmTrace=llm_result.get("rawLlmTrace"),
    )
