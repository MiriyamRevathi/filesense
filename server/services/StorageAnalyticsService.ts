import { FileRepository } from '../repositories/FileRepository';
import { DuplicateEngineService } from './DuplicateEngineService';
import {
  ServerStorageStats,
  ServerCategoryBreakdown,
  ServerSizeBucket,
  ServerFileCategory,
} from '../types';

export class StorageAnalyticsService {
  private repository: FileRepository;
  private duplicateService: DuplicateEngineService;

  constructor(
    repository: FileRepository = FileRepository.getInstance(),
    duplicateService: DuplicateEngineService = new DuplicateEngineService(repository)
  ) {
    this.repository = repository;
    this.duplicateService = duplicateService;
  }

  public getStorageStats(): ServerStorageStats {
    const files = this.repository.getAll(false);
    const dupScan = this.duplicateService.scanDuplicates();

    let totalBytes = 0;
    const categoryBytesMap: Record<ServerFileCategory, { count: number; bytes: number }> = {
      images: { count: 0, bytes: 0 },
      documents: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      code: { count: 0, bytes: 0 },
      archives: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 },
    };

    const sizeBuckets: ServerSizeBucket[] = [
      { range: '<1MB', label: 'Tiny (< 1 MB)', count: 0, bytes: 0 },
      { range: '1-10MB', label: 'Small (1 - 10 MB)', count: 0, bytes: 0 },
      { range: '10-50MB', label: 'Medium (10 - 50 MB)', count: 0, bytes: 0 },
      { range: '50-250MB', label: 'Large (50 - 250 MB)', count: 0, bytes: 0 },
      { range: '>250MB', label: 'Huge (> 250 MB)', count: 0, bytes: 0 },
    ];

    for (const f of files) {
      totalBytes += f.size;

      // Category breakdown
      const catData = categoryBytesMap[f.category] || categoryBytesMap.other;
      catData.count += 1;
      catData.bytes += f.size;

      // Size bucket
      const sizeMB = f.size / (1024 * 1024);
      if (sizeMB < 1) {
        sizeBuckets[0].count++;
        sizeBuckets[0].bytes += f.size;
      } else if (sizeMB < 10) {
        sizeBuckets[1].count++;
        sizeBuckets[1].bytes += f.size;
      } else if (sizeMB < 50) {
        sizeBuckets[2].count++;
        sizeBuckets[2].bytes += f.size;
      } else if (sizeMB < 250) {
        sizeBuckets[3].count++;
        sizeBuckets[3].bytes += f.size;
      } else {
        sizeBuckets[4].count++;
        sizeBuckets[4].bytes += f.size;
      }
    }

    const categoryColors: Record<ServerFileCategory, string> = {
      images: '#8064E9',
      documents: '#4B36A2',
      audio: '#F59E0B',
      video: '#EF4444',
      code: '#10B981',
      archives: '#6366F1',
      other: '#9CA3AF',
    };

    const categoryLabels: Record<ServerFileCategory, string> = {
      images: 'Images',
      documents: 'Documents',
      audio: 'Audio',
      video: 'Video',
      code: 'Code & Data',
      archives: 'Archives',
      other: 'Other',
    };

    const categoryBreakdown: ServerCategoryBreakdown[] = Object.keys(categoryBytesMap).map(catKey => {
      const cat = catKey as ServerFileCategory;
      const data = categoryBytesMap[cat];
      const percentage = totalBytes > 0 ? Math.round((data.bytes / totalBytes) * 1000) / 10 : 0;
      return {
        category: cat,
        label: categoryLabels[cat] || cat,
        count: data.count,
        bytes: data.bytes,
        percentage,
        color: categoryColors[cat] || '#8064E9',
      };
    });

    const largestFiles = [...files]
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    const recentFiles = [...files]
      .sort((a, b) => b.dateAdded - a.dateAdded)
      .slice(0, 10);

    const averageFileSize = files.length > 0 ? Math.round(totalBytes / files.length) : 0;
    const wastePercentage = totalBytes > 0 ? Math.round((dupScan.wastedBytesTotal / totalBytes) * 1000) / 10 : 0;

    // Storage health score: 100 base, penalized by waste percentage and unhashed count
    const unhashedCount = files.filter(f => !f.hash).length;
    let storageHealthScore = 100;
    storageHealthScore -= Math.min(50, wastePercentage * 1.5);
    storageHealthScore -= Math.min(20, (unhashedCount / Math.max(1, files.length)) * 20);
    storageHealthScore = Math.max(10, Math.round(storageHealthScore));

    return {
      totalFiles: files.length,
      totalBytes,
      duplicateGroupsCount: dupScan.duplicateGroupsFound,
      duplicateFilesCount: dupScan.duplicateFilesCount,
      reclaimableBytes: dupScan.wastedBytesTotal,
      categoryBreakdown,
      largestFiles,
      recentFiles,
      sizeDistribution: sizeBuckets,
      storageHealthScore,
      averageFileSize,
      wastePercentage,
    };
  }
}
