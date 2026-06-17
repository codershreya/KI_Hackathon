import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { ProjectInput } from '../types';
import { runAssessmentPipeline } from '../services/assessmentPipeline';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const input: ProjectInput = req.body;

  if (!input.address || !input.roofAreaM2) {
    return res.status(400).json({ error: 'address and roofAreaM2 are required' });
  }

  const projectId = uuid();

  try {
    const result = await runAssessmentPipeline(projectId, input);
    return res.json(result);
  } catch (err) {
    console.error('Assessment pipeline error:', err);
    return res.status(500).json({ error: 'Assessment failed' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  // In production: look up from DB. For MVP, return 404.
  return res.status(404).json({ error: 'Assessment not found (persistence not yet implemented)' });
});

export default router;
