import fs from 'fs';
import path from 'path';
import { FileRecord } from '../models/FileRecord';
import { FileRepository } from '../repositories/FileRepository';
import { HashService } from './HashService';
import { ServerFileEntity, ServerFileCategory } from '../types';
import { config } from '../config';

export class FileService {
  private repository: FileRepository;

  constructor(repository: FileRepository = FileRepository.getInstance()) {
    this.repository = repository;
  }

  public getAllFiles(options?: {
    category?: ServerFileCategory;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }): ServerFileEntity[] {
    let files = this.repository.getAll(options?.includeDeleted);

    if (options?.category) {
      files = files.filter(f => f.category === options.category);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      files = files.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.extension.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q)) ||
        (f.hash && f.hash.toLowerCase().includes(q))
      );
    }

    if (options?.sortBy) {
      const order = options.sortOrder === 'desc' ? -1 : 1;
      files.sort((a, b) => {
        switch (options.sortBy) {
          case 'name':
            return a.name.localeCompare(b.name) * order;
          case 'size':
            return (a.size - b.size) * order;
          case 'date':
          case 'dateAdded':
            return (a.dateAdded - b.dateAdded) * order;
          case 'category':
            return a.category.localeCompare(b.category) * order;
          default:
            return (b.dateAdded - a.dateAdded);
        }
      });
    }

    return files;
  }

  public getFileById(id: string): ServerFileEntity | null {
    return this.repository.getById(id);
  }

  public createFileRecord(data: {
    name: string;
    size: number;
    type?: string;
    contentBuffer?: Buffer;
    hash?: string;
    category?: ServerFileCategory;
    tags?: string[];
  }): ServerFileEntity {
    let hash = data.hash;
    let storagePath: string | undefined;

    if (data.contentBuffer) {
      if (!hash) {
        hash = HashService.hashBuffer(data.contentBuffer);
      }
      const safeName = `${Date.now()}_${data.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      storagePath = path.join(config.paths.uploads, safeName);
      fs.writeFileSync(storagePath, data.contentBuffer);
    }

    const fileRecord = new FileRecord({
      name: data.name,
      size: data.size,
      type: data.type,
      hash: hash || '',
      hashStatus: hash ? 'hashed' : 'unhashed',
      category: data.category,
      tags: data.tags || [],
      storagePath,
    });

    return this.repository.save(fileRecord.toJSON());
  }

  public updateCategory(id: string, newCategory: ServerFileCategory): ServerFileEntity | null {
    return this.repository.update(id, { category: newCategory });
  }

  public updateTags(id: string, tags: string[]): ServerFileEntity | null {
    return this.repository.update(id, { tags });
  }

  public addTag(id: string, tag: string): ServerFileEntity | null {
    const file = this.repository.getById(id);
    if (!file) return null;
    if (file.tags.includes(tag)) return file;
    const newTags = [...file.tags, tag];
    return this.repository.update(id, { tags: newTags });
  }

  public deleteFile(id: string, hard: boolean = false): boolean {
    return this.repository.delete(id, hard);
  }

  public deleteFilesBatch(ids: string[], hard: boolean = false): number {
    return this.repository.deleteBatch(ids, hard);
  }

  public updateHash(id: string, hash: string): ServerFileEntity | null {
    return this.repository.update(id, {
      hash,
      hashStatus: 'hashed',
    });
  }

  public clearAllFiles(hard: boolean = false): void {
    this.repository.clearAll(hard);
  }

  public seedDemoFiles(): ServerFileEntity[] {
    const demoCatalog = [
      {
        name: 'Quarterly_Financial_Report_Q3.pdf',
        size: 2457600,
        type: 'application/pdf',
        category: 'documents' as ServerFileCategory,
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        tags: ['finance', 'report', 'q3'],
      },
      {
        name: 'Quarterly_Financial_Report_Q3_Copy.pdf',
        size: 2457600,
        type: 'application/pdf',
        category: 'documents' as ServerFileCategory,
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        tags: ['finance', 'backup'],
      },
      {
        name: 'Product_Hero_Banner_4K.png',
        size: 8912896,
        type: 'image/png',
        category: 'images' as ServerFileCategory,
        hash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
        tags: ['marketing', 'design', '4k'],
      },
      {
        name: 'Product_Hero_Banner_4K_Final.png',
        size: 8912896,
        type: 'image/png',
        category: 'images' as ServerFileCategory,
        hash: 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78',
        tags: ['marketing', 'design', 'final'],
      },
      {
        name: 'Customer_Success_Webinar.mp4',
        size: 157286400,
        type: 'video/mp4',
        category: 'video' as ServerFileCategory,
        hash: '7d793037a0760186574b0282f2f435e7b1e51a448d580802c1958691649721be',
        tags: ['video', 'webinar', 'training'],
      },
      {
        name: 'Database_Backup_2026.sql.gz',
        size: 45088768,
        type: 'application/gzip',
        category: 'archives' as ServerFileCategory,
        hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
        tags: ['database', 'production', 'backup'],
      },
      {
        name: 'Podcast_Episode_12_Master.wav',
        size: 67108864,
        type: 'audio/wav',
        category: 'audio' as ServerFileCategory,
        hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
        tags: ['audio', 'podcast', 'episode12'],
      },
      {
        name: 'Podcast_Episode_12_Master_Duplicate.wav',
        size: 67108864,
        type: 'audio/wav',
        category: 'audio' as ServerFileCategory,
        hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
        tags: ['audio', 'duplicate'],
      },
      {
        name: 'DataPipelineEngine.ts',
        size: 49152,
        type: 'application/typescript',
        category: 'code' as ServerFileCategory,
        hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        tags: ['source-code', 'pipeline', 'core'],
      },
      {
        name: 'DataPipelineEngine_backup.ts',
        size: 49152,
        type: 'application/typescript',
        category: 'code' as ServerFileCategory,
        hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        tags: ['backup', 'source-code'],
      },
    ];

    const results: ServerFileEntity[] = [];
    for (const item of demoCatalog) {
      const record = new FileRecord({
        name: item.name,
        size: item.size,
        type: item.type,
        category: item.category,
        hash: item.hash,
        tags: item.tags,
      });
      results.push(this.repository.save(record.toJSON()));
    }

    return results;
  }
}
