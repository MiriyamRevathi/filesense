import { useState, useEffect, useCallback } from 'react';

export interface StorageQuotaInfo {
  usageBytes: number;
  quotaBytes: number;
  percentageUsed: number;
  isPersisted: boolean;
  supported: boolean;
}

export function useStorageQuota(): StorageQuotaInfo & { refreshQuota: () => Promise<void> } {
  const [quotaInfo, setQuotaInfo] = useState<StorageQuotaInfo>({
    usageBytes: 0,
    quotaBytes: 0,
    percentageUsed: 0,
    isPersisted: false,
    supported: typeof navigator !== 'undefined' && 'storage' in navigator,
  });

  const refreshQuota = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.storage) return;

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;

      setQuotaInfo({
        usageBytes: usage,
        quotaBytes: quota,
        percentageUsed: percentage,
        isPersisted: persisted,
        supported: true,
      });
    } catch {
      // Fallback if permission error or unsupported
    }
  }, []);

  useEffect(() => {
    refreshQuota();
  }, [refreshQuota]);

  return { ...quotaInfo, refreshQuota };
}
