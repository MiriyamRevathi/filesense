import { describe, it, expect, vi } from 'vitest';
import {
  computeBlobSha256,
  groupFilesBySize,
  calculateWastedBytesForGroup,
  runDuplicateAnalysis,
} from '../services/duplicateEngine';
import { StoredFileRecord } from '../types';

describe('duplicateEngine', () => {
  const createMockRecord = (
    id: string,
    name: string,
    content: string,
    type = 'text/plain'
  ): StoredFileRecord => {
    const blob = new Blob([content], { type });
    return {
      id,
      name,
      size: blob.size,
      type,
      lastModified: Date.now(),
      dateAdded: Date.now(),
      blob,
      hashStatus: 'unhashed',
      category: 'documents',
    };
  };

  describe('computeBlobSha256', () => {
    it('computes deterministic SHA-256 hash for identical contents', async () => {
      const blob1 = new Blob(['FileSense test payload']);
      const blob2 = new Blob(['FileSense test payload']);
      const hash1 = await computeBlobSha256(blob1);
      const hash2 = await computeBlobSha256(blob2);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('computes different SHA-256 hashes for different contents', async () => {
      const blob1 = new Blob(['Alpha content']);
      const blob2 = new Blob(['Beta content']);
      const hash1 = await computeBlobSha256(blob1);
      const hash2 = await computeBlobSha256(blob2);

      expect(hash1).not.toBe(hash2);
    });

    it('handles empty content blob (0 bytes)', async () => {
      const emptyBlob = new Blob(['']);
      const hash = await computeBlobSha256(emptyBlob);
      // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('calculateWastedBytesForGroup', () => {
    it('calculates (n - 1) * s accurately', () => {
      // 3 files of 100 bytes: (3 - 1) * 100 = 200
      expect(calculateWastedBytesForGroup(3, 100)).toBe(200);
      // 1 file: 0 wasted bytes
      expect(calculateWastedBytesForGroup(1, 100)).toBe(0);
      // 0 or negative size: 0 wasted
      expect(calculateWastedBytesForGroup(2, 0)).toBe(0);
      // 5 files of 1024 bytes: 4096
      expect(calculateWastedBytesForGroup(5, 1024)).toBe(4096);
    });
  });

  describe('groupFilesBySize', () => {
    it('groups files by their exact byte sizes', () => {
      const f1 = createMockRecord('1', 'a.txt', '12345'); // 5 bytes
      const f2 = createMockRecord('2', 'b.txt', '54321'); // 5 bytes
      const f3 = createMockRecord('3', 'c.txt', '1234567890'); // 10 bytes

      const groups = groupFilesBySize([f1, f2, f3]);
      expect(groups.get(5)?.length).toBe(2);
      expect(groups.get(10)?.length).toBe(1);
    });
  });

  describe('runDuplicateAnalysis', () => {
    it('detects identical contents with DIFFERENT filenames', async () => {
      const f1 = createMockRecord('1', 'annual_report.pdf', 'Confidential financial data 2026');
      const f2 = createMockRecord('2', 'backup_copy.pdf', 'Confidential financial data 2026');
      const f3 = createMockRecord('3', 'third_copy.pdf', 'Confidential financial data 2026');

      const result = await runDuplicateAnalysis([f1, f2, f3]);
      expect(result.duplicateGroups.length).toBe(1);
      expect(result.duplicateGroups[0].files.length).toBe(3);
      // (3 - 1) * size
      expect(result.totalReclaimableBytes).toBe(2 * f1.size);
    });

    it('does NOT group identical filenames with DIFFERENT contents as duplicates', async () => {
      const f1 = createMockRecord('1', 'report.pdf', 'Report version 1 content');
      const f2 = createMockRecord('2', 'report.pdf', 'Report version 2 differing content!');

      const result = await runDuplicateAnalysis([f1, f2]);
      expect(result.duplicateGroups.length).toBe(0);
      expect(result.totalReclaimableBytes).toBe(0);
    });

    it('ignores files with different sizes without unnecessary hashing', async () => {
      const f1 = createMockRecord('1', 'f1.txt', 'A');
      const f2 = createMockRecord('2', 'f2.txt', 'BB');
      const f3 = createMockRecord('3', 'f3.txt', 'CCC');

      const result = await runDuplicateAnalysis([f1, f2, f3]);
      expect(result.duplicateGroups.length).toBe(0);
      expect(result.totalReclaimableBytes).toBe(0);
    });

    it('identifies multiple distinct duplicate groups simultaneously without double-counting', async () => {
      // Group A: 2 files of content A
      const a1 = createMockRecord('a1', 'a1.txt', 'Content A');
      const a2 = createMockRecord('a2', 'a2.txt', 'Content A');

      // Group B: 3 files of content B
      const b1 = createMockRecord('b1', 'b1.txt', 'Longer Content B Data');
      const b2 = createMockRecord('b2', 'b2.txt', 'Longer Content B Data');
      const b3 = createMockRecord('b3', 'b3.txt', 'Longer Content B Data');

      // Unique file C
      const c1 = createMockRecord('c1', 'c1.txt', 'Unique content C');

      const result = await runDuplicateAnalysis([a1, a2, b1, b2, b3, c1]);
      expect(result.duplicateGroups.length).toBe(2);

      const expectedSavings = 1 * a1.size + 2 * b1.size;
      expect(result.totalReclaimableBytes).toBe(expectedSavings);
    });

    it('handles duplicate empty files safely with 0 wasted bytes', async () => {
      const e1 = createMockRecord('e1', 'empty1.txt', '');
      const e2 = createMockRecord('e2', 'empty2.txt', '');

      const result = await runDuplicateAnalysis([e1, e2]);
      expect(result.duplicateGroups.length).toBe(1);
      expect(result.duplicateGroups[0].files.length).toBe(2);
      expect(result.duplicateGroups[0].wastedBytes).toBe(0);
      expect(result.totalReclaimableBytes).toBe(0);
    });

    it('handles hashing failures gracefully by updating hashStatus to error', async () => {
      const brokenBlob = {
        size: 50,
        type: 'text/plain',
        arrayBuffer: vi.fn().mockRejectedValue(new Error('Simulated read failure')),
      } as unknown as Blob;

      const brokenFile1: StoredFileRecord = {
        id: 'err1',
        name: 'damaged1.dat',
        size: 50,
        type: 'text/plain',
        lastModified: Date.now(),
        dateAdded: Date.now(),
        blob: brokenBlob,
        hashStatus: 'unhashed',
        category: 'other',
      };

      const brokenFile2: StoredFileRecord = {
        id: 'err2',
        name: 'damaged2.dat',
        size: 50,
        type: 'text/plain',
        lastModified: Date.now(),
        dateAdded: Date.now(),
        blob: brokenBlob,
        hashStatus: 'unhashed',
        category: 'other',
      };

      const result = await runDuplicateAnalysis([brokenFile1, brokenFile2]);
      expect(result.duplicateGroups.length).toBe(0);
      const updatedErr = result.updatedFiles.find(f => f.id === 'err1');
      expect(updatedErr?.hashStatus).toBe('error');
      expect(updatedErr?.errorMessage).toContain('Simulated read failure');
    });
  });
});
