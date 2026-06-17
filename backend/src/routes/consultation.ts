import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import {
  createSession,
  getSession,
  addMessage,
  updateSession,
} from '../services/consultationStore';
import {
  getGreeting,
  processMessage,
  generateReportText,
  getPhaseLabel,
} from '../services/consultationService';
import type { ConsultationResponse } from '../types';

const router = Router();

// POST /api/consultation/start — create session and return opening greeting
router.post('/start', (req: Request, res: Response) => {
  const language: 'de' | 'en' = req.body.language === 'en' ? 'en' : 'de';
  const sessionId = uuid();

  const session = createSession(sessionId, language);
  const { message, phase, extractedData, options, reportReady } = getGreeting(language);

  addMessage(sessionId, { role: 'assistant', content: message, timestamp: new Date().toISOString() });
  updateSession(sessionId, { phase, collectedData: extractedData, options, reportReady });

  const response: ConsultationResponse = {
    message,
    phase,
    phaseLabel: getPhaseLabel(phase, language),
    collectedData: session.collectedData,
    options,
    reportReady,
    sessionId,
  };

  return res.json(response);
});

// POST /api/consultation/:id/message — send user message, get AI response
router.post('/:id/message', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message: userMessage } = req.body as { message: string };

  if (!userMessage?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const session = getSession(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Save user message
  addMessage(id, { role: 'user', content: userMessage, timestamp: new Date().toISOString() });

  try {
    const { message, phase, phaseComplete, extractedData, options, reportReady } =
      await processMessage(session, userMessage);

    // Update session state
    const newPhase = phaseComplete && phase < 7 ? phase + 1 : phase;
    updateSession(id, {
      phase: newPhase,
      collectedData: extractedData,
      options: options ?? session.options,
      reportReady,
    });

    // Save assistant message
    addMessage(id, { role: 'assistant', content: message, timestamp: new Date().toISOString() });

    const updatedSession = getSession(id)!;

    const response: ConsultationResponse = {
      message,
      phase: updatedSession.phase,
      phaseLabel: getPhaseLabel(updatedSession.phase, session.language),
      collectedData: updatedSession.collectedData,
      options: updatedSession.options,
      reportReady: updatedSession.reportReady,
      sessionId: id,
    };

    return res.json(response);
  } catch (err) {
    console.error('Consultation message error:', err);

    // Graceful fallback
    const fallback = session.language === 'de'
      ? 'Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten. Bitte versuchen Sie es erneut oder überprüfen Sie die API-Konfiguration.'
      : 'Sorry, I could not process your request. Please try again or check the API configuration.';

    addMessage(id, { role: 'assistant', content: fallback, timestamp: new Date().toISOString() });

    return res.json({
      message: fallback,
      phase: session.phase,
      phaseLabel: getPhaseLabel(session.phase, session.language),
      collectedData: session.collectedData,
      options: session.options,
      reportReady: false,
      sessionId: id,
    } as ConsultationResponse);
  }
});

// GET /api/consultation/:id — get current session state
router.get('/:id', (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  return res.json(session);
});

// GET /api/consultation/:id/report — generate full text report
router.get('/:id/report', async (req: Request, res: Response) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  try {
    const reportText = await generateReportText(session);
    return res.json({ report: reportText, sessionId: req.params.id });
  } catch (err) {
    return res.status(500).json({ error: 'Report generation failed' });
  }
});

export default router;
