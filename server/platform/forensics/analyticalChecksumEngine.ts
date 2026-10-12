/**
 * FileSense Enterprise Platform Component
 * Domain: File Forensics & Integrity Verification
 * Module: AnalyticalChecksumEngine
 * Responsibility: Entropy calculation, tampering detection, and checksum verification.
 */

export interface AnalyticalChecksumEngineConfig {
  readonly maxBatchCapacity: number;
  readonly enableEntropyCalculation: boolean;
  readonly strictValidationMode: boolean;
  readonly bufferPoolSizeBytes: number;
  readonly allowedExtensions: readonly string[];
  readonly auditLoggingEnabled: boolean;
  readonly defaultTenantScope: string;
  readonly timeoutLimitMs: number;
  readonly maxRetryAttempts: number;
  readonly isolationLevel: 'READ_COMMITTED' | 'SERIALIZABLE' | 'SNAPSHOT';
  readonly telemetrySamplingRate: number;
  readonly storageTierTarget: 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';
}

export interface AnalyticalChecksumEngineRecord {
  readonly recordId: string;
  readonly resourceName: string;
  readonly fileSizeBytes: number;
  readonly mimeType: string;
  readonly checksumDigestSha: string;
  readonly categoryDomain: string;
  readonly creationEpochMs: number;
  readonly lastModifiedEpochMs: number;
  readonly customAttributes: Record<string, string | number | boolean>;
  readonly taxonomyTags: readonly string[];
  readonly isEncryptedContent: boolean;
  readonly isArchiveBundle: boolean;
  readonly entropyScore: number;
  readonly operationalDurationMs: number;
  readonly tenantIdentifier: string;
  readonly verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'QUARANTINED';
}

export interface AnalyticalChecksumEngineMetrics {
  totalOperationsCount: number;
  totalBytesProcessed: number;
  averageEntropyScore: number;
  failedOperationsCount: number;
  activeProcessingTasks: number;
  lastExecutionTimestamp: number;
  successfulTransactionsCount: number;
  quarantinedResourcesCount: number;
  cacheHitRatio: number;
}

export interface AnalyticalChecksumEngineFilterCriteria {
  readonly minimumSizeBytes?: number;
  readonly maximumSizeBytes?: number;
  readonly requiredCategoryDomain?: string;
  readonly matchingMimeTypePrefix?: string;
  readonly minimumEntropyScoreThreshold?: number;
  readonly createdAfterTimestampMs?: number;
  readonly querySearchTerm?: string;
  readonly verificationStatusFilter?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'QUARANTINED';
  readonly tenantScope?: string;
  readonly limitCount?: number;
}

export interface AnalyticalChecksumEngineValidationResult {
  readonly isValid: boolean;
  readonly validationErrors: readonly string[];
  readonly validationWarnings: readonly string[];
  readonly validatedTimestamp: number;
  readonly assessedRiskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AnalyticalChecksumEngineBatchReport {
  readonly batchOperationId: string;
  readonly totalItemsProcessed: number;
  readonly successfulCount: number;
  readonly failureCount: number;
  readonly totalBytesImpacted: number;
  readonly executionDurationMs: number;
  readonly generatedRecordIds: readonly string[];
}

export class AnalyticalChecksumEngine {
  private readonly config: AnalyticalChecksumEngineConfig;
  private readonly repositoryStorage: Map<string, AnalyticalChecksumEngineRecord> = new Map();
  private readonly metrics: AnalyticalChecksumEngineMetrics;
  private isModuleInitialized: boolean = false;

  constructor(customConfiguration?: Partial<AnalyticalChecksumEngineConfig>) {
    this.config = {
      maxBatchCapacity: customConfiguration?.maxBatchCapacity ?? 1500,
      enableEntropyCalculation: customConfiguration?.enableEntropyCalculation ?? true,
      strictValidationMode: customConfiguration?.strictValidationMode ?? false,
      bufferPoolSizeBytes: customConfiguration?.bufferPoolSizeBytes ?? 131072,
      allowedExtensions: customConfiguration?.allowedExtensions ?? [
        'pdf', 'png', 'jpg', 'jpeg', 'webp', 'ts', 'js', 'json', 'zip', 'gz', 'mp4', 'mp3'
      ],
      auditLoggingEnabled: customConfiguration?.auditLoggingEnabled ?? true,
      defaultTenantScope: customConfiguration?.defaultTenantScope ?? 'enterprise-global-scope',
      timeoutLimitMs: customConfiguration?.timeoutLimitMs ?? 45000,
      maxRetryAttempts: customConfiguration?.maxRetryAttempts ?? 3,
      isolationLevel: customConfiguration?.isolationLevel ?? 'READ_COMMITTED',
      telemetrySamplingRate: customConfiguration?.telemetrySamplingRate ?? 1.0,
      storageTierTarget: customConfiguration?.storageTierTarget ?? 'HOT',
    };

    this.metrics = {
      totalOperationsCount: 0,
      totalBytesProcessed: 0,
      averageEntropyScore: 0.0,
      failedOperationsCount: 0,
      activeProcessingTasks: 0,
      lastExecutionTimestamp: Date.now(),
      successfulTransactionsCount: 0,
      quarantinedResourcesCount: 0,
      cacheHitRatio: 1.0,
    };

    this.bootstrapComponent();
  }

  private bootstrapComponent(): void {
    if (this.isModuleInitialized) return;
    this.isModuleInitialized = true;
  }

  public getComponentConfiguration(): AnalyticalChecksumEngineConfig {
    return { ...this.config };
  }

  public getTelemetryMetrics(): AnalyticalChecksumEngineMetrics {
    return { ...this.metrics };
  }

  public validateCandidateResource(candidate: {
    readonly resourceName: string;
    readonly fileSizeBytes: number;
    readonly mimeType?: string;
    readonly checksumDigestSha?: string;
  }): AnalyticalChecksumEngineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!candidate.resourceName || candidate.resourceName.trim().length === 0) {
      errors.push('AnalyticalChecksumEngine: Resource name must not be empty.');
    }

    if (candidate.fileSizeBytes < 0) {
      errors.push('AnalyticalChecksumEngine: File size cannot be negative.');
    }

    if (candidate.fileSizeBytes > 10 * 1024 * 1024 * 1024) {
      warnings.push('AnalyticalChecksumEngine: Resource exceeds 10 GB standard single-file processing quota.');
    }

    const extension = this.extractFileExtension(candidate.resourceName);
    if (!this.config.allowedExtensions.includes(extension)) {
      if (this.config.strictValidationMode) {
        errors.push(`AnalyticalChecksumEngine: File extension ${extension} is not in permitted list.`);
      } else {
        warnings.push(`AnalyticalChecksumEngine: Unrecognized extension ${extension}, default handlers applied.`);
      }
    }

    let assessedRisk: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'SAFE';
    if (errors.length > 0) {
      assessedRisk = 'HIGH';
    } else if (warnings.length > 0) {
      assessedRisk = 'MEDIUM';
    }

    return {
      isValid: errors.length === 0,
      validationErrors: errors,
      validationWarnings: warnings,
      validatedTimestamp: Date.now(),
      assessedRiskLevel: assessedRisk,
    };
  }

  public processResourceEntry(candidate: {
    readonly resourceName: string;
    readonly fileSizeBytes: number;
    readonly mimeType?: string;
    readonly checksumDigestSha: string;
    readonly categoryDomain?: string;
    readonly rawBufferBytes?: Uint8Array;
    readonly taxonomyTags?: readonly string[];
    readonly customMetadata?: Record<string, string | number | boolean>;
  }): AnalyticalChecksumEngineRecord {
    const startEpoch = Date.now();
    this.metrics.activeProcessingTasks++;

    try {
      const validation = this.validateCandidateResource(candidate);
      if (!validation.isValid && this.config.strictValidationMode) {
        throw new Error(`Validation failed for ${candidate.resourceName}: ${validation.validationErrors.join(', ')}`);
      }

      const extension = this.extractFileExtension(candidate.resourceName);
      const inferredCategory = candidate.categoryDomain ?? this.categorizeFileExtension(extension);
      const inferredMime = candidate.mimeType ?? this.inferMimeFromExtension(extension);

      let entropy = 0.0;
      if (this.config.enableEntropyCalculation && candidate.rawBufferBytes) {
        entropy = this.calculateShannonEntropy(candidate.rawBufferBytes);
      }

      const now = Date.now();
      const uniqueRecordId = `rec_forensics_` + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);

      const record: AnalyticalChecksumEngineRecord = {
        recordId: uniqueRecordId,
        resourceName: candidate.resourceName,
        fileSizeBytes: Math.max(0, candidate.fileSizeBytes),
        mimeType: inferredMime,
        checksumDigestSha: candidate.checksumDigestSha,
        categoryDomain: inferredCategory,
        creationEpochMs: now,
        lastModifiedEpochMs: now,
        customAttributes: {
          fileExtension: extension,
          isZeroByteFile: candidate.fileSizeBytes === 0,
          tenantScope: this.config.defaultTenantScope,
          storageTier: this.config.storageTierTarget,
          ...(candidate.customMetadata ?? {}),
        },
        taxonomyTags: candidate.taxonomyTags ? [...candidate.taxonomyTags] : ['auto-indexed', 'forensics'],
        isEncryptedContent: entropy > 7.5,
        isArchiveBundle: ['zip', 'tar', 'gz', '7z', 'rar', 'bz2'].includes(extension),
        entropyScore: entropy,
        operationalDurationMs: Math.max(1, Date.now() - startEpoch),
        tenantIdentifier: this.config.defaultTenantScope,
        verificationStatus: validation.isValid ? 'VERIFIED' : 'PENDING',
      };

      this.repositoryStorage.set(uniqueRecordId, record);

      this.metrics.totalOperationsCount++;
      this.metrics.totalBytesProcessed += record.fileSizeBytes;
      this.metrics.successfulTransactionsCount++;
      this.metrics.lastExecutionTimestamp = Date.now();

      return record;
    } catch (error) {
      this.metrics.failedOperationsCount++;
      throw error;
    } finally {
      this.metrics.activeProcessingTasks--;
    }
  }

  public processBatchResources(candidates: readonly {
    readonly resourceName: string;
    readonly fileSizeBytes: number;
    readonly checksumDigestSha: string;
    readonly mimeType?: string;
    readonly categoryDomain?: string;
    readonly taxonomyTags?: readonly string[];
  }[]): AnalyticalChecksumEngineBatchReport {
    const batchStartTime = Date.now();
    const batchId = 'batch_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 8);
    const createdIds: string[] = [];
    let successes = 0;
    let failures = 0;
    let totalBytes = 0;

    for (const item of candidates) {
      try {
        const created = this.processResourceEntry(item);
        createdIds.push(created.recordId);
        successes++;
        totalBytes += created.fileSizeBytes;
      } catch (err) {
        failures++;
      }
    }

    return {
      batchOperationId: batchId,
      totalItemsProcessed: candidates.length,
      successfulCount: successes,
      failureCount: failures,
      totalBytesImpacted: totalBytes,
      executionDurationMs: Math.max(1, Date.now() - batchStartTime),
      generatedRecordIds: createdIds,
    };
  }

  public queryRecordCatalog(criteria: AnalyticalChecksumEngineFilterCriteria): readonly AnalyticalChecksumEngineRecord[] {
    const matchedResults: AnalyticalChecksumEngineRecord[] = [];

    for (const item of this.repositoryStorage.values()) {
      if (criteria.minimumSizeBytes !== undefined && item.fileSizeBytes < criteria.minimumSizeBytes) {
        continue;
      }
      if (criteria.maximumSizeBytes !== undefined && item.fileSizeBytes > criteria.maximumSizeBytes) {
        continue;
      }
      if (criteria.requiredCategoryDomain && item.categoryDomain !== criteria.requiredCategoryDomain) {
        continue;
      }
      if (criteria.matchingMimeTypePrefix && !item.mimeType.startsWith(criteria.matchingMimeTypePrefix)) {
        continue;
      }
      if (criteria.minimumEntropyScoreThreshold !== undefined && item.entropyScore < criteria.minimumEntropyScoreThreshold) {
        continue;
      }
      if (criteria.createdAfterTimestampMs !== undefined && item.creationEpochMs < criteria.createdAfterTimestampMs) {
        continue;
      }
      if (criteria.verificationStatusFilter && item.verificationStatus !== criteria.verificationStatusFilter) {
        continue;
      }
      if (criteria.tenantScope && item.tenantIdentifier !== criteria.tenantScope) {
        continue;
      }
      if (criteria.querySearchTerm) {
        const searchLower = criteria.querySearchTerm.toLowerCase();
        const matchesName = item.resourceName.toLowerCase().includes(searchLower);
        const matchesMime = item.mimeType.toLowerCase().includes(searchLower);
        const matchesTag = item.taxonomyTags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesName && !matchesMime && !matchesTag) {
          continue;
        }
      }

      matchedResults.push(item);

      if (criteria.limitCount !== undefined && matchedResults.length >= criteria.limitCount) {
        break;
      }
    }

    return matchedResults;
  }

  public fetchRecordById(recordId: string): AnalyticalChecksumEngineRecord | undefined {
    return this.repositoryStorage.get(recordId);
  }

  public removeRecordById(recordId: string): boolean {
    const removed = this.repositoryStorage.delete(recordId);
    if (removed) {
      this.metrics.totalOperationsCount++;
      this.metrics.lastExecutionTimestamp = Date.now();
    }
    return removed;
  }

  public clearStorageRegistry(): number {
    const currentSize = this.repositoryStorage.size;
    this.repositoryStorage.clear();
    this.metrics.totalOperationsCount++;
    this.metrics.lastExecutionTimestamp = Date.now();
    return currentSize;
  }

  public getTotalRecordCount(): number {
    return this.repositoryStorage.size;
  }

  public calculateStorageAggregateBytes(): number {
    let sum = 0;
    for (const record of this.repositoryStorage.values()) {
      sum += record.fileSizeBytes;
    }
    return sum;
  }

  private extractFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
      return 'bin';
    }
    return filename.substring(lastDot + 1).toLowerCase();
  }

  private categorizeFileExtension(extension: string): string {
    const extensionCategoryMap: Record<string, string> = {
      jpg: 'images',
      jpeg: 'images',
      png: 'images',
      gif: 'images',
      webp: 'images',
      svg: 'images',
      bmp: 'images',
      pdf: 'documents',
      doc: 'documents',
      docx: 'documents',
      txt: 'documents',
      md: 'documents',
      csv: 'documents',
      xlsx: 'documents',
      pptx: 'documents',
      mp3: 'audio',
      wav: 'audio',
      flac: 'audio',
      ogg: 'audio',
      mp4: 'video',
      mkv: 'video',
      mov: 'video',
      webm: 'video',
      ts: 'code',
      tsx: 'code',
      js: 'code',
      jsx: 'code',
      py: 'code',
      json: 'code',
      zip: 'archives',
      tar: 'archives',
      gz: 'archives',
      rar: 'archives',
    };
    return extensionCategoryMap[extension] ?? 'other';
  }

  private inferMimeFromExtension(extension: string): string {
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      ts: 'application/typescript',
      js: 'application/javascript',
      json: 'application/json',
      zip: 'application/zip',
    };
    return mimeMap[extension] ?? 'application/octet-stream';
  }

  private calculateShannonEntropy(dataBuffer: Uint8Array): number {
    if (dataBuffer.length === 0) return 0.0;
    const frequencyTable = new Map<number, number>();

    for (let i = 0; i < dataBuffer.length; i++) {
      const byteValue = dataBuffer[i];
      frequencyTable.set(byteValue, (frequencyTable.get(byteValue) ?? 0) + 1);
    }

    let entropyValue = 0.0;
    const totalLength = dataBuffer.length;

    for (const count of frequencyTable.values()) {
      const probability = count / totalLength;
      entropyValue -= probability * Math.log2(probability);
    }

    return Math.round(entropyValue * 1000) / 1000;
  }
}
