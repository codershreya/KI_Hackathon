"""LLM service — port of services/llmService.ts using Google Gemini SDK."""
from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

from google import genai

from app.models import (
    AssessmentResult,
    Claim,
    GridOperator,
    Priority,
    ProjectInput,
    RegulatoryStatus,
    RetrievedChunk,
    Step,
    Subsidy,
    TechnicalSummary,
    TrafficLight,
)

MODEL = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def _build_system_prompt() -> str:
    return """You are an expert AI assistant for solar PV regulatory compliance in Germany.
Your task is to analyse a homeowner's PV project and produce a structured JSON assessment.

RULES:
1. Output ONLY valid JSON matching the AssessmentResult schema — no prose, no markdown wrapper.
2. For every claim cite the chunkId(s) from the retrieved context in sourceIds[].
3. Set status to: "valid" (currently in force), "announced" (legislated but not effective yet),
   "transitional" (in force for existing installs only), "expired", or "unclear".
4. NEVER assert facts not present in the retrieved context. Use status="unclear" + uncertainty field instead.
5. Write at layperson level. Add technicalNote for expert details.
6. German language for all user-facing text (text, detail, descriptions, steps, questions).

OUTPUT SCHEMA (return this exact structure):
{
  "regulatoryClaims": [
    {
      "text": "short title",
      "detail": "explanation in plain German",
      "sourceRef": "§ reference · since date",
      "sourceIds": ["chunk-id"],
      "status": "valid|announced|transitional|expired|unclear",
      "uncertainty": "optional note if unclear",
      "technicalNote": "optional expert detail"
    }
  ],
  "subsidies": [
    {
      "name": "full name",
      "shortName": "abbreviation",
      "status": "valid|announced",
      "amount": "amount string",
      "description": "one-line description",
      "warning": "optional warning text"
    }
  ],
  "openPoints": ["list of items needing professional verification"],
  "nextSteps": [
    { "text": "action", "priority": "high|medium|low" }
  ],
  "installerQuestions": ["question with **bold** for key terms"],
  "trafficLight": "green|amber|red"
}"""


def _build_user_message(
    inp: ProjectInput,
    tech: TechnicalSummary,
    operator: Optional[GridOperator],
    chunks: list[RetrievedChunk],
) -> str:
    chunks_text = "\n\n---\n\n".join(
        f"[CHUNK {c.id}] {c.title} ({c.source} · {c.status.value} · from {c.validFrom}"
        f"{f' until {c.validUntil}' if c.validUntil else ''}):\n{c.text}"
        for c in chunks
    )

    components = f"PV{'+storage' if inp.planStorage else ''}"
    if inp.planWallbox:
        components += "+wallbox"
    if inp.planHeatPump:
        components += "+heat_pump"

    return f"""PROJECT INPUT:
{inp.model_dump_json(indent=2)}

TECHNICAL PRE-CALCULATION:
- Estimated system size: {tech.estimatedKwp} kWp
- Module count: {tech.moduleCountMin}–{tech.moduleCountMax}
- Annual yield: {tech.annualKwh} kWh
- Self-consumption: {tech.selfConsumptionPct}% ({tech.selfConsumptionWithStoragePct}% with storage)
- Recommended storage: {tech.recommendedStorageKwh} kWh
- Roof score: {tech.roofScore}/10

GRID OPERATOR: {f"{operator.name}, {operator.city}, {operator.state}" if operator else "Unknown"}

RETRIEVED REGULATORY CONTEXT:
{chunks_text}

Now produce the JSON assessment following the schema in the system prompt.
Focus on rules relevant to this specific project (building type: {inp.buildingType.value},
components: {components})."""


def _parse_assessment(raw_text: str) -> Dict[str, Any]:
    """Strip optional markdown fences and parse JSON."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
    return json.loads(cleaned.strip())


def _build_fallback_result() -> Dict[str, Any]:
    return {
        "regulatoryClaims": [
            {
                "text": "MaStR-Registrierung (Pflicht)",
                "detail": "Binnen 1 Monat nach Inbetriebnahme · marktstammdatenregister.de",
                "sourceRef": "§§3 Nr.1, 5 MaStRV · seit 01.07.2017",
                "sourceIds": ["mastr-rv"],
                "status": "valid",
            },
            {
                "text": "Netzanmeldung vor Installation (Pflicht)",
                "detail": "Mindestens 4 Wochen vor Inbetriebnahme beim Netzbetreiber anzeigen",
                "sourceRef": "§13 NAV · gültig",
                "sourceIds": ["nav-13"],
                "status": "valid",
            },
        ],
        "subsidies": [
            {
                "name": "KfW 270 — Kredit",
                "shortName": "KfW 270",
                "status": "valid",
                "amount": "bis 150.000 EUR",
                "description": "5–30 Jahre · über Hausbank · vor Beauftragung beantragen!",
            }
        ],
        "openPoints": [
            "LLM-Analyse nicht verfügbar — bitte API-Key prüfen",
            "Netzanschlusskapazität beim Netzbetreiber anfragen",
        ],
        "nextSteps": [
            {"text": "Netzanschlussanfrage beim Netzbetreiber stellen", "priority": "high"},
            {"text": "KfW 270 über Hausbank beantragen (vor Beauftragung!)", "priority": "high"},
        ],
        "installerQuestions": [
            "Welche technischen Anforderungen gelten für diesen Netzanschluss?",
            "Wie wird die 70%-Wirkleistungsbegrenzung nach VDE-AR-N 4105 umgesetzt?",
        ],
        "trafficLight": "amber",
        "rawLlmTrace": "FALLBACK — LLM unavailable",
    }


async def call_assessment_llm(
    inp: ProjectInput,
    tech: TechnicalSummary,
    operator: Optional[GridOperator],
    chunks: list[RetrievedChunk],
) -> Dict[str, Any]:
    """Call the Gemini LLM and return a parsed assessment dict."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _build_fallback_result()

    client = _get_client()
    system_prompt = _build_system_prompt()
    user_message = _build_user_message(inp, tech, operator, chunks)

    response = client.models.generate_content(
        model=MODEL,
        contents=f"{system_prompt}\n\n{user_message}",
    )

    raw_text = response.text

    try:
        parsed = _parse_assessment(raw_text)
    except Exception:
        import logging
        logging.error("LLM JSON parse error. Raw output: %s", raw_text)
        raise ValueError("LLM returned invalid JSON")

    parsed["rawLlmTrace"] = raw_text
    return parsed


async def answer_chat_question(
    project_id: str,
    question: str,
    context: Dict[str, Any],
) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"answer": "Chat nicht verfügbar — bitte API-Key prüfen.", "sources": []}

    client = _get_client()
    system_prompt = (
        "You are a German solar PV regulatory expert. Answer concisely in German. "
        "Always cite your sources with §-references. End with a disclaimer that this is not legal advice."
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=f"{system_prompt}\n\nProject context: {json.dumps(context)}\n\nQuestion: {question}",
    )

    return {"answer": response.text, "sources": []}
