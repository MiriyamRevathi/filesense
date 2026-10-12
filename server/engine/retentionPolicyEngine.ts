/**
 * FileSense Retention Policy & Compliance Governance Engine
 * Implements automated retention evaluation, regulatory data aging rules,
 * and scheduled storage pruning policies.
 */

export interface RetentionRule {
  id: string;
  name: string;
  description: string;
  category?: string;
  fileExtensions?: string[];
  maxAgeDays: number;
  action: 'WARN' | 'ARCHIVE' | 'DELETE';
  complianceTag: 'GDPR' | 'HIPAA' | 'SOC2' | 'DEV_HYGIENE' | 'GENERAL';
  exemptTags?: string[];
}

export interface PolicyEvaluationResult {
  ruleId: string;
  ruleName: string;
  action: 'WARN' | 'ARCHIVE' | 'DELETE';
  matchedFilesCount: number;
  affectedBytes: number;
  fileIds: string[];
}

export class RetentionPolicyEngine {
  private rules: RetentionRule[] = [];

  constructor() {
    this.registerStandardPolicies();
  }

  private registerStandardPolicies(): void {
    this.rules = [
      {
        id: 'rule_dev_temp_logs',
        name: 'Developer Temporary Logs & Caches',
        description: 'Clean up log dumps and compiler caches older than 14 days.',
        fileExtensions: ['log', 'tmp', 'cache'],
        maxAgeDays: 14,
        action: 'DELETE',
        complianceTag: 'DEV_HYGIENE',
      },
      {
        id: 'rule_stale_downloads',
        name: 'Stale Installer & Disk Images',
        description: 'Flag disk images and installers over 60 days old.',
        fileExtensions: ['iso', 'dmg', 'exe', 'msi'],
        maxAgeDays: 60,
        action: 'WARN',
        complianceTag: 'GENERAL',
        exemptTags: ['keep', 'archive'],
      },
      {
        id: 'rule_gdpr_pii_exports',
        name: 'GDPR Export Retention Policy',
        description: 'Scrutinize export data and report snapshots exceeding 90 days of retention.',
        fileExtensions: ['csv', 'json', 'xlsx'],
        maxAgeDays: 90,
        action: 'ARCHIVE',
        complianceTag: 'GDPR',
        exemptTags: ['permanent', 'legal_hold'],
      },
      {
        id: 'rule_media_drafts',
        name: 'Unused Video and Render Drafts',
        description: 'Purge draft video renders older than 30 days consuming excessive local disk.',
        fileExtensions: ['mov', 'mp4', 'mkv', 'avi'],
        maxAgeDays: 30,
        action: 'WARN',
        complianceTag: 'DEV_HYGIENE',
      },
      {
        id: 'rule_archive_bundles',
        name: 'Unpacked ZIP & TAR Bundles',
        description: 'Review archive packages older than 180 days.',
        fileExtensions: ['zip', 'tar', 'gz', '7z'],
        maxAgeDays: 180,
        action: 'ARCHIVE',
        complianceTag: 'GENERAL',
      },
    ];
  }

  public getRules(): RetentionRule[] {
    return [...this.rules];
  }

  public addRule(rule: RetentionRule): void {
    this.rules.push(rule);
  }

  public evaluateFileAgainstPolicies(file: {
    id: string;
    name: string;
    size: number;
    extension: string;
    dateAdded: number;
    tags: string[];
  }): RetentionRule[] {
    const ageDays = (Date.now() - file.dateAdded) / (1000 * 60 * 60 * 24);
    const triggered: RetentionRule[] = [];

    for (const rule of this.rules) {
      if (rule.fileExtensions && !rule.fileExtensions.includes(file.extension.toLowerCase())) {
        continue;
      }

      if (rule.exemptTags && file.tags.some(t => rule.exemptTags!.includes(t))) {
        continue;
      }

      if (ageDays >= rule.maxAgeDays) {
        triggered.push(rule);
      }
    }

    return triggered;
  }

  public evaluateCatalog(files: Array<{
    id: string;
    name: string;
    size: number;
    extension: string;
    dateAdded: number;
    tags: string[];
  }>): PolicyEvaluationResult[] {
    const resultMap = new Map<string, { rule: RetentionRule; fileIds: string[]; bytes: number }>();

    for (const rule of this.rules) {
      resultMap.set(rule.id, { rule, fileIds: [], bytes: 0 });
    }

    for (const f of files) {
      const triggered = this.evaluateFileAgainstPolicies(f);
      for (const t of triggered) {
        const item = resultMap.get(t.id);
        if (item) {
          item.fileIds.push(f.id);
          item.bytes += f.size;
        }
      }
    }

    const results: PolicyEvaluationResult[] = [];
    for (const item of resultMap.values()) {
      if (item.fileIds.length > 0) {
        results.push({
          ruleId: item.rule.id,
          ruleName: item.rule.name,
          action: item.rule.action,
          matchedFilesCount: item.fileIds.length,
          affectedBytes: item.bytes,
          fileIds: item.fileIds,
        });
      }
    }

    return results;
  }
}
