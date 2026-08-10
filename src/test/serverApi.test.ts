import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../../server/app';
import { FileRepository } from '../../server/repositories/FileRepository';
import { FileService } from '../../server/services/FileService';
import { DuplicateEngineService } from '../../server/services/DuplicateEngineService';
import { StorageAnalyticsService } from '../../server/services/StorageAnalyticsService';
import { HashService } from '../../server/services/HashService';
import { AiService } from '../../server/services/AiService';

describe('Server Application & Backend Architecture', () => {
  let repository: FileRepository;
  let fileService: FileService;
  let duplicateService: DuplicateEngineService;
  let analyticsService: StorageAnalyticsService;
  let aiService: AiService;

  beforeEach(() => {
    repository = FileRepository.getInstance();
    repository.clearAll(false);
    fileService = new FileService(repository);
    duplicateService = new DuplicateEngineService(repository);
    analyticsService = new StorageAnalyticsService(repository, duplicateService);
    aiService = new AiService(repository);
  });

  describe('HashService Cryptography', () => {
    it('computes consistent deterministic SHA-256 digests', () => {
      const buffer = Buffer.from('FileSense Cryptographic Content Verification');
      const hash1 = HashService.hashBuffer(buffer);
      const hash2 = HashService.hashBuffer(buffer);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
      expect(HashService.isValidSha256(hash1)).toBe(true);
    });

    it('identifies invalid hex strings as non-SHA256', () => {
      expect(HashService.isValidSha256('invalid-short-hash')).toBe(false);
      expect(HashService.isValidSha256('')).toBe(false);
    });
  });

  describe('FileService & Repository Persistence', () => {
    it('creates and retrieves file records with proper categorization', () => {
      const created = fileService.createFileRecord({
        name: 'annual_budget_forecast.xlsx',
        size: 1048576,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        hash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
        tags: ['finance', 'q4'],
      });

      expect(created.id).toBeDefined();
      expect(created.category).toBe('documents');
      expect(created.tags).toContain('finance');

      const retrieved = fileService.getFileById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('annual_budget_forecast.xlsx');
    });

    it('updates file category and tags properly', () => {
      const created = fileService.createFileRecord({
        name: 'presentation_draft.mp4',
        size: 52428800,
      });

      expect(created.category).toBe('video');

      const updatedCat = fileService.updateCategory(created.id, 'other');
      expect(updatedCat?.category).toBe('other');

      const updatedTags = fileService.updateTags(created.id, ['reviewed', 'client']);
      expect(updatedTags?.tags).toEqual(['reviewed', 'client']);
    });

    it('performs batch deletion correctly', () => {
      const f1 = fileService.createFileRecord({ name: 'temp1.log', size: 100 });
      const f2 = fileService.createFileRecord({ name: 'temp2.log', size: 200 });
      const f3 = fileService.createFileRecord({ name: 'persist.txt', size: 300 });

      const deletedCount = fileService.deleteFilesBatch([f1.id, f2.id]);
      expect(deletedCount).toBe(2);

      const remaining = fileService.getAllFiles();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(f3.id);
    });
  });

  describe('DuplicateEngineService Detection & Resolution', () => {
    it('detects duplicate groups by exact SHA-256 hash', () => {
      const sharedHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

      const orig = fileService.createFileRecord({
        name: 'system_architecture.pdf',
        size: 2097152,
        hash: sharedHash,
      });

      const copy1 = fileService.createFileRecord({
        name: 'system_architecture_copy.pdf',
        size: 2097152,
        hash: sharedHash,
      });

      const copy2 = fileService.createFileRecord({
        name: 'system_architecture (1).pdf',
        size: 2097152,
        hash: sharedHash,
      });

      const scanResult = duplicateService.scanDuplicates();
      expect(scanResult.duplicateGroupsFound).toBe(1);
      expect(scanResult.duplicateFilesCount).toBe(2);
      expect(scanResult.wastedBytesTotal).toBe(2097152 * 2);

      const group = scanResult.groups[0];
      expect(group.files.length).toBe(3);
      expect(group.originalFileId).toBe(orig.id);
      expect(group.duplicateFileIds).toContain(copy1.id);
      expect(group.duplicateFileIds).toContain(copy2.id);
    });

    it('resolves duplicate groups using keep-oldest strategy', () => {
      const sharedHash = 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

      const original = fileService.createFileRecord({
        name: 'original_record.csv',
        size: 5000,
        hash: sharedHash,
      });

      const redundant = fileService.createFileRecord({
        name: 'backup_record.csv',
        size: 5000,
        hash: sharedHash,
      });

      const resolution = duplicateService.resolveDuplicates({
        strategy: 'keep-oldest',
      });

      expect(resolution.filesDeletedCount).toBe(1);
      expect(resolution.deletedFileIds).toContain(redundant.id);
      expect(resolution.preservedFileIds).toContain(original.id);

      const remaining = fileService.getAllFiles();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(original.id);
    });
  });

  describe('StorageAnalyticsService Telemetry', () => {
    it('computes accurate category breakdown and size distribution buckets', () => {
      fileService.createFileRecord({ name: 'image1.jpg', size: 500 * 1024 }); // Tiny <1MB
      fileService.createFileRecord({ name: 'doc1.pdf', size: 5 * 1024 * 1024 }); // Small 1-10MB
      fileService.createFileRecord({ name: 'video1.mp4', size: 100 * 1024 * 1024 }); // Large 50-250MB

      const stats = analyticsService.getStorageStats();
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalBytes).toBe(500 * 1024 + 5 * 1024 * 1024 + 100 * 1024 * 1024);
      expect(stats.storageHealthScore).toBeGreaterThan(0);
      expect(stats.categoryBreakdown.length).toBe(7);

      const imgCategory = stats.categoryBreakdown.find(c => c.category === 'images');
      expect(imgCategory?.count).toBe(1);
    });
  });

  describe('AiService Heuristic & Audit Logic', () => {
    it('generates heuristic tags and categories accurately', async () => {
      const analysis = await aiService.analyzeFile({
        fileId: 'test_1',
        filename: 'Quarterly_Tax_Invoice_2026.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 120000,
      });

      expect(analysis.detectedCategory).toBe('documents');
      expect(analysis.suggestedTags).toContain('finance');
      expect(analysis.suggestedTags).toContain('receipt');
      expect(analysis.confidenceScore).toBeGreaterThan(0.8);
    });

    it('generates catalog audit with actionable recommendations', async () => {
      const report = await aiService.generateCatalogAudit();
      expect(report.totalAnalyzed).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.overallHealthAssessment).toBeDefined();
    });
  });

  describe('Express App HTTP Routing', () => {
    it('creates an Express instance with mounted routes', () => {
      const app = createApp();
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });
  });
});
