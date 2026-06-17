import type { AssessmentResult } from '../types';

const store = new Map<string, AssessmentResult>();

export const saveAssessment = (id: string, result: AssessmentResult): void => {
  store.set(id, result);
};

export const getAssessment = (id: string): AssessmentResult | null => {
  return store.get(id) ?? null;
};
