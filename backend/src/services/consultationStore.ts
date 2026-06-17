import type { ConsultationSession, CollectedData, RecommendationOption, ConsultationMessage } from '../types';

const store = new Map<string, ConsultationSession>();

export function createSession(id: string, language: 'de' | 'en'): ConsultationSession {
  const session: ConsultationSession = {
    id,
    messages: [],
    phase: 1,
    collectedData: {},
    options: null,
    reportReady: false,
    language,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.set(id, session);
  return session;
}

export function getSession(id: string): ConsultationSession | null {
  return store.get(id) ?? null;
}

export function addMessage(id: string, msg: ConsultationMessage): void {
  const session = store.get(id);
  if (!session) return;
  session.messages.push(msg);
  session.updatedAt = new Date().toISOString();
}

export function updateSession(
  id: string,
  updates: {
    phase?: number;
    collectedData?: Partial<CollectedData>;
    options?: RecommendationOption[] | null;
    reportReady?: boolean;
  }
): void {
  const session = store.get(id);
  if (!session) return;
  if (updates.phase !== undefined) session.phase = updates.phase;
  if (updates.collectedData) session.collectedData = { ...session.collectedData, ...updates.collectedData };
  if (updates.options !== undefined) session.options = updates.options;
  if (updates.reportReady !== undefined) session.reportReady = updates.reportReady;
  session.updatedAt = new Date().toISOString();
}
