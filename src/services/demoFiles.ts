import { StoredFileRecord } from '../types';
import { generateId, getFileCategory } from '../utils/fileUtils';

export function createDemoFiles(): StoredFileRecord[] {
  const now = Date.now();

  // Distinct content blobs
  const financialReportContent = 'Quarterly Financial Review 2026\nRevenue: $1,420,000\nExpenses: $890,000\nNet Profit: $530,000\nStatus: Approved by Board';
  const logoSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#8064E9"/><polygon points="35,30 75,50 35,70" fill="#FFFFFF"/></svg>`;
  const configJsonContent = JSON.stringify({ app: 'FileSense', version: '1.2.0', environment: 'production', telemetry: false }, null, 2);
  const employeeHandbookContent = '# Employee Handbook 2026\n\nWelcome to our organization. Please read all guidelines regarding local data privacy, security, and workspaces.\n\nSection 1: Data Integrity\nSection 2: Security Best Practices';
  const differentFinancialContent = 'Quarterly Financial Review 2025\nDifferent content for same-name test\nRevenue: $920,000';
  const audioSampleContent = 'RIFF....WAVEfmt ....data' + '0'.repeat(12000); // simulated audio chunk
  const archiveSampleContent = 'PK\x03\x04' + 'Z'.repeat(45000); // simulated zip archive chunk
  const emptyContent = '';

  const demoItems: Array<{
    name: string;
    type: string;
    content: string;
    dateOffset: number;
  }> = [
    // Duplicate Group 1: 3 identical financial reports with different names
    {
      name: 'Q3_Financial_Report_Final.pdf',
      type: 'application/pdf',
      content: financialReportContent,
      dateOffset: 1000 * 60 * 60 * 24 * 5, // 5 days ago
    },
    {
      name: 'Q3_Financial_Report_Final (Copy 1).pdf',
      type: 'application/pdf',
      content: financialReportContent,
      dateOffset: 1000 * 60 * 60 * 24 * 3, // 3 days ago
    },
    {
      name: 'Backup_Q3_Financial_2026.pdf',
      type: 'application/pdf',
      content: financialReportContent,
      dateOffset: 1000 * 60 * 60 * 12, // 12 hours ago
    },

    // Duplicate Group 2: 2 identical logo SVGs
    {
      name: 'brand_logo_purple.svg',
      type: 'image/svg+xml',
      content: logoSvgContent,
      dateOffset: 1000 * 60 * 60 * 24 * 10,
    },
    {
      name: 'brand_logo_master_vector.svg',
      type: 'image/svg+xml',
      content: logoSvgContent,
      dateOffset: 1000 * 60 * 60 * 24 * 2,
    },

    // Duplicate Group 3: 2 identical employee handbooks
    {
      name: 'Employee_Handbook_2026.md',
      type: 'text/markdown',
      content: employeeHandbookContent,
      dateOffset: 1000 * 60 * 60 * 24 * 8,
    },
    {
      name: 'Handbook_v2_draft.md',
      type: 'text/markdown',
      content: employeeHandbookContent,
      dateOffset: 1000 * 60 * 60 * 24 * 1,
    },

    // Non-duplicate with identical name to test: SAME NAME BUT DIFFERENT CONTENT!
    {
      name: 'Q3_Financial_Report_Final.pdf',
      type: 'application/pdf',
      content: differentFinancialContent,
      dateOffset: 1000 * 60 * 60 * 24 * 15,
    },

    // Unique files
    {
      name: 'production_config.json',
      type: 'application/json',
      content: configJsonContent,
      dateOffset: 1000 * 60 * 60 * 24 * 4,
    },
    {
      name: 'welcome_bell.wav',
      type: 'audio/wav',
      content: audioSampleContent,
      dateOffset: 1000 * 60 * 60 * 24 * 6,
    },
    {
      name: 'project_assets.zip',
      type: 'application/zip',
      content: archiveSampleContent,
      dateOffset: 1000 * 60 * 60 * 24 * 7,
    },
    {
      name: 'placeholder_empty.txt',
      type: 'text/plain',
      content: emptyContent,
      dateOffset: 1000 * 60 * 60 * 24 * 9,
    },
  ];

  return demoItems.map((item, index) => {
    const blob = new Blob([item.content], { type: item.type });
    const category = getFileCategory(item.type, item.name);
    return {
      id: `demo_${index + 1}_${generateId()}`,
      name: item.name,
      size: blob.size,
      type: item.type,
      lastModified: now - item.dateOffset,
      dateAdded: now - item.dateOffset,
      blob,
      hashStatus: 'unhashed',
      category,
    };
  });
}
