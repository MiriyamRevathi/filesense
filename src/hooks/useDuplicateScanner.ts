import { useState, useCallback } from 'react';
import { useFileContext } from '../context/FileContext';

export function useDuplicateScanner() {
  const { scanDuplicates, isScanning, scanProgress, duplicateGroups, stats } = useFileContext();
  const [lastScanCompletedAt, setLastScanCompletedAt] = useState<number | null>(null);

  const runScan = useCallback(
    async (forceRehash = false) => {
      await scanDuplicates(forceRehash);
      setLastScanCompletedAt(Date.now());
    },
    [scanDuplicates]
  );

  return {
    isScanning,
    scanProgress,
    duplicateGroups,
    duplicateFilesCount: stats.duplicateFilesCount,
    reclaimableBytes: stats.reclaimableBytes,
    lastScanCompletedAt,
    runScan,
  };
}
