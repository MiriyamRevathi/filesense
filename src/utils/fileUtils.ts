import { FileCategory, StoredFileRecord } from '../types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'file_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  const val = parseFloat((bytes / Math.pow(k, idx)).toFixed(dm));
  return `${val} ${sizes[idx]}`;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts.pop()?.toLowerCase() || '';
}

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const ext = getFileExtension(filename);
  const lowerMime = (mimeType || '').toLowerCase();

  if (
    lowerMime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico', 'avif', 'tiff'].includes(ext)
  ) {
    return 'images';
  }

  if (
    lowerMime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext)
  ) {
    return 'audio';
  }

  if (
    lowerMime.startsWith('video/') ||
    ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv', 'm4v', '3gp'].includes(ext)
  ) {
    return 'video';
  }

  if (
    lowerMime.includes('zip') ||
    lowerMime.includes('tar') ||
    lowerMime.includes('gzip') ||
    lowerMime.includes('7z') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)
  ) {
    return 'archives';
  }

  if (
    lowerMime.includes('javascript') ||
    lowerMime.includes('typescript') ||
    lowerMime.includes('json') ||
    lowerMime === 'application/xml' ||
    lowerMime === 'text/xml' ||
    lowerMime.includes('html') ||
    lowerMime.includes('css') ||
    [
      'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'py', 'java',
      'c', 'cpp', 'cs', 'go', 'rs', 'php', 'rb', 'sql', 'sh', 'yaml', 'yml', 'xml'
    ].includes(ext)
  ) {
    return 'code';
  }

  if (
    lowerMime.includes('pdf') ||
    lowerMime.includes('word') ||
    lowerMime.includes('officedocument') ||
    lowerMime.includes('document') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('presentation') ||
    lowerMime.startsWith('text/') ||
    [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf',
      'md', 'csv', 'tsv', 'odt', 'ods', 'odp'
    ].includes(ext)
  ) {
    return 'documents';
  }

  return 'other';
}

export function getCategoryLabel(category: FileCategory): string {
  switch (category) {
    case 'images':
      return 'Images';
    case 'documents':
      return 'Documents';
    case 'audio':
      return 'Audio';
    case 'video':
      return 'Video';
    case 'code':
      return 'Code & Data';
    case 'archives':
      return 'Archives';
    case 'other':
    default:
      return 'Other';
  }
}

export function getCategoryColor(category: FileCategory): {
  bg: string;
  text: string;
  border: string;
  accent: string;
} {
  switch (category) {
    case 'images':
      return {
        bg: '#F3E8FF',
        text: '#7E22CE',
        border: '#E9D5FF',
        accent: '#9333EA',
      };
    case 'documents':
      return {
        bg: '#EDE7FF',
        text: '#5B42C4',
        border: '#D8D2EB',
        accent: '#8064E9',
      };
    case 'audio':
      return {
        bg: '#FCE7F3',
        text: '#BE185D',
        border: '#FBCFE8',
        accent: '#DB2777',
      };
    case 'video':
      return {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FDE68A',
        accent: '#D97706',
      };
    case 'code':
      return {
        bg: '#E0F2FE',
        text: '#0369A1',
        border: '#BAE6FD',
        accent: '#0284C7',
      };
    case 'archives':
      return {
        bg: '#FEF08A',
        text: '#854D0E',
        border: '#FDE047',
        accent: '#CA8A04',
      };
    case 'other':
    default:
      return {
        bg: '#F1F5F9',
        text: '#475569',
        border: '#E2E8F0',
        accent: '#64748B',
      };
  }
}

export function createFileRecordFromFile(file: File): StoredFileRecord {
  const category = getFileCategory(file.type, file.name);
  return {
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified || Date.now(),
    dateAdded: Date.now(),
    blob: file,
    hashStatus: 'unhashed',
    category,
  };
}

export function downloadFileBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMetadataAsJson(files: StoredFileRecord[]): void {
  const data = files.map(f => ({
    id: f.id,
    name: f.name,
    size: f.size,
    sizeFormatted: formatBytes(f.size),
    type: f.type,
    category: f.category,
    lastModified: new Date(f.lastModified).toISOString(),
    dateAdded: new Date(f.dateAdded).toISOString(),
    sha256Hash: f.hash || null,
    hashStatus: f.hashStatus,
  }));

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFileBlob(blob, `filesense_metadata_${new Date().toISOString().slice(0, 10)}.json`);
}
