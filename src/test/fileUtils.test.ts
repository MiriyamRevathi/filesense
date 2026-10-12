import { describe, it, expect } from 'vitest';
import {
  getFileCategory,
  getFileExtension,
  formatBytes,
  formatDate,
  createFileRecordFromFile,
} from '../utils/fileUtils';
import { filterAndSortFiles } from '../utils/storageCalculations';
import { StoredFileRecord } from '../types';

describe('fileUtils', () => {
  describe('getFileCategory', () => {
    it('categorizes images correctly', () => {
      expect(getFileCategory('image/png', 'picture.png')).toBe('images');
      expect(getFileCategory('image/jpeg', 'photo.jpg')).toBe('images');
      expect(getFileCategory('', 'graphic.svg')).toBe('images');
    });

    it('categorizes documents correctly', () => {
      expect(getFileCategory('application/pdf', 'doc.pdf')).toBe('documents');
      expect(getFileCategory('text/plain', 'notes.txt')).toBe('documents');
      expect(getFileCategory('text/markdown', 'readme.md')).toBe('documents');
      expect(getFileCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'report.docx')).toBe('documents');
    });

    it('categorizes code and data files correctly', () => {
      expect(getFileCategory('application/json', 'config.json')).toBe('code');
      expect(getFileCategory('text/javascript', 'app.js')).toBe('code');
      expect(getFileCategory('', 'script.py')).toBe('code');
      expect(getFileCategory('', 'styles.css')).toBe('code');
    });

    it('categorizes audio and video correctly', () => {
      expect(getFileCategory('audio/mpeg', 'song.mp3')).toBe('audio');
      expect(getFileCategory('video/mp4', 'movie.mp4')).toBe('video');
    });

    it('categorizes archives correctly', () => {
      expect(getFileCategory('application/zip', 'archive.zip')).toBe('archives');
      expect(getFileCategory('', 'bundle.tar.gz')).toBe('archives');
    });

    it('falls back to other for unknown types', () => {
      expect(getFileCategory('application/octet-stream', 'unknown.xyz123')).toBe('other');
    });
  });

  describe('getFileExtension', () => {
    it('extracts lowercased extensions correctly', () => {
      expect(getFileExtension('FILE.PDF')).toBe('pdf');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('formatBytes', () => {
    it('formats 0 and invalid inputs gracefully', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-100)).toBe('0 B');
    });

    it('formats units accurately', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe('5 GB');
    });
  });

  describe('formatDate', () => {
    it('formats valid timestamp without crashing', () => {
      const formatted = formatDate(1700000000000);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('handles falsy timestamp', () => {
      expect(formatDate(0)).toBe('Unknown date');
    });
  });

  describe('createFileRecordFromFile', () => {
    it('converts DOM File to StoredFileRecord', () => {
      const file = new File(['hello world content'], 'sample.txt', {
        type: 'text/plain',
        lastModified: 1700000000000,
      });

      const record = createFileRecordFromFile(file);
      expect(record.name).toBe('sample.txt');
      expect(record.size).toBe(19);
      expect(record.type).toBe('text/plain');
      expect(record.category).toBe('documents');
      expect(record.hashStatus).toBe('unhashed');
      expect(record.id).toBeDefined();
    });
  });
});
