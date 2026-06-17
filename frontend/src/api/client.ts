import axios from 'axios';
import type { AssessmentResult, GridOperator, ProjectInput, RegulatoryDocument } from '../types';

const api = axios.create({ baseURL: '/api' });

export async function assess(input: ProjectInput): Promise<AssessmentResult> {
  const { data } = await api.post<AssessmentResult>('/assess', input);
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
  status?: string
): Promise<RegulatoryDocument[]> {
  const { data } = await api.get<RegulatoryDocument[]>('/sources', {
    params: { tags: tags?.join(','), status },
  });
  return data;
}

export async function downloadPdf(projectId: string): Promise<Blob> {
  const { data } = await api.post(`/export/${projectId}`, {}, { responseType: 'blob' });
  return data;
}

export async function sendChatMessage(
  projectId: string,
  question: string
): Promise<{ answer: string; sources: string[] }> {
  const { data } = await api.post(`/chat/${projectId}`, { question });
  return data;
}
