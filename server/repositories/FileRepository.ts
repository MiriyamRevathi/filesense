import fs from 'fs';
import path from 'path';
import { ServerFileEntity, ServerFileCategory } from '../types';
import { config } from '../config';

interface CatalogSchema {
  version: number;
  lastUpdated: string;
  files: ServerFileEntity[];
}

export class FileRepository {
  private static instance: FileRepository;
  private filePath: string;
  private files: Map<string, ServerFileEntity> = new Map();
  private isLoaded: boolean = false;

  private constructor(filePath: string = config.paths.dbFile) {
    this.filePath = filePath;
    this.ensureInitialized();
  }

  public static getInstance(): FileRepository {
    if (!FileRepository.instance) {
      FileRepository.instance = new FileRepository();
    }
    return FileRepository.instance;
  }

  private ensureInitialized(): void {
    if (this.isLoaded) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: CatalogSchema = JSON.parse(raw);
        if (Array.isArray(parsed.files)) {
          this.files.clear();
          for (const item of parsed.files) {
            this.files.set(item.id, item);
          }
        }
      } else {
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('[FileRepository] Failed to read catalog from disk:', err);
      this.files.clear();
      this.isLoaded = true;
    }
  }

  private saveToDisk(): void {
    try {
      const schema: CatalogSchema = {
        version: 1,
        lastUpdated: new Date().toISOString(),
        files: Array.from(this.files.values()),
      };

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(schema, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('[FileRepository] Error writing catalog to disk:', err);
    }
  }

  public getAll(includeDeleted: boolean = false): ServerFileEntity[] {
    this.ensureInitialized();
    const result: ServerFileEntity[] = [];
    for (const file of this.files.values()) {
      if (!includeDeleted && file.isDeleted) continue;
      result.push({ ...file });
    }
    return result;
  }

  public getById(id: string): ServerFileEntity | null {
    this.ensureInitialized();
    const file = this.files.get(id);
    if (!file || file.isDeleted) return null;
    return { ...file };
  }

  public getByHash(hash: string): ServerFileEntity[] {
    this.ensureInitialized();
    if (!hash) return [];
    return this.getAll(false).filter(f => f.hash === hash);
  }

  public getByCategory(category: ServerFileCategory): ServerFileEntity[] {
    this.ensureInitialized();
    return this.getAll(false).filter(f => f.category === category);
  }

  public save(file: ServerFileEntity): ServerFileEntity {
    this.ensureInitialized();
    this.files.set(file.id, { ...file });
    this.saveToDisk();
    return { ...file };
  }

  public saveBatch(fileList: ServerFileEntity[]): ServerFileEntity[] {
    this.ensureInitialized();
    for (const file of fileList) {
      this.files.set(file.id, { ...file });
    }
    this.saveToDisk();
    return fileList.map(f => ({ ...f }));
  }

  public update(id: string, updates: Partial<ServerFileEntity>): ServerFileEntity | null {
    this.ensureInitialized();
    const existing = this.files.get(id);
    if (!existing) return null;

    const updated: ServerFileEntity = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable ID
    };

    this.files.set(id, updated);
    this.saveToDisk();
    return { ...updated };
  }

  public delete(id: string, hard: boolean = false): boolean {
    this.ensureInitialized();
    const file = this.files.get(id);
    if (!file) return false;

    if (hard) {
      if (file.storagePath && fs.existsSync(file.storagePath)) {
        try {
          fs.unlinkSync(file.storagePath);
        } catch (e) {
          console.warn('[FileRepository] Could not remove physical file:', file.storagePath);
        }
      }
      this.files.delete(id);
    } else {
      file.isDeleted = true;
      file.deletedAt = Date.now();
      this.files.set(id, file);
    }

    this.saveToDisk();
    return true;
  }

  public deleteBatch(ids: string[], hard: boolean = false): number {
    this.ensureInitialized();
    let count = 0;
    for (const id of ids) {
      if (this.delete(id, hard)) {
        count++;
      }
    }
    return count;
  }

  public clearAll(hard: boolean = false): void {
    this.ensureInitialized();
    if (hard) {
      for (const file of this.files.values()) {
        if (file.storagePath && fs.existsSync(file.storagePath)) {
          try {
            fs.unlinkSync(file.storagePath);
          } catch (_) {}
        }
      }
      this.files.clear();
    } else {
      const now = Date.now();
      for (const file of this.files.values()) {
        file.isDeleted = true;
        file.deletedAt = now;
      }
    }
    this.saveToDisk();
  }

  public count(includeDeleted: boolean = false): number {
    this.ensureInitialized();
    if (includeDeleted) return this.files.size;
    let active = 0;
    for (const f of this.files.values()) {
      if (!f.isDeleted) active++;
    }
    return active;
  }
}
