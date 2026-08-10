export type FileCategory = 
  | 'images'
  | 'documents'
  | 'audio'
  | 'video'
  | 'code'
  | 'archives'
  | 'other';

export type HashStatus = 'unhashed' | 'hashing' | 'hashed' | 'error';

export interface StoredFileRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dateAdded: number;
  blob: Blob;
  hash?: string;
  hashStatus: HashStatus;
  category: FileCategory;
  errorMessage?: string;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  size: number;
  files: StoredFileRecord[];
  wastedBytes: number;
}

export interface CategoryBreakdown {
  category: FileCategory;
  label: string;
  count: number;
  bytes: number;
  percentage: number;
  color: string;
}

export interface SizeBucket {
  range: string;
  label: string;
  count: number;
  bytes: number;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  duplicateGroupsCount: number;
  duplicateFilesCount: number;
  reclaimableBytes: number;
  categoryBreakdown: CategoryBreakdown[];
  largestFiles: StoredFileRecord[];
  recentFiles: StoredFileRecord[];
  sizeDistribution: SizeBucket[];
}

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export type SortOption = 
  | 'name-asc' 
  | 'name-desc' 
  | 'size-asc' 
  | 'size-desc' 
  | 'date-asc' 
  | 'date-desc' 
  | 'type-asc' 
  | 'type-desc';

export type ViewMode = 'grid' | 'list';

export interface UserProfile {
  email: string;
  name: string;
}

export type ActiveTab = 'landing' | 'dashboard' | 'files' | 'duplicates' | 'insights' | 'settings';
