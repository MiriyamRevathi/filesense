import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/AiService';
import { FileService } from '../services/FileService';
import { ApiResponse } from '../types';

export class AiController {
  private aiService: AiService;
  private fileService: FileService;

  constructor(
    aiService: AiService = new AiService(),
    fileService: FileService = new FileService()
  ) {
    this.aiService = aiService;
    this.fileService = fileService;
  }

  public analyzeFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const file = this.fileService.getFileById(id);

      if (!file) {
        res.status(404).json({
          success: false,
          error: `File not found with ID: ${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await this.aiService.analyzeFile({
        fileId: file.id,
        filename: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      // Automatically enrich file with AI tags and summary
      if (result.suggestedTags.length > 0) {
        const combined = Array.from(new Set([...file.tags, ...result.suggestedTags]));
        this.fileService.updateTags(file.id, combined);
      }

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'AI file analysis completed',
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  public getCatalogAudit = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.aiService.generateCatalogAudit();
      res.json({
        success: true,
        data: report,
        message: 'AI catalog optimization audit generated',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public batchAutoTag = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = this.fileService.getAllFiles();
      let updatedCount = 0;

      for (const f of files) {
        if (!f.tags || f.tags.length === 0) {
          const analysis = await this.aiService.analyzeFile({
            fileId: f.id,
            filename: f.name,
            mimeType: f.type,
            fileSizeBytes: f.size,
          });

          this.fileService.updateTags(f.id, analysis.suggestedTags);
          updatedCount++;
        }
      }

      res.json({
        success: true,
        data: { updatedCount },
        message: `Generated AI taxonomy tags for ${updatedCount} files`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}
