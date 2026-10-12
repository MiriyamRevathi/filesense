import {
  StoredFileRecord,
  DuplicateGroup,
  StorageStats,
  FileCategory,
  CategoryBreakdown,
  SizeBucket,
  SortOption,
} from '../types';
import { getCategoryColor, getCategoryLabel } from './fileUtils';

export function calculateStorageStats(
  files: StoredFileRecord[],
  duplicateGroups: DuplicateGroup[]
): StorageStats {
  const totalFiles = files.length;
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const duplicateGroupsCount = duplicateGroups.length;
  const duplicateFilesCount = duplicateGroups.reduce((acc, g) => acc + g.files.length, 0);
  const reclaimableBytes = duplicateGroups.reduce((acc, g) => acc + g.wastedBytes, 0);

  const categoryBreakdown = calculateCategoryBreakdown(files);
  const largestFiles = getLargestFiles(files, 5);
  const recentFiles = getRecentFiles(files, 5);
  const sizeDistribution = calculateSizeDistribution(files);

  return {
    totalFiles,
    totalBytes,
    duplicateGroupsCount,
    duplicateFilesCount,
    reclaimableBytes,
    categoryBreakdown,
    largestFiles,
    recentFiles,
    sizeDistribution,
  };
}

export function calculateCategoryBreakdown(files: StoredFileRecord[]): CategoryBreakdown[] {
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const categories: FileCategory[] = [
    'images',
    'documents',
    'code',
    'audio',
    'video',
    'archives',
    'other',
  ];

  const categoryMap = new Map<FileCategory, { count: number; bytes: number }>();
  for (const cat of categories) {
    categoryMap.set(cat, { count: 0, bytes: 0 });
  }

  for (const file of files) {
    const current = categoryMap.get(file.category) || { count: 0, bytes: 0 };
    current.count += 1;
    current.bytes += file.size;
    categoryMap.set(file.category, current);
  }

  const breakdown: CategoryBreakdown[] = [];
  for (const cat of categories) {
    const data = categoryMap.get(cat)!;
    const percentage = totalBytes > 0 ? (data.bytes / totalBytes) * 100 : 0;
    breakdown.push({
      category: cat,
      label: getCategoryLabel(cat),
      count: data.count,
      bytes: data.bytes,
      percentage: Number(percentage.toFixed(1)),
      color: getCategoryColor(cat).accent,
    });
  }

  return breakdown;
}

export function getLargestFiles(files: StoredFileRecord[], count = 5): StoredFileRecord[] {
  return [...files].sort((a, b) => b.size - a.size).slice(0, count);
}

export function getRecentFiles(files: StoredFileRecord[], count = 5): StoredFileRecord[] {
  return [...files].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, count);
}

export function calculateSizeDistribution(files: StoredFileRecord[]): SizeBucket[] {
  const buckets: Array<{ range: string; label: string; min: number; max: number }> = [
    { range: '< 100 KB', label: 'Tiny (< 100 KB)', min: 0, max: 100 * 1024 },
    { range: '100 KB - 1 MB', label: 'Small (100 KB - 1 MB)', min: 100 * 1024, max: 1024 * 1024 },
    { range: '1 MB - 10 MB', label: 'Medium (1 MB - 10 MB)', min: 1024 * 1024, max: 10 * 1024 * 1024 },
    { range: '10 MB - 50 MB', label: 'Large (10 MB - 50 MB)', min: 10 * 1024 * 1024, max: 50 * 1024 * 1024 },
    { range: '> 50 MB', label: 'Huge (> 50 MB)', min: 50 * 1024 * 1024, max: Infinity },
  ];

  return buckets.map(b => {
    const matching = files.filter(f => f.size >= b.min && f.size < b.max);
    const count = matching.length;
    const bytes = matching.reduce((sum, f) => sum + f.size, 0);
    return {
      range: b.range,
      label: b.label,
      count,
      bytes,
    };
  });
}

export function filterAndSortFiles(
  files: StoredFileRecord[],
  options: {
    search?: string;
    category?: string;
    sortBy?: SortOption;
  }
): StoredFileRecord[] {
  const { search = '', category = 'all', sortBy = 'date-desc' } = options;

  let result = [...files];

  // Search by name
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(f => f.name.toLowerCase().includes(q));
  }

  // Filter by category
  if (category && category !== 'all') {
    result = result.filter(f => f.category === category);
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      case 'name-desc':
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      case 'size-asc':
        return a.size - b.size;
      case 'size-desc':
        return b.size - a.size;
      case 'date-asc':
        return a.dateAdded - b.dateAdded;
      case 'date-desc':
        return b.dateAdded - a.dateAdded;
      case 'type-asc':
        return a.type.localeCompare(b.type);
      case 'type-desc':
        return b.type.localeCompare(a.type);
      default:
        return b.dateAdded - a.dateAdded;
    }
  });

  return result;
}
