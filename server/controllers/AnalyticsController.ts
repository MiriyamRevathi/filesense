import { Request, Response, NextFunction } from 'express';
import { StorageAnalyticsService } from '../services/StorageAnalyticsService';
import { ApiResponse } from '../types';

export class AnalyticsController {
  private analyticsService: StorageAnalyticsService;

  constructor(analyticsService: StorageAnalyticsService = new StorageAnalyticsService()) {
    this.analyticsService = analyticsService;
  }

  public getStats = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const stats = this.analyticsService.getStorageStats();
      const response: ApiResponse = {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  };

  public getCategoryBreakdown = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const stats = this.analyticsService.getStorageStats();
      res.json({
        success: true,
        data: stats.categoryBreakdown,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };

  public getSizeDistribution = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const stats = this.analyticsService.getStorageStats();
      res.json({
        success: true,
        data: stats.sizeDistribution,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  };
}
