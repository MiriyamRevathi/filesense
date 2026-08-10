import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(rootDir, 'data');

const uploadsDir = path.join(dataDir, 'uploads');
const dbFilePath = path.join(dataDir, 'filesense_catalog.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  paths: {
    root: rootDir,
    data: dataDir,
    uploads: uploadsDir,
    dbFile: dbFilePath,
    dist: path.join(rootDir, 'dist'),
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
  storage: {
    maxUploadSizeBytes: 100 * 1024 * 1024, // 100MB
    defaultQuotaBytes: 10 * 1024 * 1024 * 1024, // 10GB
    supportedHashAlgorithms: ['SHA-256', 'SHA-1', 'MD5'],
    defaultHashAlgorithm: 'SHA-256',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  },
};
