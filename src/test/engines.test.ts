import { describe, it, expect } from 'vitest';
import { FormatTaxonomyEngine } from '../../server/engine/formatTaxonomy';
import { PerceptualHashEngine } from '../../server/engine/perceptualHashEngine';
import { FuzzyTextEngine } from '../../server/engine/fuzzyTextEngine';
import { RetentionPolicyEngine } from '../../server/engine/retentionPolicyEngine';
import { StorageAdvisorEngine } from '../../server/engine/storageAdvisorEngine';
import { StorageKnowledgeBase } from '../../server/knowledge';

describe('Advanced Domain Engines & Knowledge Intelligence', () => {
  describe('FormatTaxonomyEngine', () => {
    const taxonomy = FormatTaxonomyEngine.getInstance();

    it('identifies file specification and deletion risk correctly', () => {
      const spec = taxonomy.getSpecification('pdf');
      expect(spec).not.toBeNull();
      expect(spec?.category).toBe('documents');
      expect(spec?.mimeType).toBe('application/pdf');

      expect(taxonomy.getDeletionRisk('database_backup.sql')).toBe('HIGH');
      expect(taxonomy.getDeletionRisk('id_rsa.key')).toBe('CRITICAL');
      expect(taxonomy.getDeletionRisk('vacation_photo.jpg')).toBe('SAFE');
    });

    it('summarizes format categories', () => {
      const summary = taxonomy.getCatalogSummary();
      expect(summary.images).toBeGreaterThan(0);
      expect(summary.documents).toBeGreaterThan(0);
    });
  });

  describe('PerceptualHashEngine', () => {
    it('computes difference hash and detects identical matrices', () => {
      // 8 rows x 9 columns
      const sampleMatrix: number[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => (r * 10 + c * 20) % 256)
      );

      const dHash = PerceptualHashEngine.computeDHashFromMatrix(sampleMatrix);
      expect(dHash.hash.length).toBe(16);
      expect(dHash.algorithm).toBe('dHash');

      const compare = PerceptualHashEngine.compareHashes(dHash.hash, dHash.hash);
      expect(compare.hammingDistance).toBe(0);
      expect(compare.similarityPercentage).toBe(100);
      expect(compare.isLikelyNearDuplicate).toBe(true);
    });

    it('detects divergent hashes with high Hamming distance', () => {
      const hashA = '0000000000000000';
      const hashB = 'ffffffffffffffff';
      const compare = PerceptualHashEngine.compareHashes(hashA, hashB);
      expect(compare.hammingDistance).toBe(64);
      expect(compare.similarityPercentage).toBe(0);
      expect(compare.isLikelyNearDuplicate).toBe(false);
    });
  });

  describe('FuzzyTextEngine', () => {
    it('computes Jaccard similarity between document text', () => {
      const doc1 = 'The quick brown fox jumps over the lazy dog in the green meadow';
      const doc2 = 'The quick brown fox leaps over the lazy dog in the green meadow';

      const result = FuzzyTextEngine.compareDocuments(doc1, doc2);
      expect(result.jaccardSimilarity).toBeGreaterThan(0.3);
      expect(result.levenshteinNormalized).toBeGreaterThan(0.8);
      expect(result.isSubstantialDuplicate).toBe(true);
    });
  });

  describe('RetentionPolicyEngine', () => {
    const retention = new RetentionPolicyEngine();

    it('evaluates file age against enterprise retention rules', () => {
      const staleLog = {
        id: 'f_log',
        name: 'debug_dump.log',
        size: 50000,
        extension: 'log',
        dateAdded: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days old (limit 14)
        tags: [],
      };

      const triggered = retention.evaluateFileAgainstPolicies(staleLog);
      expect(triggered.length).toBeGreaterThan(0);
      expect(triggered[0].action).toBe('DELETE');
    });
  });

  describe('StorageAdvisorEngine', () => {
    it('generates tiering breakdown and compression projections', () => {
      const sampleFiles = [
        { id: '1', name: 'data.csv', size: 10 * 1024 * 1024, category: 'documents', dateAdded: Date.now() },
        { id: '2', name: 'photo.png', size: 5 * 1024 * 1024, category: 'images', dateAdded: Date.now() - 100 * 24 * 60 * 60 * 1000 },
      ];

      const report = StorageAdvisorEngine.generateAdvisorReport(sampleFiles);
      expect(report.totalFilesCount).toBe(2);
      expect(report.tieringBreakdown.length).toBe(4);
      expect(report.potentialCompressionSavingsBytes).toBeGreaterThan(0);
    });
  });

  describe('StorageKnowledgeBase', () => {
    it('retrieves enterprise storage profiles by industry and search query', () => {
      const all = StorageKnowledgeBase.getAllProfiles();
      expect(all.length).toBeGreaterThan(1000);

      const healthcare = StorageKnowledgeBase.getProfilesByIndustry('Healthcare');
      expect(healthcare.length).toBeGreaterThan(0);

      const search = StorageKnowledgeBase.searchProfiles('cloud');
      expect(search.length).toBeGreaterThan(0);
    });
  });
});
