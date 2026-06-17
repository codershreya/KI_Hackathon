import axios from 'axios';
import type {
  AssessmentResult,
  GeocodeResult,
  GridOperator,
  IrradianceResult,
  ProjectInput,
  RegulatoryDocument,
  RoofImageResult,
  TenderResult,
} from '../types';

const api = axios.create({ baseURL: '/api' });

// ── Assessment ───────────────────────────────────────────────────────────────

export async function assess(input: ProjectInput): Promise<AssessmentResult> {
  const { data } = await api.post<AssessmentResult>('/assess', input);
  return data;
}

export async function getAssessment(id: string): Promise<AssessmentResult> {
  const { data } = await api.get<AssessmentResult>(`/assess/${id}`);
  return data;
}

// ── Geocode ──────────────────────────────────────────────────────────────────

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { data } = await api.get<GeocodeResult>('/geocode', { params: { address } });
  return data;
}

// ── Grid operator ────────────────────────────────────────────────────────────

export async function lookupGridOperator(lat: number, lng: number): Promise<GridOperator | null> {
  try {
    const { data } = await api.get<GridOperator>('/gridoperator', { params: { lat, lng } });
    return data;
  } catch {
    return null;
  }
}

// ── Sources ──────────────────────────────────────────────────────────────────

export async function getSources(
  tags?: string[],
  status?: string,
  page = 1,
  limit = 20
): Promise<{ total: number; page: number; limit: number; data: RegulatoryDocument[] }> {
  const { data } = await api.get('/sources', {
    params: { tags: tags?.join(','), status, page, limit },
  });
  return data;
}

export async function getSource(sourceId: string): Promise<RegulatoryDocument> {
  const { data } = await api.get<RegulatoryDocument>(`/sources/${sourceId}`);
  return data;
}

// ── Irradiance ───────────────────────────────────────────────────────────────

export async function getIrradiance(
  lat: number,
  lng: number,
  roofAreaM2: number,
  orientation: string,
  pitch: number
): Promise<IrradianceResult> {
  const { data } = await api.get<IrradianceResult>('/irradiance', {
    params: { lat, lng, roofAreaM2, orientation, pitch },
  });
  return data;
}

// ── Roof image ───────────────────────────────────────────────────────────────

export async function analyzeRoofImage(file: File): Promise<RoofImageResult> {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post<RoofImageResult>('/roof-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── PDF Export ───────────────────────────────────────────────────────────────

export async function downloadPdf(
  projectId: string,
  assessment: AssessmentResult
): Promise<Blob> {
  const { data } = await api.post(`/export/${projectId}`, assessment, {
    responseType: 'blob',
  });
  return data;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  projectId: string,
  question: string,
  projectContext?: Record<string, unknown>
): Promise<{ answer: string; sources: string[] }> {
  const { data } = await api.post(`/chat/${projectId}`, { question, projectContext });
  return data;
}

// ── Tender ───────────────────────────────────────────────────────────────────

export async function generateTender(
  projectId: string,
  assessment: AssessmentResult
): Promise<TenderResult> {
  const { data } = await api.post<TenderResult>(`/tender/${projectId}`, assessment);
  return data;
}
