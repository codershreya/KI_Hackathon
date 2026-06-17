import { Router, Request, Response } from 'express';
import { lookupGridOperator } from '../services/geocoding';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng query params are required' });
  }

  try {
    const operator = await lookupGridOperator(lat, lng);
    if (!operator) return res.status(404).json({ error: 'Grid operator not found for this location' });
    return res.json(operator);
  } catch (err) {
    console.error('Grid operator lookup error:', err);
    return res.status(500).json({ error: 'Lookup failed' });
  }
});

export default router;
