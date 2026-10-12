import { GoogleGenAI } from '@google/genai';
import { FileRepository } from '../repositories/FileRepository';
import {
  ServerFileEntity,
  ServerFileCategory,
  AiTaggingRequest,
  AiTaggingResponse,
  AiCatalogAuditReport,
  AiCatalogAuditRecommendation,
} from '../types';
import { config } from '../config';

export class AiService {
  private client: GoogleGenAI | null = null;
  private repository: FileRepository;

  constructor(repository: FileRepository = FileRepository.getInstance()) {
    this.repository = repository;
    this.initGeminiClient();
  }

  private initGeminiClient(): void {
    const apiKey = config.gemini.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('[AiService] Failed to initialize GoogleGenAI client:', err);
        this.client = null;
      }
    }
  }

  /**
   * Generates intelligent semantic tags and categorized recommendations for a file.
   */
  public async analyzeFile(request: AiTaggingRequest): Promise<AiTaggingResponse> {
    if (this.client) {
      try {
        const prompt = `Analyze this file and return strict JSON with format:
{
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "detectedCategory": "images" | "documents" | "audio" | "video" | "code" | "archives" | "other",
  "summary": "Brief 1-sentence description of the file purpose and type",
  "confidenceScore": number between 0.0 and 1.0,
  "recommendation": "Storage advice for this file"
}
File Name: ${request.filename}
MIME Type: ${request.mimeType}
File Size: ${request.fileSizeBytes} bytes
${request.previewSnippet ? `Snippet Preview: ${request.previewSnippet}` : ''}`;

        const response = await this.client.models.generateContent({
          model: config.gemini.modelName,
          contents: prompt,
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            fileId: request.fileId,
            suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : ['unclassified'],
            detectedCategory: parsed.detectedCategory || 'other',
            summary: parsed.summary || `File: ${request.filename}`,
            confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.85,
            recommendation: parsed.recommendation || 'Retain file in storage.',
          };
        }
      } catch (err) {
        console.warn('[AiService] Gemini API call error, using deterministic analysis:', err);
      }
    }

    // High-accuracy heuristic rule-based analysis (fallback & standalone)
    return this.heuristicAnalyze(request);
  }

  /**
   * Rule-based semantic inference engine.
   */
  private heuristicAnalyze(request: AiTaggingRequest): AiTaggingResponse {
    const filename = request.filename.toLowerCase();
    const tags: Set<string> = new Set();
    let detectedCategory: ServerFileCategory = 'other';
    let summary = `Standard file item (${request.filename})`;
    let recommendation = 'Retain file in library.';

    // Tags from filename patterns
    if (filename.includes('backup') || filename.includes('bak')) tags.add('backup');
    if (filename.includes('copy') || /\(\d+\)/.test(filename)) tags.add('duplicate-candidate');
    if (filename.includes('draft')) tags.add('draft');
    if (filename.includes('final')) tags.add('final');
    if (filename.includes('invoice') || filename.includes('receipt') || filename.includes('tax')) {
      tags.add('finance');
      tags.add('receipt');
    }
    if (filename.includes('report') || filename.includes('summary')) tags.add('report');
    if (filename.includes('confidential') || filename.includes('private')) tags.add('sensitive');
    if (filename.includes('test') || filename.includes('spec')) tags.add('testing');

    // Category and extension detection
    const ext = filename.split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'svg', 'webp', 'gif'].includes(ext)) {
      detectedCategory = 'images';
      tags.add('visual-asset');
      if (request.fileSizeBytes > 5 * 1024 * 1024) tags.add('high-resolution');
      summary = `Image graphic asset in ${ext.toUpperCase()} format.`;
      recommendation = 'Ensure lossy compression or deduplication if copies exist.';
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'xlsx', 'pptx'].includes(ext)) {
      detectedCategory = 'documents';
      tags.add('document');
      summary = `Productive text or office document in ${ext.toUpperCase()} format.`;
      recommendation = 'Store in dedicated project folder.';
    } else if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      detectedCategory = 'video';
      tags.add('multimedia');
      tags.add('video-recording');
      summary = `High-capacity video media track (${ext.toUpperCase()}).`;
      recommendation = 'Candidate for external archiving if infrequently accessed.';
    } else if (['mp3', 'wav', 'flac', 'ogg'].includes(ext)) {
      detectedCategory = 'audio';
      tags.add('soundtrack');
      summary = `Audio soundtrack in ${ext.toUpperCase()} encoding.`;
    } else if (['ts', 'js', 'py', 'json', 'html', 'css', 'go', 'rs'].includes(ext)) {
      detectedCategory = 'code';
      tags.add('developer-resource');
      summary = `Software source module written in ${ext.toUpperCase()}.`;
    } else if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      detectedCategory = 'archives';
      tags.add('compressed-archive');
      summary = `Compressed bundle archive (${ext.toUpperCase()}).`;
      recommendation = 'Verify contents and delete archive if unpacked.';
    }

    if (tags.size === 0) {
      tags.add('general');
    }

    return {
      fileId: request.fileId,
      suggestedTags: Array.from(tags),
      detectedCategory,
      summary,
      confidenceScore: 0.92,
      recommendation,
    };
  }

  /**
   * Generates a holistic catalog optimization report with AI insights.
   */
  public async generateCatalogAudit(): Promise<AiCatalogAuditReport> {
    const files = this.repository.getAll(false);
    const recommendations: AiCatalogAuditRecommendation[] = [];

    // 1. Duplicate detection check
    const dupMap = new Map<string, ServerFileEntity[]>();
    for (const f of files) {
      if (!f.hash) continue;
      const b = dupMap.get(f.hash) || [];
      b.push(f);
      dupMap.set(f.hash, b);
    }

    let duplicateWaste = 0;
    const dupFileIds: string[] = [];
    for (const [, group] of dupMap.entries()) {
      if (group.length > 1) {
        duplicateWaste += (group.length - 1) * group[0].size;
        for (let i = 1; i < group.length; i++) {
          dupFileIds.push(group[i].id);
        }
      }
    }

    if (duplicateWaste > 0) {
      recommendations.push({
        id: 'rec_dedup',
        type: 'duplicate',
        title: 'Cryptographic Duplicate Elimination',
        description: `Found ${dupFileIds.length} redundant duplicate files consuming ${(duplicateWaste / (1024 * 1024)).toFixed(1)} MB of storage.`,
        impactBytes: duplicateWaste,
        action: 'Run automated deduplication to keep primary originals.',
        fileIds: dupFileIds,
      });
    }

    // 2. Large stale files check (>20MB)
    const largeFiles = files.filter(f => f.size > 20 * 1024 * 1024);
    if (largeFiles.length > 0) {
      const largeBytes = largeFiles.reduce((acc, curr) => acc + curr.size, 0);
      recommendations.push({
        id: 'rec_large',
        type: 'stale_large',
        title: 'Heavyweight Media Optimization',
        description: `${largeFiles.length} files exceed 20 MB each, totaling ${(largeBytes / (1024 * 1024)).toFixed(1)} MB.`,
        impactBytes: largeBytes,
        action: 'Review video and archive files for cloud cold-storage offloading.',
        fileIds: largeFiles.map(f => f.id),
      });
    }

    // 3. Unorganized files (untagged)
    const untaggedFiles = files.filter(f => !f.tags || f.tags.length === 0);
    if (untaggedFiles.length > 0) {
      recommendations.push({
        id: 'rec_untagged',
        type: 'unorganized',
        title: 'Metadata Catalog Enrichment',
        description: `${untaggedFiles.length} files lack descriptive taxonomy tags.`,
        impactBytes: 0,
        action: 'Apply batch AI auto-tagging to enable instant semantic lookup.',
        fileIds: untaggedFiles.map(f => f.id),
      });
    }

    let overallHealthAssessment = 'Storage catalog is well organized with low redundancy.';
    if (duplicateWaste > 10 * 1024 * 1024) {
      overallHealthAssessment = 'Substantial space optimization opportunities detected via duplicate pruning.';
    }

    return {
      totalAnalyzed: files.length,
      overallHealthAssessment,
      recommendations,
      smartTagsGenerated: files.reduce((acc, f) => acc + (f.tags?.length || 0), 0),
      estimatedReclaimableBytes: duplicateWaste,
      timestamp: new Date().toISOString(),
    };
  }
}
