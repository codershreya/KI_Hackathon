"""Roof image analysis using Claude Vision (multimodal)."""
from __future__ import annotations

import base64
import os

import anthropic


def _get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


async def analyze_roof_image(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    """
    Send a roof photo to Claude Vision for analysis.
    Returns a structured dict with roof score, area estimate, orientation, shading notes.
    Falls back to a neutral result if no API key is available.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return _fallback_result()

    client = _get_client()
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    prompt = """Analysiere dieses Dachfoto für eine Photovoltaik-Planung.

Antworte NUR mit gültigem JSON (kein Markdown):
{
  "roofScoreEstimate": <0-10, wobei 10 = optimal für PV>,
  "estimatedAreaM2": <geschätzte nutzbare Dachfläche in m² oder null wenn nicht erkennbar>,
  "orientationHint": <"S"|"SE"|"SW"|"E"|"W"|"N"|"NE"|"NW" oder null wenn nicht erkennbar>,
  "shadingNotes": ["Liste möglicher Verschattungsquellen (Schornsteine, Bäume, etc.)"],
  "confidence": <"high"|"medium"|"low">,
  "notes": ["Weitere relevante Beobachtungen"]
}

Bewertungskriterien:
- Ausrichtung (Süd = optimal), Neigung (~30° = optimal)
- Sichtbare Verschattung durch Aufbauten, Bäume, Nachbargebäude
- Dachzustand und freie nutzbare Fläche
- Komplexität der Dachgeometrie"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    raw = "".join(b.text for b in message.content if b.type == "text")

    import json
    try:
        cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(cleaned)
    except Exception:
        return _fallback_result()


def _fallback_result() -> dict:
    return {
        "roofScoreEstimate": 7.0,
        "estimatedAreaM2": None,
        "orientationHint": None,
        "shadingNotes": ["Keine Bildanalyse verfügbar — bitte Daten manuell eingeben"],
        "confidence": "low",
        "notes": ["API-Key nicht konfiguriert oder Analyse fehlgeschlagen"],
    }
