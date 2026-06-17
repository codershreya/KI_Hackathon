import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import assessRouter from './routes/assess';
import gridOperatorRouter from './routes/gridoperator';
import sourcesRouter from './routes/sources';
import exportRouter from './routes/export';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : '*' }));
app.use(express.json({ limit: '2mb' }));

app.use(
  rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Daily assessment limit reached. Try again tomorrow.' },
  })
);

app.use('/api/assess', assessRouter);
app.use('/api/gridoperator', gridOperatorRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/export', exportRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`Plankton PV backend listening on http://localhost:${PORT}`);
});

export default app;
