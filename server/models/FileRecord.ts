import { ServerFileEntity, ServerFileCategory, ServerHashStatus } from '../types';

export class FileRecord implements ServerFileEntity {
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

  constructor(data: Partial<ServerFileEntity> & { name: string; size: number }) {
    this.id = data.id || `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.name = data.name;
    this.size = Math.max(0, data.size || 0);
    this.type = data.type || FileRecord.inferMimeType(data.name);
    this.extension = FileRecord.extractExtension(data.name);
    this.lastModified = data.lastModified || Date.now();
    this.dateAdded = data.dateAdded || Date.now();
    this.hash = data.hash || '';
    this.hashStatus = data.hashStatus || (data.hash ? 'hashed' : 'unhashed');
    this.category = data.category || FileRecord.classifyCategory(data.name, this.type);
    this.tags = Array.isArray(data.tags) ? [...data.tags] : [];
    this.aiSummary = data.aiSummary;
    this.aiSuggestedCategory = data.aiSuggestedCategory;
    this.isDuplicate = Boolean(data.isDuplicate);
    this.duplicateGroupId = data.duplicateGroupId;
    this.storagePath = data.storagePath;
    this.isDeleted = Boolean(data.isDeleted);
    this.deletedAt = data.deletedAt;
  }

  static extractExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) return '';
    return filename.substring(lastDot + 1).toLowerCase();
  }

  static inferMimeType(filename: string): string {
    const ext = this.extractExtension(filename);
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      webm: 'video/webm',
      zip: 'application/zip',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      ts: 'application/typescript',
      tsx: 'application/typescript',
      js: 'application/javascript',
      jsx: 'application/javascript',
      json: 'application/json',
      py: 'text/x-python',
      html: 'text/html',
      css: 'text/css',
      sql: 'application/sql',
      sh: 'application/x-sh',
    };
    return mimeMap[ext] || 'application/octet-stream';
  }

  static classifyCategory(filename: string, mimeType?: string): ServerFileCategory {
    const ext = this.extractExtension(filename);
    const mime = (mimeType || '').toLowerCase();

    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'avif'].includes(ext) ||
      mime.startsWith('image/')
    ) {
      return 'images';
    }

    if (
      ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'md'].includes(ext) ||
      mime.includes('document') ||
      mime.includes('spreadsheet') ||
      mime.includes('presentation') ||
      mime.includes('pdf') ||
      mime.startsWith('text/')
    ) {
      return 'documents';
    }

    if (
      ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'wma', 'alac'].includes(ext) ||
      mime.startsWith('audio/')
    ) {
      return 'audio';
    }

    if (
      ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp'].includes(ext) ||
      mime.startsWith('video/')
    ) {
      return 'video';
    }

    if (
      ['ts', 'tsx', 'js', 'jsx', 'json', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'kt', 'html', 'css', 'scss', 'sql', 'sh', 'yaml', 'yml', 'xml'].includes(ext)
    ) {
      return 'code';
    }

    if (
      ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg'].includes(ext) ||
      mime.includes('zip') ||
      mime.includes('tar') ||
      mime.includes('compressed')
    ) {
      return 'archives';
    }

    return 'other';
  }

  toJSON(): ServerFileEntity {
    return {
      id: this.id,
      name: this.name,
      size: this.size,
      type: this.type,
      extension: this.extension,
      lastModified: this.lastModified,
      dateAdded: this.dateAdded,
      hash: this.hash,
      hashStatus: this.hashStatus,
      category: this.category,
      tags: this.tags,
      aiSummary: this.aiSummary,
      aiSuggestedCategory: this.aiSuggestedCategory,
      isDuplicate: this.isDuplicate,
      duplicateGroupId: this.duplicateGroupId,
      storagePath: this.storagePath,
      isDeleted: this.isDeleted,
      deletedAt: this.deletedAt,
    };
  }
}
