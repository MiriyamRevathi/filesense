import { StoredFileRecord, DuplicateGroup } from '../types';

export async function computeBlobSha256(blob: Blob | any): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API (crypto.subtle) is not supported in this environment.');
  }

  try {
    let arrayBuffer: ArrayBuffer;
    if (typeof blob?.arrayBuffer === 'function') {
      arrayBuffer = await blob.arrayBuffer();
    } else if (typeof blob?.text === 'function') {
      const text = await blob.text();
      arrayBuffer = new TextEncoder().encode(text).buffer;
    } else if (blob instanceof ArrayBuffer) {
      arrayBuffer = blob;
    } else if (typeof FileReader !== 'undefined') {
      arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });
    } else {
      throw new Error('Unreadable blob object.');
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown hashing error';
    throw new Error(`Failed to compute SHA-256 hash: ${message}`);
  }
}

export function groupFilesBySize(files: StoredFileRecord[]): Map<number, StoredFileRecord[]> {
  const sizeMap = new Map<number, StoredFileRecord[]>();
  for (const file of files) {
    const list = sizeMap.get(file.size) || [];
    list.push(file);
    sizeMap.set(file.size, list);
  }
  return sizeMap;
}

export function calculateWastedBytesForGroup(filesCount: number, sizeBytes: number): number {
  if (filesCount <= 1 || sizeBytes <= 0) return 0;
  return (filesCount - 1) * sizeBytes;
}

export interface DuplicateScanProgress {
  processed: number;
  total: number;
  stage: 'analyzing_sizes' | 'hashing' | 'grouping' | 'complete';
  currentFileName?: string;
}

export async function runDuplicateAnalysis(
  files: StoredFileRecord[],
  options: {
    concurrency?: number;
    forceRehash?: boolean;
    onProgress?: (progress: DuplicateScanProgress) => void;
  } = {}
): Promise<{
  duplicateGroups: DuplicateGroup[];
  updatedFiles: StoredFileRecord[];
  totalReclaimableBytes: number;
}> {
  const { concurrency = 3, forceRehash = false, onProgress } = options;

  if (files.length === 0) {
    return { duplicateGroups: [], updatedFiles: [], totalReclaimableBytes: 0 };
  }

  onProgress?.({
    processed: 0,
    total: files.length,
    stage: 'analyzing_sizes',
  });

  // Step 1 & 2: Group candidate files by byte size
  const sizeGroups = groupFilesBySize(files);
  const candidateFileIds = new Set<string>();

  for (const [, group] of sizeGroups.entries()) {
    if (group.length > 1) {
      for (const f of group) {
        candidateFileIds.add(f.id);
      }
    }
  }

  // Files to hash: those in size collision groups, or if forceRehash is set
  const filesToHash = files.filter(f => {
    if (forceRehash) return true;
    if (!candidateFileIds.has(f.id)) return false;
    return !f.hash || f.hashStatus !== 'hashed';
  });

  const updatedFilesMap = new Map<string, StoredFileRecord>();
  for (const file of files) {
    updatedFilesMap.set(file.id, { ...file });
  }

  onProgress?.({
    processed: 0,
    total: filesToHash.length,
    stage: 'hashing',
  });

  // Step 3: Bounded concurrency hashing
  let processedCount = 0;
  const queue = [...filesToHash];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const file = queue.shift();
      if (!file) break;

      onProgress?.({
        processed: processedCount,
        total: filesToHash.length,
        stage: 'hashing',
        currentFileName: file.name,
      });

      const target = updatedFilesMap.get(file.id)!;
      target.hashStatus = 'hashing';

      try {
        const hash = await computeBlobSha256(file.blob);
        target.hash = hash;
        target.hashStatus = 'hashed';
        target.errorMessage = undefined;
      } catch (err) {
        target.hashStatus = 'error';
        target.errorMessage = err instanceof Error ? err.message : 'Hashing failed';
      }

      processedCount++;
      onProgress?.({
        processed: processedCount,
        total: filesToHash.length,
        stage: 'hashing',
        currentFileName: file.name,
      });
    }
  }

  const workerCount = Math.min(concurrency, Math.max(1, filesToHash.length));
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  onProgress?.({
    processed: files.length,
    total: files.length,
    stage: 'grouping',
  });

  // Step 4 & 5: Group files by size and SHA-256 hash
  const updatedFilesList = Array.from(updatedFilesMap.values());
  const hashSizeMap = new Map<string, StoredFileRecord[]>();

  for (const file of updatedFilesList) {
    if (file.hash && file.hashStatus === 'hashed') {
      const compositeKey = `${file.size}_${file.hash}`;
      const group = hashSizeMap.get(compositeKey) || [];
      group.push(file);
      hashSizeMap.set(compositeKey, group);
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];
  let totalReclaimableBytes = 0;

  let groupCounter = 1;
  for (const [key, groupFiles] of hashSizeMap.entries()) {
    if (groupFiles.length > 1) {
      const [sizeStr, hash] = key.split('_');
      const size = Number(sizeStr);
      const wastedBytes = calculateWastedBytesForGroup(groupFiles.length, size);

      duplicateGroups.push({
        id: `dup_group_${groupCounter++}`,
        hash,
        size,
        files: [...groupFiles].sort((a, b) => a.dateAdded - b.dateAdded),
        wastedBytes,
      });

      totalReclaimableBytes += wastedBytes;
    }
  }

  // Sort groups by highest reclaimable space first
  duplicateGroups.sort((a, b) => b.wastedBytes - a.wastedBytes);

  onProgress?.({
    processed: files.length,
    total: files.length,
    stage: 'complete',
  });

  return {
    duplicateGroups,
    updatedFiles: updatedFilesList,
    totalReclaimableBytes,
  };
}
