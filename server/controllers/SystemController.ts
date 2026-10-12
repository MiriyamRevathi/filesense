import { Request, Response } from 'express';
import { FileRepository } from '../repositories/FileRepository';
import { config } from '../config';
import { ApiResponse } from '../types';

export class SystemController {
  private repository: FileRepository;

  constructor(repository: FileRepository = FileRepository.getInstance()) {
    this.repository = repository;
  }

  public getHealth = (_req: Request, res: Response): void => {
    const totalFiles = this.repository.count(false);
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'ok',
        app: 'FileSense',
        version: '1.0.0',
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageBytes: process.memoryUsage().heapUsed,
        totalFilesIndexed: totalFiles,
        storageEngine: 'hybrid-local-indexeddb',
        hashAlgorithm: config.storage.defaultHashAlgorithm,
        geminiConfigured: Boolean(config.gemini.apiKey),
      },
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  };

  public getInfo = (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: {
        app: 'FileSense',
        version: '1.0.0',
        description: 'Smart Local File Organizer & Cryptographic SHA-256 Duplicate Cleaner',
        nodeVersion: process.version,
        platform: process.platform,
        environment: config.env,
        capabilities: [
          'MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API',
          'CRYPTOGRAPHIC_SHA256_DEDUPLICATION',
          'REALTIME_STORAGE_ANALYTICS',
          'OFFLINE_INDEXEDDB_CACHE',
        ],
      },
      timestamp: new Date().toISOString(),
    });
  };
}
