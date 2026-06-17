import { Router, Request, Response } from 'express';
import regulatorySources from '../knowledge/regulatorySources.json';
import type { RegulatoryDocument, RegulatoryStatus } from '../types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const tagsParam = req.query.tags as string | undefined;
  const statusParam = req.query.status as RegulatoryStatus | undefined;
  const page = parseInt(req.query.page as string ?? '1', 10);
  const limit = parseInt(req.query.limit as string ?? '20', 10);

  let docs: RegulatoryDocument[] = regulatorySources as RegulatoryDocument[];

  if (tagsParam) {
    const tags = tagsParam.split(',').map((t) => t.trim());
    docs = docs.filter((d) => tags.some((t) => d.tags.includes(t)));
  }
  if (statusParam) {
    docs = docs.filter((d) => d.status === statusParam);
  }

  const start = (page - 1) * limit;
  return res.json({
    total: docs.length,
    page,
    limit,
    data: docs.slice(start, start + limit),
  });
});

export default router;
