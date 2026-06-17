import { Router, Request, Response } from 'express';
import { answerChatQuestion, translateText } from '../services/llmService';
import type { SystemOption } from '../types';

const router = Router();

router.post('/:projectId', async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { question, projectContext, language, selectedOption } = req.body as {
    question: string;
    projectContext?: Record<string, unknown>;
    language?: 'de' | 'en';
    selectedOption?: SystemOption;
  };

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }

  try {
    const answer = await answerChatQuestion(
      projectId,
      question,
      projectContext ?? {},
      language,
      selectedOption
    );
    return res.json(answer);
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

router.post('/:projectId/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage } = req.body as {
    text: string;
    targetLanguage: 'de' | 'en';
  };

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const translatedText = await translateText(text, targetLanguage);
    return res.json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
