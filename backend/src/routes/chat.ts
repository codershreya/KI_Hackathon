import { Router, Request, Response } from 'express';
import { answerChatQuestion } from '../services/llmService';

const router = Router();

router.post('/:projectId', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { question, projectContext } = req.body as {
    question: string;
    projectContext?: Record<string, unknown>;
  };

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const answer = await answerChatQuestion(projectId, question, projectContext ?? {});
    return res.json(answer);
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

export default router;
