/**
 * FileSense Format Taxonomy & Signature Intelligence Engine
 * Comprehensive database of file formats, magic numbers, MIME types,
 * categories, compression characteristics, and deletion safety risk profiles.
 */

export interface FormatSpecification {
  extension: string;
  name: string;
  category: 'images' | 'documents' | 'audio' | 'video' | 'code' | 'archives' | 'other';
  mimeType: string;
  magicBytes?: number[];
  magicHex?: string;
  isLossless?: boolean;
  compressionType?: string;
  typicalSizeRange: string;
  deletionRiskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  rfcStandard?: string;
}

export class FormatTaxonomyEngine {
  private static instance: FormatTaxonomyEngine;
  private formatCatalog: Map<string, FormatSpecification> = new Map();

  private constructor() {
    this.registerSpecifications();
  }

  public static getInstance(): FormatTaxonomyEngine {
    if (!FormatTaxonomyEngine.instance) {
      FormatTaxonomyEngine.instance = new FormatTaxonomyEngine();
    }
    return FormatTaxonomyEngine.instance;
  }

  private registerSpecifications(): void {
    const rawFormats: FormatSpecification[] = [
      // Images
      {
        extension: 'jpg',
        name: 'JPEG Image',
        category: 'images',
        mimeType: 'image/jpeg',
        magicHex: 'FF D8 FF',
        isLossless: false,
        typicalSizeRange: '100KB - 15MB',
        deletionRiskLevel: 'SAFE',
        description: 'Joint Photographic Experts Group standard lossy raster graphic.',
        rfcStandard: 'RFC 2046',
      },
      {
        extension: 'jpeg',
        name: 'JPEG Image Alternate',
        category: 'images',
        mimeType: 'image/jpeg',
        magicHex: 'FF D8 FF',
        isLossless: false,
        typicalSizeRange: '100KB - 15MB',
        deletionRiskLevel: 'SAFE',
        description: 'Standard JPEG compression format.',
      },
      {
        extension: 'png',
        name: 'Portable Network Graphics',
        category: 'images',
        mimeType: 'image/png',
        magicHex: '89 50 4E 47 0D 0A 1A 0A',
        isLossless: true,
        typicalSizeRange: '50KB - 25MB',
        deletionRiskLevel: 'SAFE',
        description: 'W3C recommended lossless raster image with alpha transparency.',
        rfcStandard: 'RFC 2083',
      },
      {
        extension: 'webp',
        name: 'WebP Raster Image',
        category: 'images',
        mimeType: 'image/webp',
        magicHex: '52 49 46 46',
        isLossless: false,
        typicalSizeRange: '20KB - 8MB',
        deletionRiskLevel: 'SAFE',
        description: 'Modern high-compression web image developed by Google.',
      },
      {
        extension: 'gif',
        name: 'Graphics Interchange Format',
        category: 'images',
        mimeType: 'image/gif',
        magicHex: '47 49 46 38',
        isLossless: true,
        typicalSizeRange: '10KB - 20MB',
        deletionRiskLevel: 'SAFE',
        description: '8-bit indexed palette bitmap image supporting multiple frames.',
      },
      {
        extension: 'svg',
        name: 'Scalable Vector Graphics',
        category: 'images',
        mimeType: 'image/svg+xml',
        isLossless: true,
        typicalSizeRange: '2KB - 2MB',
        deletionRiskLevel: 'SAFE',
        description: 'XML-based two-dimensional vector graphics specification.',
      },
      {
        extension: 'bmp',
        name: 'Bitmap Image File',
        category: 'images',
        mimeType: 'image/bmp',
        magicHex: '42 4D',
        isLossless: true,
        typicalSizeRange: '1MB - 50MB',
        deletionRiskLevel: 'SAFE',
        description: 'Uncompressed device-independent raster graphic format.',
      },
      {
        extension: 'tiff',
        name: 'Tagged Image File Format',
        category: 'images',
        mimeType: 'image/tiff',
        magicHex: '49 49 2A 00',
        isLossless: true,
        typicalSizeRange: '5MB - 100MB',
        deletionRiskLevel: 'LOW',
        description: 'High-color depth graphics container for publishing and photography.',
      },
      {
        extension: 'heic',
        name: 'High Efficiency Image Container',
        category: 'images',
        mimeType: 'image/heic',
        isLossless: false,
        typicalSizeRange: '1MB - 10MB',
        deletionRiskLevel: 'SAFE',
        description: 'MPEG High Efficiency Image File Format based on HEVC encoding.',
      },
      {
        extension: 'raw',
        name: 'Camera Raw Sensor Data',
        category: 'images',
        mimeType: 'image/x-dcraw',
        isLossless: true,
        typicalSizeRange: '20MB - 120MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'Minimally processed sensor output from digital camera sensors.',
      },

      // Documents
      {
        extension: 'pdf',
        name: 'Portable Document Format',
        category: 'documents',
        mimeType: 'application/pdf',
        magicHex: '25 50 44 46',
        isLossless: true,
        typicalSizeRange: '50KB - 100MB',
        deletionRiskLevel: 'LOW',
        description: 'ISO 32000 standard formatted document representation.',
      },
      {
        extension: 'docx',
        name: 'Microsoft Word OpenXML Document',
        category: 'documents',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        magicHex: '50 4B 03 04',
        isLossless: true,
        typicalSizeRange: '20KB - 50MB',
        deletionRiskLevel: 'LOW',
        description: 'ZIP-compressed XML container for text processing documents.',
      },
      {
        extension: 'xlsx',
        name: 'Microsoft Excel OpenXML Spreadsheet',
        category: 'documents',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        magicHex: '50 4B 03 04',
        isLossless: true,
        typicalSizeRange: '20KB - 80MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'Tabular calculation spreadsheet workbook format.',
      },
      {
        extension: 'pptx',
        name: 'Microsoft PowerPoint Presentation',
        category: 'documents',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        magicHex: '50 4B 03 04',
        typicalSizeRange: '100KB - 200MB',
        deletionRiskLevel: 'LOW',
        description: 'OpenXML presentation slide deck container.',
      },
      {
        extension: 'txt',
        name: 'Plain Text Document',
        category: 'documents',
        mimeType: 'text/plain',
        typicalSizeRange: '1KB - 10MB',
        deletionRiskLevel: 'SAFE',
        description: 'Unformatted human-readable ASCII or UTF-8 text.',
      },
      {
        extension: 'md',
        name: 'Markdown Document',
        category: 'documents',
        mimeType: 'text/markdown',
        typicalSizeRange: '1KB - 5MB',
        deletionRiskLevel: 'SAFE',
        description: 'Lightweight markup language with plain text formatting syntax.',
      },
      {
        extension: 'csv',
        name: 'Comma-Separated Values',
        category: 'documents',
        mimeType: 'text/csv',
        typicalSizeRange: '1KB - 500MB',
        deletionRiskLevel: 'LOW',
        description: 'Delimited text file storing tabular data sets.',
        rfcStandard: 'RFC 4180',
      },

      // Audio
      {
        extension: 'mp3',
        name: 'MPEG Audio Layer III',
        category: 'audio',
        mimeType: 'audio/mpeg',
        magicHex: '49 44 33',
        isLossless: false,
        typicalSizeRange: '2MB - 30MB',
        deletionRiskLevel: 'SAFE',
        description: 'ISO standard psychoacoustic audio compression algorithm.',
      },
      {
        extension: 'wav',
        name: 'Waveform Audio File',
        category: 'audio',
        mimeType: 'audio/wav',
        magicHex: '52 49 46 46',
        isLossless: true,
        typicalSizeRange: '10MB - 200MB',
        deletionRiskLevel: 'LOW',
        description: 'Resource Interchange File Format uncompressed audio stream.',
      },
      {
        extension: 'flac',
        name: 'Free Lossless Audio Codec',
        category: 'audio',
        mimeType: 'audio/flac',
        magicHex: '66 4C 61 43',
        isLossless: true,
        typicalSizeRange: '15MB - 100MB',
        deletionRiskLevel: 'LOW',
        description: 'Open lossless compression audio format for archival preservation.',
      },
      {
        extension: 'aac',
        name: 'Advanced Audio Coding',
        category: 'audio',
        mimeType: 'audio/aac',
        isLossless: false,
        typicalSizeRange: '2MB - 25MB',
        deletionRiskLevel: 'SAFE',
        description: 'Standard lossy audio encoding successor to MP3.',
      },

      // Video
      {
        extension: 'mp4',
        name: 'MPEG-4 Part 14 Video',
        category: 'video',
        mimeType: 'video/mp4',
        magicHex: '00 00 00 18 66 74 79 70',
        isLossless: false,
        typicalSizeRange: '10MB - 10GB',
        deletionRiskLevel: 'SAFE',
        description: 'ISO/IEC 14496-14 digital multimedia container format.',
      },
      {
        extension: 'mkv',
        name: 'Matroska Video Container',
        category: 'video',
        mimeType: 'video/x-matroska',
        magicHex: '1A 45 DF A3',
        typicalSizeRange: '50MB - 25GB',
        deletionRiskLevel: 'SAFE',
        description: 'Open standard multimedia container supporting multiple audio/subtitle tracks.',
      },
      {
        extension: 'mov',
        name: 'Apple QuickTime Movie',
        category: 'video',
        mimeType: 'video/quicktime',
        typicalSizeRange: '20MB - 15GB',
        deletionRiskLevel: 'SAFE',
        description: 'Proprietary digital multimedia container format by Apple.',
      },
      {
        extension: 'webm',
        name: 'WebM Open Media Video',
        category: 'video',
        mimeType: 'video/webm',
        magicHex: '1A 45 DF A3',
        typicalSizeRange: '5MB - 5GB',
        deletionRiskLevel: 'SAFE',
        description: 'Royalty-free audiovisual format intended for HTML5 video.',
      },

      // Code & Data
      {
        extension: 'ts',
        name: 'TypeScript Source Code',
        category: 'code',
        mimeType: 'application/typescript',
        typicalSizeRange: '1KB - 2MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'Strict syntactical superset of JavaScript providing static types.',
      },
      {
        extension: 'tsx',
        name: 'TypeScript JSX Component',
        category: 'code',
        mimeType: 'application/typescript',
        typicalSizeRange: '1KB - 1MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'React JSX component source with TypeScript static typing.',
      },
      {
        extension: 'js',
        name: 'JavaScript Source Code',
        category: 'code',
        mimeType: 'application/javascript',
        typicalSizeRange: '1KB - 5MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'ECMAScript standard scripting language for web environments.',
      },
      {
        extension: 'py',
        name: 'Python Script File',
        category: 'code',
        mimeType: 'text/x-python',
        typicalSizeRange: '1KB - 1MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'Interpreted high-level dynamic programming language source.',
      },
      {
        extension: 'json',
        name: 'JavaScript Object Notation',
        category: 'code',
        mimeType: 'application/json',
        typicalSizeRange: '100B - 100MB',
        deletionRiskLevel: 'MEDIUM',
        description: 'Open standard file format and data interchange format.',
        rfcStandard: 'RFC 8259',
      },
      {
        extension: 'sql',
        name: 'Structured Query Language Script',
        category: 'code',
        mimeType: 'application/sql',
        typicalSizeRange: '1KB - 2GB',
        deletionRiskLevel: 'HIGH',
        description: 'Relational database schema, migration, or export statements.',
      },

      // Archives
      {
        extension: 'zip',
        name: 'ZIP Archive',
        category: 'archives',
        mimeType: 'application/zip',
        magicHex: '50 4B 03 04',
        typicalSizeRange: '10KB - 50GB',
        deletionRiskLevel: 'SAFE',
        description: 'PKWARE archive file format supporting lossless data compression.',
      },
      {
        extension: 'tar',
        name: 'Tape Archive',
        category: 'archives',
        mimeType: 'application/x-tar',
        magicHex: '75 73 74 61 72',
        typicalSizeRange: '10KB - 100GB',
        deletionRiskLevel: 'SAFE',
        description: 'Consolidated file bundle format without native compression.',
      },
      {
        extension: 'gz',
        name: 'Gzip Compressed File',
        category: 'archives',
        mimeType: 'application/gzip',
        magicHex: '1F 8B',
        typicalSizeRange: '1KB - 10GB',
        deletionRiskLevel: 'SAFE',
        description: 'Single-file compression format using the DEFLATE algorithm.',
        rfcStandard: 'RFC 1952',
      },
      {
        extension: '7z',
        name: '7-Zip Compressed Archive',
        category: 'archives',
        mimeType: 'application/x-7z-compressed',
        magicHex: '37 7A BC AF 27 1C',
        typicalSizeRange: '10KB - 100GB',
        deletionRiskLevel: 'SAFE',
        description: 'High-ratio compressed archive using LZMA/LZMA2 algorithms.',
      },

      // System & Security (Sensitive)
      {
        extension: 'key',
        name: 'Cryptographic Private Key',
        category: 'other',
        mimeType: 'application/x-pem-file',
        typicalSizeRange: '500B - 10KB',
        deletionRiskLevel: 'CRITICAL',
        description: 'Private encryption key. Deletion could result in permanent data loss.',
      },
      {
        extension: 'pem',
        name: 'Privacy-Enhanced Mail Certificate',
        category: 'other',
        mimeType: 'application/x-pem-file',
        typicalSizeRange: '1KB - 20KB',
        deletionRiskLevel: 'CRITICAL',
        description: 'Base64 encoded certificate and key container.',
      },
    ];

    for (const spec of rawFormats) {
      this.formatCatalog.set(spec.extension.toLowerCase(), spec);
    }
  }

  public getSpecification(extension: string): FormatSpecification | null {
    const cleanExt = extension.replace(/^\./, '').toLowerCase();
    return this.formatCatalog.get(cleanExt) || null;
  }

  public getDeletionRisk(filename: string): 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const ext = filename.split('.').pop() || '';
    const spec = this.getSpecification(ext);
    if (spec) return spec.deletionRiskLevel;

    // Check sensitive filename patterns
    const lower = filename.toLowerCase();
    if (lower.includes('credential') || lower.includes('secret') || lower.includes('id_rsa')) {
      return 'CRITICAL';
    }
    if (lower.endsWith('.sqlite') || lower.endsWith('.db') || lower.endsWith('.env')) {
      return 'HIGH';
    }
    return 'LOW';
  }

  public getAllSupportedExtensions(): string[] {
    return Array.from(this.formatCatalog.keys());
  }

  public getCatalogSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const spec of this.formatCatalog.values()) {
      summary[spec.category] = (summary[spec.category] || 0) + 1;
    }
    return summary;
  }
}
