import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { createApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

export function createApp(): Express {
  const app = express();

  // Basic CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Body parsers
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Logging
  app.use(requestLogger);

  // Mount API Router
  app.use('/api', createApiRouter());

  // Production or static dist handling
  const distPath = config.paths.dist;
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.get('*', (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Handle remaining unmatched API routes
  app.use('/api/*', notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
