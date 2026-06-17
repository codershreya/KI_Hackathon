import { Router, Request, Response } from 'express';
import { generatePdf } from '../services/pdfExport';

const router = Router();

router.post('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // In a full implementation, load the stored assessment by id.
  // For MVP, accept the assessment in the request body.
  const assessment = req.body;

  if (!assessment || !assessment.projectId) {
    return res.status(400).json({ error: 'Assessment data required in request body' });
  }

  try {
    const pdfBuffer = await generatePdf(assessment);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="plankton-pv-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'PDF generation failed' });
  }
});

export default router;
