import { describe, it, expect } from 'vitest';
import {
  calculateStorageStats,
  calculateCategoryBreakdown,
  getLargestFiles,
  getRecentFiles,
  calculateSizeDistribution,
  filterAndSortFiles,
} from '../utils/storageCalculations';
import { StoredFileRecord, DuplicateGroup } from '../types';

describe('storageCalculations', () => {
  const mockFiles: StoredFileRecord[] = [
    {
      id: '1',
      name: 'large_video.mp4',
      size: 25 * 1024 * 1024,
      type: 'video/mp4',
      lastModified: 1000,
      dateAdded: 1000,
      blob: new Blob(['x']),
      hashStatus: 'hashed',
      category: 'video',
    },
    {
      id: '2',
      name: 'notes.md',
      size: 500,
      type: 'text/markdown',
      lastModified: 3000,
      dateAdded: 3000,
      blob: new Blob(['x']),
      hashStatus: 'hashed',
      category: 'documents',
    },
    {
      id: '3',
      name: 'banner.png',
      size: 2 * 1024 * 1024,
      type: 'image/png',
      lastModified: 2000,
      dateAdded: 2000,
      blob: new Blob(['x']),
      hashStatus: 'hashed',
      category: 'images',
    },
  ];

  const mockDuplicates: DuplicateGroup[] = [
    {
      id: 'dup_1',
      hash: 'abc123',
      size: 500,
      files: [mockFiles[1], { ...mockFiles[1], id: '2_copy' }],
      wastedBytes: 500,
    },
  ];

  it('calculates storage stats accurately', () => {
    const stats = calculateStorageStats(mockFiles, mockDuplicates);
    expect(stats.totalFiles).toBe(3);
    expect(stats.totalBytes).toBe(mockFiles[0].size + mockFiles[1].size + mockFiles[2].size);
    expect(stats.duplicateGroupsCount).toBe(1);
    expect(stats.duplicateFilesCount).toBe(2);
    expect(stats.reclaimableBytes).toBe(500);
    expect(stats.largestFiles[0].name).toBe('large_video.mp4');
    expect(stats.recentFiles[0].name).toBe('notes.md');
  });

  it('ranks largest files correctly', () => {
    const largest = getLargestFiles(mockFiles, 2);
    expect(largest.length).toBe(2);
    expect(largest[0].name).toBe('large_video.mp4');
    expect(largest[1].name).toBe('banner.png');
  });

  it('ranks recent files correctly', () => {
    const recent = getRecentFiles(mockFiles, 2);
    expect(recent.length).toBe(2);
    expect(recent[0].name).toBe('notes.md');
    expect(recent[1].name).toBe('banner.png');
  });

  it('computes category breakdowns with accurate percentages', () => {
    const breakdown = calculateCategoryBreakdown(mockFiles);
    const videoCat = breakdown.find(b => b.category === 'video');
    const docCat = breakdown.find(b => b.category === 'documents');
    const imageCat = breakdown.find(b => b.category === 'images');

    expect(videoCat?.count).toBe(1);
    expect(docCat?.count).toBe(1);
    expect(imageCat?.count).toBe(1);
    expect(videoCat?.percentage).toBeGreaterThan(80);
  });

  it('groups files into size buckets correctly', () => {
    const buckets = calculateSizeDistribution(mockFiles);
    const tiny = buckets.find(b => b.range === '< 100 KB');
    const medium = buckets.find(b => b.range === '1 MB - 10 MB');
    const large = buckets.find(b => b.range === '10 MB - 50 MB');

    expect(tiny?.count).toBe(1); // notes.md (500 B)
    expect(medium?.count).toBe(1); // banner.png (2 MB)
    expect(large?.count).toBe(1); // large_video.mp4 (25 MB)
  });

  describe('filterAndSortFiles', () => {
    it('filters by search keyword', () => {
      const result = filterAndSortFiles(mockFiles, { search: 'video' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('large_video.mp4');
    });

    it('filters by category', () => {
      const result = filterAndSortFiles(mockFiles, { category: 'images' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('banner.png');
    });

    it('sorts by size descending and ascending', () => {
      const desc = filterAndSortFiles(mockFiles, { sortBy: 'size-desc' });
      expect(desc[0].size).toBeGreaterThan(desc[1].size);

      const asc = filterAndSortFiles(mockFiles, { sortBy: 'size-asc' });
      expect(asc[0].size).toBeLessThan(asc[1].size);
    });

    it('sorts by name ascending and descending', () => {
      const asc = filterAndSortFiles(mockFiles, { sortBy: 'name-asc' });
      expect(asc[0].name).toBe('banner.png');
      expect(asc[2].name).toBe('notes.md');
    });
  });
});
