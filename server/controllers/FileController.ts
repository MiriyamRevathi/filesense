import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/FileService';
import { ServerFileCategory, ApiResponse } from '../types';

export class FileController {
  private fileService: FileService;

  constructor(fileService: FileService = new FileService()) {
    this.fileService = fileService;
  }

  public getAllFiles = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { category, search, sortBy, sortOrder } = req.query;

      const files = this.fileService.getAllFiles({
        category: category as ServerFileCategory | undefined,
        search: typeof search === 'string' ? search : undefined,
        sortBy: typeof sortBy === 'string' ? sortBy : undefined,
        sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
      });

      const response: ApiResponse = {
        success: true,
        data: files,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  public getFileById = (req: Request, res: Response, next: NextFunction): void => {
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

      res.json({
        success: true,
        data: file,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public createFileRecord = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { name, size, type, hash, category, tags, base64Content } = req.body;

      if (!name || typeof size !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: name and numeric size',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      let contentBuffer: Buffer | undefined;
      if (base64Content) {
        contentBuffer = Buffer.from(base64Content, 'base64');
      }

      const file = this.fileService.createFileRecord({
        name,
        size,
        type,
        hash,
        category,
        tags,
        contentBuffer,
      });

      res.status(201).json({
        success: true,
        data: file,
        message: 'File record created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public updateCategory = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const { category } = req.body;

      if (!category) {
        res.status(400).json({
          success: false,
          error: 'Category field is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = this.fileService.updateCategory(id, category as ServerFileCategory);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: `File not found with ID: ${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: updated,
        message: 'File category updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public updateTags = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const { tags } = req.body;

      if (!Array.isArray(tags)) {
        res.status(400).json({
          success: false,
          error: 'Tags must be an array of strings',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = this.fileService.updateTags(id, tags);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: `File not found with ID: ${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: updated,
        message: 'Tags updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteFile = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      const deleted = this.fileService.deleteFile(id, hard === 'true');
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: `File not found with ID: ${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'File removed successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteBatch = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { ids, hard } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Missing or empty ids array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const count = this.fileService.deleteFilesBatch(ids, Boolean(hard));
      res.json({
        success: true,
        data: { deletedCount: count },
        message: `Successfully deleted ${count} files`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public seedDemo = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const files = this.fileService.seedDemoFiles();
      res.status(201).json({
        success: true,
        data: files,
        message: `Catalog seeded with ${files.length} demo records`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public clearAll = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { hard } = req.query;
      this.fileService.clearAllFiles(hard === 'true');
      res.json({
        success: true,
        message: 'All files cleared from catalog',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}
