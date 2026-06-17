import type { GeoLocation, GridOperator } from '../types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// Pilot grid operators keyed by German state (Bundesland).
// In production this would be a proper lookup service.
const GRID_OPERATOR_BY_STATE: Record<string, GridOperator> = {
  'Niedersachsen': {
    id: 'avacon',
    name: 'Avacon AG',
    city: '38226 Salzgitter',
    state: 'Niedersachsen',
    portalUrl: 'https://netz.avacon.de',
    email: 'netz@avacon.de',
  },
  'Sachsen-Anhalt': {
    id: 'mitnetz',
    name: 'Mitteldeutsche Netzgesellschaft Strom (MITNETZ)',
    city: '06184 Kabelsketal',
    state: 'Sachsen-Anhalt',
    portalUrl: 'https://www.mitnetz-strom.de',
    email: 'info@mitnetz-strom.de',
  },
  'Bayern': {
    id: 'bayernwerk',
    name: 'Bayernwerk Netz GmbH',
    city: '93049 Regensburg',
    state: 'Bayern',
    portalUrl: 'https://www.bayernwerk-netz.de',
    email: 'info@bayernwerk-netz.de',
  },
  'Baden-Württemberg': {
    id: 'netze-bw',
    name: 'Netze BW GmbH',
    city: '70567 Stuttgart',
    state: 'Baden-Württemberg',
    portalUrl: 'https://www.netze-bw.de',
    email: 'service@netze-bw.de',
  },
  'Nordrhein-Westfalen': {
    id: 'westnetz',
    name: 'Westnetz GmbH',
    city: '44629 Herne',
    state: 'Nordrhein-Westfalen',
    portalUrl: 'https://www.westnetz.de',
    email: 'netzanschluss@westnetz.de',
  },
};

export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  const params = new URLSearchParams({ q: address, format: 'json', limit: '1' });
  const resp = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: { 'User-Agent': 'PlanktonPVAssistant/1.0 (hackathon)' },
  });

  if (!resp.ok) return null;

  const results = (await resp.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!results.length) return null;

  const first = results[0];
  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), format: 'json' });
  const resp = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
    headers: { 'User-Agent': 'PlanktonPVAssistant/1.0 (hackathon)' },
  });

  if (!resp.ok) return null;

  const data = (await resp.json()) as { address?: { state?: string } };
  return data.address?.state ?? null;
}

export async function lookupGridOperator(lat: number, lng: number): Promise<GridOperator | null> {
  const state = await reverseGeocode(lat, lng);
  if (!state) return null;
  return GRID_OPERATOR_BY_STATE[state] ?? null;
}
