"""Geocoding & grid-operator lookup — port of services/geocoding.ts."""
from __future__ import annotations

from typing import Optional

import httpx

from app.models import GeoLocation, GridOperator

NOMINATIM_URL = "https://nominatim.openstreetmap.org"
_HEADERS = {"User-Agent": "PlanktonPVAssistant/1.0 (hackathon)"}

# Pilot grid operators keyed by German state (Bundesland).
# In production this would be a proper lookup service.
_GRID_OPERATOR_BY_STATE: dict[str, GridOperator] = {
    "Niedersachsen": GridOperator(
        id="avacon",
        name="Avacon AG",
        city="38226 Salzgitter",
        state="Niedersachsen",
        portalUrl="https://netz.avacon.de",
        email="netz@avacon.de",
    ),
    "Sachsen-Anhalt": GridOperator(
        id="mitnetz",
        name="Mitteldeutsche Netzgesellschaft Strom (MITNETZ)",
        city="06184 Kabelsketal",
        state="Sachsen-Anhalt",
        portalUrl="https://www.mitnetz-strom.de",
        email="info@mitnetz-strom.de",
    ),
    "Bayern": GridOperator(
        id="bayernwerk",
        name="Bayernwerk Netz GmbH",
        city="93049 Regensburg",
        state="Bayern",
        portalUrl="https://www.bayernwerk-netz.de",
        email="info@bayernwerk-netz.de",
    ),
    "Baden-Württemberg": GridOperator(
        id="netze-bw",
        name="Netze BW GmbH",
        city="70567 Stuttgart",
        state="Baden-Württemberg",
        portalUrl="https://www.netze-bw.de",
        email="service@netze-bw.de",
    ),
    "Nordrhein-Westfalen": GridOperator(
        id="westnetz",
        name="Westnetz GmbH",
        city="44629 Herne",
        state="Nordrhein-Westfalen",
        portalUrl="https://www.westnetz.de",
        email="netzanschluss@westnetz.de",
    ),
}


async def geocode_address(address: str) -> Optional[GeoLocation]:
    params = {"q": address, "format": "json", "limit": "1"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{NOMINATIM_URL}/search", params=params, headers=_HEADERS)
    if not resp.is_success:
        return None
    results = resp.json()
    if not results:
        return None
    first = results[0]
    return GeoLocation(
        lat=float(first["lat"]),
        lng=float(first["lon"]),
        displayName=first["display_name"],
    )


async def reverse_geocode(lat: float, lng: float) -> Optional[str]:
    params = {"lat": str(lat), "lon": str(lng), "format": "json"}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{NOMINATIM_URL}/reverse", params=params, headers=_HEADERS)
    if not resp.is_success:
        return None
    data = resp.json()
    return data.get("address", {}).get("state")


async def lookup_grid_operator(lat: float, lng: float) -> Optional[GridOperator]:
    state = await reverse_geocode(lat, lng)
    if not state:
        return None
    return _GRID_OPERATOR_BY_STATE.get(state)
