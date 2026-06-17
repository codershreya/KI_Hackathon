"""Tender / installer brief generator."""
from __future__ import annotations

import json
import os
from typing import Any, Dict

import anthropic

from app.models import AssessmentResult


def _get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _build_fallback_tender(assessment: AssessmentResult) -> Dict[str, Any]:
    ts = assessment.technicalSummary
    components = ["PV-Anlage"]
    specs: Dict[str, Any] = {
        "estimatedKwp": ts.estimatedKwp,
        "moduleCountEstimate": f"{ts.moduleCountMin}–{ts.moduleCountMax}",
        "annualYieldKwh": ts.annualKwh,
        "recommendedStorageKwh": ts.recommendedStorageKwh,
    }
    if assessment.gridOperator:
        specs["gridOperator"] = assessment.gridOperator.name

    tender_text = f"""ANFRAGE FÜR PV-ANGEBOT

Sehr geehrte Damen und Herren,

ich plane die Installation einer PV-Anlage und bitte um ein Angebot.

TECHNISCHE ECKDATEN (Vorplanung):
- Geplante Anlagengröße: ca. {ts.estimatedKwp} kWp
- Geschätzte Modulanzahl: {ts.moduleCountMin}–{ts.moduleCountMax}
- Jahresertrag (erwartet): ca. {ts.annualKwh:,} kWh
- Empfohlene Speichergröße: {ts.recommendedStorageKwh} kWh
- Dachscore: {ts.roofScore}/10 · Ausrichtung: {ts.orientation}

GEPLANTE KOMPONENTEN: {', '.join(components)}

OFFENE PUNKTE FÜR DEN INSTALLATEUR:
{chr(10).join(f'- {q}' for q in assessment.installerQuestions[:5])}

Mit freundlichen Grüßen"""

    return {
        "tenderText": tender_text,
        "suggestedQuestions": assessment.installerQuestions,
        "technicalSpecs": specs,
    }


async def generate_tender(assessment: AssessmentResult) -> Dict[str, Any]:
    """Generate a structured installer tender brief from an assessment."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _build_fallback_tender(assessment)

    client = _get_client()
    ts = assessment.technicalSummary

    prompt = f"""Erstelle eine professionelle Angebotsanfrage auf Deutsch für einen PV-Installateur.

PROJEKTDATEN:
- Anlagengröße: {ts.estimatedKwp} kWp
- Module: {ts.moduleCountMin}–{ts.moduleCountMax}
- Jahresertrag: {ts.annualKwh} kWh
- Eigenverbrauch: {ts.selfConsumptionPct}% (mit Speicher: {ts.selfConsumptionWithStoragePct}%)
- Empfohlener Speicher: {ts.recommendedStorageKwh} kWh
- Netzbetreiber: {assessment.gridOperator.name if assessment.gridOperator else 'unbekannt'}
- Installateur-Fragen: {json.dumps(assessment.installerQuestions, ensure_ascii=False)}
- Nächste Schritte: {json.dumps([s.text for s in assessment.nextSteps], ensure_ascii=False)}

Antworte NUR mit gültigem JSON (kein Markdown):
{{
  "tenderText": "<vollständige Angebotsanfrage als Fließtext auf Deutsch>",
  "suggestedQuestions": ["<Frage 1>", "<Frage 2>", ...],
  "technicalSpecs": {{
    "estimatedKwp": {ts.estimatedKwp},
    "moduleCountEstimate": "{ts.moduleCountMin}–{ts.moduleCountMax}",
    "annualYieldKwh": {ts.annualKwh},
    "recommendedStorageKwh": {ts.recommendedStorageKwh}
  }}
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        temperature=0.3,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = "".join(b.text for b in message.content if b.type == "text")
    try:
        cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(cleaned)
    except Exception:
        return _build_fallback_tender(assessment)
