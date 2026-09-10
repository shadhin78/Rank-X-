import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { scoringRouter } from './server/routes/scoring';
import { adminRouter } from './server/routes/admin';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'StudyRank Secure Scoring & Admin Engine' });
  });

  // Secure Scoring Engine API
  app.use('/api/scoring', scoringRouter);

  // Secure Server-Enforced Administration API
  app.use('/api/admin', adminRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StudyRank] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
