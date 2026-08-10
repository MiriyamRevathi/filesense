/**
 * Root Server Entry Point
 * Delegates to structured application server in server/index.ts
 */
import { bootstrapServer } from './server/index';

bootstrapServer().catch((err) => {
  console.error('[FileSense] Failed to start application server:', err);
  process.exit(1);
});
