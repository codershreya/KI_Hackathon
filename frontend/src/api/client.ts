import axios from 'axios';
import type { AssessmentResult, GridOperator, ProjectInput, RegulatoryDocument, SystemOption } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function assess(input: ProjectInput & { language?: string }): Promise<AssessmentResult> {
  const { data } = await api.post<AssessmentResult>('/assess', { ...input, language: 'en' });
  return data;
}

export async function getAssessment(id: string): Promise<AssessmentResult> {
  const { data } = await api.get<AssessmentResult>(`/assessment/${id}`);
  return data;
}

export async function lookupGridOperator(lat: number, lng: number): Promise<GridOperator | null> {
  const { data } = await api.get<GridOperator>('/gridoperator', { params: { lat, lng } });
  return data;
}

export async function getSources(
  tags?: string[],
  status?: string,
  limit?: number
): Promise<RegulatoryDocument[]> {
  const { data } = await api.get<{ total: number; page: number; limit: number; data: RegulatoryDocument[] }>('/sources', {
    params: { tags: tags?.join(','), status, limit: limit ?? 100 },
  });
  return data.data;
}

export async function downloadPdf(projectId: string): Promise<Blob> {
  const { data } = await api.post(`/export/${projectId}`, {}, { responseType: 'blob' });
  return data;
}

export async function sendChatMessage(
  projectId: string,
  question: string,
  selectedOption?: SystemOption | null
): Promise<{ answer: string; sources: string[] }> {
  const { data } = await api.post(`/chat/${projectId}`, {
    question,
    language: 'en',
    selectedOption: selectedOption ?? undefined,
  });
  return data;
}
