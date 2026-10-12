import { Request, Response, NextFunction } from 'express';
import { DuplicateEngineService } from '../services/DuplicateEngineService';
import { ApiResponse } from '../types';

export class DuplicateController {
  private duplicateService: DuplicateEngineService;

  constructor(duplicateService: DuplicateEngineService = new DuplicateEngineService()) {
    this.duplicateService = duplicateService;
  }

  public scan = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.duplicateService.scanDuplicates();
      const response: ApiResponse = {
        success: true,
        data: result,
        message: `Scanned ${result.scannedCount} files; identified ${result.duplicateGroupsFound} duplicate clusters.`,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  public getGroups = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = this.duplicateService.scanDuplicates();
      res.json({
        success: true,
        data: result.groups,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public resolve = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { strategy, groupIds, customKeepFileIds, dryRun } = req.body;

      if (!strategy) {
        res.status(400).json({
          success: false,
          error: 'Strategy is required (keep-oldest, keep-newest, keep-largest-name, custom)',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const report = this.duplicateService.resolveDuplicates({
        strategy,
        groupIds,
        customKeepFileIds,
        dryRun: Boolean(dryRun),
      });

      res.json({
        success: true,
        data: report,
        message: `Resolved duplicates: ${report.filesDeletedCount} redundant files removed, ${report.bytesReclaimed} bytes reclaimed.`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteInGroup = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { groupId } = req.params;
      const { fileIds } = req.body;

      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'fileIds must be a non-empty array of file IDs to delete',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = this.duplicateService.deleteDuplicatesInGroup(groupId, fileIds);
      res.json({
        success: true,
        data: result,
        message: `Removed ${result.deletedCount} files from duplicate group ${groupId}`,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}
