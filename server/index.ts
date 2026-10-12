import http from 'http';
import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { config } from './config';
import { FileRepository } from './repositories/FileRepository';
import { FileService } from './services/FileService';

export async function bootstrapServer(): Promise<http.Server> {
  const app = createApp();

  // If in development mode and dist does not exist, attach Vite middleware
  if (config.env !== 'production' && !fs.existsSync(config.paths.dist)) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[FileSense] Vite development middleware attached');
    } catch (err) {
      console.warn('[FileSense] Note: Vite dev middleware could not be loaded, static fallback active:', err);
    }
  }

  // Ensure repository has initial files
  const repository = FileRepository.getInstance();
  if (repository.count(false) === 0) {
    const fileService = new FileService(repository);
    fileService.seedDemoFiles();
    console.log('[FileSense] Initialized catalog with demo file assets');
  }

  const server = http.createServer(app);

  server.listen(config.port, config.host, () => {
    console.log(`====================================================`);
    console.log(`[FileSense] Server running on http://${config.host}:${config.port}`);
    console.log(`[FileSense] Environment: ${config.env}`);
    console.log(`[FileSense] API Base:    http://${config.host}:${config.port}/api`);
    console.log(`====================================================`);
  });

  return server;
}

// Auto-run when executed directly
if (process.argv[1] && (process.argv[1].endsWith('server/index.ts') || process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts'))) {
  bootstrapServer().catch(err => {
    console.error('[FileSense] Fatal bootstrap error:', err);
    process.exit(1);
  });
}
