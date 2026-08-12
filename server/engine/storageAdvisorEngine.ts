/**
 * FileSense Storage Advisor & Cost Optimization Engine
 * Calculates projected cloud storage costs, compression ratios,
 * and data tiering migrations across Hot, Warm, and Cold/Archive storage.
 */

export interface StorageTierAnalysis {
  tier: 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';
  targetFilesCount: number;
  totalBytes: number;
  estimatedMonthlyCostUSD: number;
  recommendedAction: string;
}

export interface CompressionOpportunity {
  fileId: string;
  filename: string;
  currentSizeBytes: number;
  estimatedCompressedBytes: number;
  projectedSavingsBytes: number;
  recommendedCodec: 'Zstandard' | 'GZIP' | 'Brotli' | 'WebP' | 'AVIF';
}

export interface AdvisorOptimizationReport {
  totalAnalyzedBytes: number;
  totalFilesCount: number;
  potentialCompressionSavingsBytes: number;
  tieringBreakdown: StorageTierAnalysis[];
  topCompressionOpportunities: CompressionOpportunity[];
  projectedAnnualSavingsUSD: number;
}

export class StorageAdvisorEngine {
  // Approximate cloud pricing per GB/month
  private static readonly PRICING_PER_GB_MONTH = {
    HOT: 0.023,     // Standard S3 / GCS
    WARM: 0.0125,   // Infrequent Access
    COLD: 0.004,    // Glacier Flexible
    ARCHIVE: 0.00099, // Deep Archive
  };

  public static generateAdvisorReport(files: Array<{
    id: string;
    name: string;
    size: number;
    category: string;
    dateAdded: number;
  }>): AdvisorOptimizationReport {
    let totalBytes = 0;
    const now = Date.now();

    const tierBuckets: Record<'HOT' | 'WARM' | 'COLD' | 'ARCHIVE', { count: number; bytes: number }> = {
      HOT: { count: 0, bytes: 0 },
      WARM: { count: 0, bytes: 0 },
      COLD: { count: 0, bytes: 0 },
      ARCHIVE: { count: 0, bytes: 0 },
    };

    const compressionOpportunities: CompressionOpportunity[] = [];

    for (const f of files) {
      totalBytes += f.size;
      const ageDays = (now - f.dateAdded) / (1000 * 60 * 60 * 24);

      // Determine recommended storage tier
      if (ageDays < 30) {
        tierBuckets.HOT.count++;
        tierBuckets.HOT.bytes += f.size;
      } else if (ageDays < 90) {
        tierBuckets.WARM.count++;
        tierBuckets.WARM.bytes += f.size;
      } else if (ageDays < 365) {
        tierBuckets.COLD.count++;
        tierBuckets.COLD.bytes += f.size;
      } else {
        tierBuckets.ARCHIVE.count++;
        tierBuckets.ARCHIVE.bytes += f.size;
      }

      // Check compression potential
      if (['documents', 'code'].includes(f.category) && f.size > 50 * 1024) {
        const estCompressed = Math.round(f.size * 0.35); // 65% text compression
        compressionOpportunities.push({
          fileId: f.id,
          filename: f.name,
          currentSizeBytes: f.size,
          estimatedCompressedBytes: estCompressed,
          projectedSavingsBytes: f.size - estCompressed,
          recommendedCodec: 'Zstandard',
        });
      } else if (f.category === 'images' && (f.name.endsWith('.png') || f.name.endsWith('.bmp')) && f.size > 1024 * 1024) {
        const estCompressed = Math.round(f.size * 0.40); // 60% WebP compression
        compressionOpportunities.push({
          fileId: f.id,
          filename: f.name,
          currentSizeBytes: f.size,
          estimatedCompressedBytes: estCompressed,
          projectedSavingsBytes: f.size - estCompressed,
          recommendedCodec: 'WebP',
        });
      }
    }

    const tieringBreakdown: StorageTierAnalysis[] = (['HOT', 'WARM', 'COLD', 'ARCHIVE'] as const).map(tier => {
      const data = tierBuckets[tier];
      const gb = data.bytes / (1024 * 1024 * 1024);
      const monthlyCost = gb * this.PRICING_PER_GB_MONTH[tier];
      const actions = {
        HOT: 'Keep in high-performance SSD storage for frequent access.',
        WARM: 'Transition to Infrequent Access tier to cut storage fees by ~45%.',
        COLD: 'Migrate to Cold Archive to cut storage fees by ~80%.',
        ARCHIVE: 'Move to Deep Glacier Archive for long-term audit compliance.',
      };

      return {
        tier,
        targetFilesCount: data.count,
        totalBytes: data.bytes,
        estimatedMonthlyCostUSD: Math.round(monthlyCost * 100) / 100,
        recommendedAction: actions[tier],
      };
    });

    compressionOpportunities.sort((a, b) => b.projectedSavingsBytes - a.projectedSavingsBytes);
    const topOpportunities = compressionOpportunities.slice(0, 10);
    const totalCompressSavings = compressionOpportunities.reduce((acc, c) => acc + c.projectedSavingsBytes, 0);

    // Compute annual savings
    const compressSavingsGB = totalCompressSavings / (1024 * 1024 * 1024);
    const projectedAnnualSavingsUSD = Math.round(compressSavingsGB * this.PRICING_PER_GB_MONTH.HOT * 12 * 100) / 100;

    return {
      totalAnalyzedBytes: totalBytes,
      totalFilesCount: files.length,
      potentialCompressionSavingsBytes: totalCompressSavings,
      tieringBreakdown,
      topCompressionOpportunities: topOpportunities,
      projectedAnnualSavingsUSD,
    };
  }
}
