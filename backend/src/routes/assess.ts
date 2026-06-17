import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { ProjectInput } from '../types';
import { runAssessmentPipeline } from '../services/assessmentPipeline';
import { saveAssessment, getAssessment } from '../services/assessmentStore';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const input: ProjectInput = req.body;

  if (!input.address || !input.roofAreaM2) {
    return res.status(400).json({ error: 'address and roofAreaM2 are required' });
  }

  const projectId = uuid();

  try {
    const result = await runAssessmentPipeline(projectId, input);
    saveAssessment(projectId, result);
    return res.json(result);
  } catch (err) {
    console.error('Assessment pipeline error:', err);
    return res.status(500).json({ error: 'Assessment failed' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const result = getAssessment(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Assessment not found' });
  }
  return res.json(result);
});

export default router;
