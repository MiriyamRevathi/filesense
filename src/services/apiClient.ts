import { StoredFileRecord, DuplicateGroup, StorageStats, FileCategory } from '../types';

const API_BASE = '/api';

export interface ServerFileDto {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: number;
  dateAdded: number;
  hash: string;
  category: FileCategory;
  tags: string[];
  isDuplicate: boolean;
  duplicateGroupId?: string;
}

export class ApiClient {
  private static instance: ApiClient;

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public async checkServerHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/system/health`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  public async fetchFiles(options?: { category?: string; search?: string }): Promise<ServerFileDto[]> {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.search) params.set('search', options.search);

    const res = await fetch(`${API_BASE}/files?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch files from server`);
    const json = await res.json();
    return json.data || [];
  }

  public async createFileRecord(record: {
    name: string;
    size: number;
    type?: string;
    hash?: string;
    category?: FileCategory;
    tags?: string[];
  }): Promise<ServerFileDto> {
    const res = await fetch(`${API_BASE}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create file record`);
    const json = await res.json();
    return json.data;
  }

  public async updateCategory(id: string, category: FileCategory): Promise<ServerFileDto> {
    const res = await fetch(`${API_BASE}/files/${id}/category`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update category`);
    const json = await res.json();
    return json.data;
  }

  public async updateTags(id: string, tags: string[]): Promise<ServerFileDto> {
    const res = await fetch(`${API_BASE}/files/${id}/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update tags`);
    const json = await res.json();
    return json.data;
  }

  public async deleteFile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/files/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete file`);
  }

  public async deleteBatch(ids: string[]): Promise<number> {
    const res = await fetch(`${API_BASE}/files/batch`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete batch`);
    const json = await res.json();
    return json.data?.deletedCount || 0;
  }

  public async scanDuplicates(): Promise<DuplicateGroup[]> {
    const res = await fetch(`${API_BASE}/duplicates/scan`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to scan duplicates`);
    const json = await res.json();
    return json.data?.groups || [];
  }

  public async resolveDuplicates(strategy: string): Promise<{ filesDeletedCount: number; bytesReclaimed: number }> {
    const res = await fetch(`${API_BASE}/duplicates/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategy }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to resolve duplicates`);
    const json = await res.json();
    return json.data;
  }

  public async fetchStorageStats(): Promise<StorageStats> {
    const res = await fetch(`${API_BASE}/analytics/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch analytics`);
    const json = await res.json();
    return json.data;
  }

  public async requestAiAnalysis(fileId: string): Promise<{
    suggestedTags: string[];
    detectedCategory: FileCategory;
    summary: string;
    recommendation: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/analyze/${fileId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: AI analysis failed`);
    const json = await res.json();
    return json.data;
  }

  public async requestAiCatalogAudit(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/audit`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: AI audit failed`);
    const json = await res.json();
    return json.data;
  }
}

export const apiClient = ApiClient.getInstance();
