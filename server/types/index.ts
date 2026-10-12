export type ServerFileCategory =
  | 'images'
  | 'documents'
  | 'audio'
  | 'video'
  | 'code'
  | 'archives'
  | 'other';

export type ServerHashStatus = 'unhashed' | 'hashing' | 'hashed' | 'error';

export interface ServerFileEntity {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: number;
  dateAdded: number;
  hash: string;
  hashStatus: ServerHashStatus;
  category: ServerFileCategory;
  tags: string[];
  aiSummary?: string;
  aiSuggestedCategory?: ServerFileCategory;
  isDuplicate: boolean;
  duplicateGroupId?: string;
  storagePath?: string;
  isDeleted: boolean;
  deletedAt?: number;
}

export interface ServerDuplicateGroup {
  id: string;
  hash: string;
  size: number;
  files: ServerFileEntity[];
  fileCount: number;
  wastedBytes: number;
  originalFileId: string;
  duplicateFileIds: string[];
}

export interface ServerCategoryBreakdown {
  category: ServerFileCategory;
  label: string;
  count: number;
  bytes: number;
  percentage: number;
  color: string;
}

export interface ServerSizeBucket {
  range: string;
  label: string;
  count: number;
  bytes: number;
}

export interface ServerStorageStats {
  totalFiles: number;
  totalBytes: number;
  duplicateGroupsCount: number;
  duplicateFilesCount: number;
  reclaimableBytes: number;
  categoryBreakdown: ServerCategoryBreakdown[];
  largestFiles: ServerFileEntity[];
  recentFiles: ServerFileEntity[];
  sizeDistribution: ServerSizeBucket[];
  storageHealthScore: number;
  averageFileSize: number;
  wastePercentage: number;
}

export interface DuplicateScanResult {
  scannedCount: number;
  hashedCount: number;
  duplicateGroupsFound: number;
  duplicateFilesCount: number;
  wastedBytesTotal: number;
  durationMs: number;
  groups: ServerDuplicateGroup[];
}

export type DeduplicationStrategy = 'keep-oldest' | 'keep-newest' | 'keep-largest-name' | 'custom';

export interface DeduplicationResolutionRequest {
  strategy: DeduplicationStrategy;
  groupIds?: string[];
  customKeepFileIds?: Record<string, string>;
  dryRun?: boolean;
}

export interface DeduplicationResolutionReport {
  strategy: DeduplicationStrategy;
  groupsProcessed: number;
  filesDeletedCount: number;
  bytesReclaimed: number;
  deletedFileIds: string[];
  preservedFileIds: string[];
  auditTimestamp: number;
}

export interface AiTaggingRequest {
  fileId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  previewSnippet?: string;
}

export interface AiTaggingResponse {
  fileId: string;
  suggestedTags: string[];
  detectedCategory: ServerFileCategory;
  summary: string;
  confidenceScore: number;
  recommendation: string;
}

export interface AiCatalogAuditRecommendation {
  id: string;
  type: 'duplicate' | 'stale_large' | 'misclassified' | 'unorganized';
  title: string;
  description: string;
  impactBytes: number;
  action: string;
  fileIds: string[];
}

export interface AiCatalogAuditReport {
  totalAnalyzed: number;
  overallHealthAssessment: string;
  recommendations: AiCatalogAuditRecommendation[];
  smartTagsGenerated: number;
  estimatedReclaimableBytes: number;
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
