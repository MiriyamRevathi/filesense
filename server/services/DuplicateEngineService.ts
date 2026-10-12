import { FileRepository } from '../repositories/FileRepository';
import {
  ServerDuplicateGroup,
  ServerFileEntity,
  DuplicateScanResult,
  DeduplicationStrategy,
  DeduplicationResolutionRequest,
  DeduplicationResolutionReport,
} from '../types';

export class DuplicateEngineService {
  private repository: FileRepository;

  constructor(repository: FileRepository = FileRepository.getInstance()) {
    this.repository = repository;
  }

  /**
   * Scans all stored active files, grouping exact matches by SHA-256 hash.
   */
  public scanDuplicates(): DuplicateScanResult {
    const startTime = Date.now();
    const files = this.repository.getAll(false);

    const hashBuckets = new Map<string, ServerFileEntity[]>();

    for (const file of files) {
      if (!file.hash) continue;
      const bucket = hashBuckets.get(file.hash) || [];
      bucket.push(file);
      hashBuckets.set(file.hash, bucket);
    }

    const groups: ServerDuplicateGroup[] = [];
    let duplicateFilesCount = 0;
    let wastedBytesTotal = 0;

    for (const [hash, groupFiles] of hashBuckets.entries()) {
      if (groupFiles.length > 1) {
        // Sort files chronologically: oldest added first (treated as primary original)
        groupFiles.sort((a, b) => a.dateAdded - b.dateAdded);

        const original = groupFiles[0];
        const duplicates = groupFiles.slice(1);
        const wastedBytes = (groupFiles.length - 1) * original.size;

        const group: ServerDuplicateGroup = {
          id: `dup_${hash.slice(0, 16)}`,
          hash,
          size: original.size,
          files: groupFiles,
          fileCount: groupFiles.length,
          wastedBytes,
          originalFileId: original.id,
          duplicateFileIds: duplicates.map(d => d.id),
        };

        groups.push(group);
        duplicateFilesCount += duplicates.length;
        wastedBytesTotal += wastedBytes;

        // Update file entities with duplicate status
        for (let i = 0; i < groupFiles.length; i++) {
          const isDup = i > 0;
          this.repository.update(groupFiles[i].id, {
            isDuplicate: isDup,
            duplicateGroupId: group.id,
          });
        }
      } else if (groupFiles.length === 1) {
        // Clear previous duplicate flags if files were removed
        if (groupFiles[0].isDuplicate || groupFiles[0].duplicateGroupId) {
          this.repository.update(groupFiles[0].id, {
            isDuplicate: false,
            duplicateGroupId: undefined,
          });
        }
      }
    }

    // Sort duplicate groups by wasted bytes descending (highest impact first)
    groups.sort((a, b) => b.wastedBytes - a.wastedBytes);

    const durationMs = Date.now() - startTime;

    return {
      scannedCount: files.length,
      hashedCount: files.filter(f => Boolean(f.hash)).length,
      duplicateGroupsFound: groups.length,
      duplicateFilesCount,
      wastedBytesTotal,
      durationMs,
      groups,
    };
  }

  /**
   * Resolves duplicate groups based on a selected retention strategy.
   */
  public resolveDuplicates(request: DeduplicationResolutionRequest): DeduplicationResolutionReport {
    const scan = this.scanDuplicates();
    const strategy = request.strategy;

    let targetGroups = scan.groups;
    if (request.groupIds && request.groupIds.length > 0) {
      targetGroups = targetGroups.filter(g => request.groupIds!.includes(g.id));
    }

    const toDeleteIds: string[] = [];
    const preservedIds: string[] = [];
    let bytesReclaimed = 0;

    for (const group of targetGroups) {
      if (group.files.length <= 1) continue;

      let keepId: string;

      switch (strategy) {
        case 'keep-oldest':
          // Oldest by dateAdded
          const oldest = [...group.files].sort((a, b) => a.dateAdded - b.dateAdded)[0];
          keepId = oldest.id;
          break;

        case 'keep-newest':
          // Newest by dateAdded
          const newest = [...group.files].sort((a, b) => b.dateAdded - a.dateAdded)[0];
          keepId = newest.id;
          break;

        case 'keep-largest-name':
          // File with longest name or least "copy" indicators
          const cleanSorted = [...group.files].sort((a, b) => {
            const aHasCopy = /copy|\(\d+\)|backup/i.test(a.name);
            const bHasCopy = /copy|\(\d+\)|backup/i.test(b.name);
            if (aHasCopy && !bHasCopy) return 1;
            if (!aHasCopy && bHasCopy) return -1;
            return a.name.length - b.name.length;
          });
          keepId = cleanSorted[0].id;
          break;

        case 'custom':
          keepId = request.customKeepFileIds?.[group.id] || group.originalFileId;
          break;

        default:
          keepId = group.originalFileId;
          break;
      }

      preservedIds.push(keepId);

      for (const file of group.files) {
        if (file.id !== keepId) {
          toDeleteIds.push(file.id);
          bytesReclaimed += file.size;
        }
      }
    }

    if (!request.dryRun && toDeleteIds.length > 0) {
      this.repository.deleteBatch(toDeleteIds, false);
      // Re-scan to clean flags on surviving files
      this.scanDuplicates();
    }

    return {
      strategy,
      groupsProcessed: targetGroups.length,
      filesDeletedCount: toDeleteIds.length,
      bytesReclaimed,
      deletedFileIds: toDeleteIds,
      preservedFileIds: preservedIds,
      auditTimestamp: Date.now(),
    };
  }

  /**
   * Deletes specific duplicate files in a given group.
   */
  public deleteDuplicatesInGroup(groupId: string, fileIdsToDelete: string[]): {
    deletedCount: number;
    bytesReclaimed: number;
  } {
    let deletedCount = 0;
    let bytesReclaimed = 0;

    for (const id of fileIdsToDelete) {
      const file = this.repository.getById(id);
      if (file && file.duplicateGroupId === groupId) {
        bytesReclaimed += file.size;
        if (this.repository.delete(id, false)) {
          deletedCount++;
        }
      }
    }

    this.scanDuplicates();
    return { deletedCount, bytesReclaimed };
  }
}
