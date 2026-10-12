#!/usr/bin/env node
/**
 * FileSense Command-Line Interface (CLI)
 * Standalone executable for directory scanning, SHA-256 duplicate detection,
 * storage analytics reporting, and AI file categorization.
 */
import fs from 'fs';
import path from 'path';
import { HashService } from '../server/services/HashService';
import { FileRecord } from '../server/models/FileRecord';
import { DuplicateEngineService } from '../server/services/DuplicateEngineService';
import { FileRepository } from '../server/repositories/FileRepository';
import { StorageAnalyticsService } from '../server/services/StorageAnalyticsService';
import { AiService } from '../server/services/AiService';

const args = process.argv.slice(2);
const command = args[0] || 'help';

function printHelp(): void {
  console.log(`
FileSense CLI - Privacy-First Local File Organizer & SHA-256 Duplicate Cleaner
Usage:
  filesense scan <directory>       Scan directory and compute SHA-256 checksums
  filesense duplicates             Analyze and display duplicate clusters
  filesense resolve <strategy>     Execute deduplication (keep-oldest|keep-newest|keep-largest-name)
  filesense stats                  Display current storage distribution and health metrics
  filesense audit                  Run AI catalog storage audit and optimization analysis
  filesense help                   Show this help message
`);
}

async function handleScan(targetDir: string): Promise<void> {
  if (!targetDir || !fs.existsSync(targetDir)) {
    console.error(`Error: Target directory does not exist: ${targetDir}`);
    process.exit(1);
  }

  console.log(`[FileSense CLI] Scanning directory: ${path.resolve(targetDir)}`);
  const repository = FileRepository.getInstance();
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });

  let indexedCount = 0;
  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(targetDir, entry.name);
      const stat = fs.statSync(fullPath);
      const hash = await HashService.hashFileStream(fullPath);

      const record = new FileRecord({
        name: entry.name,
        size: stat.size,
        hash,
        storagePath: fullPath,
        lastModified: stat.mtimeMs,
      });

      repository.save(record.toJSON());
      indexedCount++;
      console.log(`  Indexed: ${entry.name} (${(stat.size / 1024).toFixed(1)} KB) -> SHA256: ${hash.slice(0, 16)}...`);
    }
  }

  console.log(`[FileSense CLI] Completed scan: ${indexedCount} files cataloged.`);
}

function handleDuplicates(): void {
  const engine = new DuplicateEngineService();
  const result = engine.scanDuplicates();

  console.log(`\n================= Duplicate Scan Results =================`);
  console.log(`Files Scanned:        ${result.scannedCount}`);
  console.log(`Duplicate Groups:     ${result.duplicateGroupsFound}`);
  console.log(`Redundant Copies:     ${result.duplicateFilesCount}`);
  console.log(`Wasted Disk Space:    ${(result.wastedBytesTotal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`==========================================================\n`);

  for (const group of result.groups) {
    console.log(`Group [${group.id}] - SHA-256: ${group.hash}`);
    console.log(`  File Size: ${(group.size / 1024).toFixed(1)} KB | Copies: ${group.files.length} | Wasted: ${(group.wastedBytes / 1024).toFixed(1)} KB`);
    console.log(`  Original:  ${group.files[0].name} (Added: ${new Date(group.files[0].dateAdded).toISOString()})`);
    for (let i = 1; i < group.files.length; i++) {
      console.log(`  Copy ${i}:   ${group.files[i].name}`);
    }
    console.log('');
  }
}

function handleResolve(strategy: string): void {
  const validStrategies = ['keep-oldest', 'keep-newest', 'keep-largest-name'];
  if (!validStrategies.includes(strategy)) {
    console.error(`Invalid strategy. Choose one of: ${validStrategies.join(', ')}`);
    process.exit(1);
  }

  const engine = new DuplicateEngineService();
  const report = engine.resolveDuplicates({ strategy: strategy as any });

  console.log(`\n================ Deduplication Execution ================`);
  console.log(`Strategy:             ${report.strategy}`);
  console.log(`Groups Processed:     ${report.groupsProcessed}`);
  console.log(`Files Removed:        ${report.filesDeletedCount}`);
  console.log(`Storage Reclaimed:    ${(report.bytesReclaimed / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`==========================================================\n`);
}

function handleStats(): void {
  const analytics = new StorageAnalyticsService();
  const stats = analytics.getStorageStats();

  console.log(`\n================ Storage Analytics Overview ==============`);
  console.log(`Total Files:          ${stats.totalFiles}`);
  console.log(`Total Storage:        ${(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Health Score:         ${stats.storageHealthScore} / 100`);
  console.log(`Waste Percentage:     ${stats.wastePercentage}%`);
  console.log(`----------------------------------------------------------`);
  console.log(`Category Breakdown:`);
  for (const cat of stats.categoryBreakdown) {
    console.log(`  ${cat.label.padEnd(16)}: ${cat.count.toString().padStart(4)} files | ${(cat.bytes / (1024 * 1024)).toFixed(2).padStart(8)} MB (${cat.percentage}%)`);
  }
  console.log(`==========================================================\n`);
}

async function handleAudit(): Promise<void> {
  const ai = new AiService();
  console.log(`[FileSense CLI] Running intelligent catalog audit...`);
  const report = await ai.generateCatalogAudit();

  console.log(`\n================== AI Storage Audit Report ================`);
  console.log(`Total Files Analyzed: ${report.totalAnalyzed}`);
  console.log(`Assessment:           ${report.overallHealthAssessment}`);
  console.log(`Estimated Reclaim:    ${(report.estimatedReclaimableBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Recommendations:      ${report.recommendations.length}`);
  for (const rec of report.recommendations) {
    console.log(`  * [${rec.type.toUpperCase()}] ${rec.title}`);
    console.log(`    ${rec.description}`);
    console.log(`    Action: ${rec.action}`);
  }
  console.log(`==========================================================\n`);
}

async function main(): Promise<void> {
  switch (command) {
    case 'scan':
      await handleScan(args[1] || '.');
      break;
    case 'duplicates':
    case 'dups':
      handleDuplicates();
      break;
    case 'resolve':
      handleResolve(args[1] || 'keep-oldest');
      break;
    case 'stats':
      handleStats();
      break;
    case 'audit':
      await handleAudit();
      break;
    case 'help':
    default:
      printHelp();
      break;
  }
}

main().catch(err => {
  console.error('[FileSense CLI Error]:', err);
  process.exit(1);
});
