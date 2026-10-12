import React from 'react';
import {
  PieChart as PieChartIcon,
  BarChart3,
  HardDrive,
  TrendingDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useFileContext } from '../../context/FileContext';
import { formatBytes } from '../../utils/fileUtils';
import { FileIcon } from '../common/FileIcon';
import { CategoryBadge } from '../common/Badge';

export const StorageInsightsView: React.FC = () => {
  const { stats, files, duplicateGroups, setActiveTab } = useFileContext();

  // Pie chart data for categories
  const categoryData = stats.categoryBreakdown
    .filter(c => c.bytes > 0)
    .map(c => ({
      name: c.label,
      value: c.bytes,
      formatted: formatBytes(c.bytes),
      count: c.count,
      color: c.color,
    }));

  // Bar chart data for size distribution
  const sizeBarData = stats.sizeDistribution.map(b => ({
    name: b.range,
    filesCount: b.count,
    bytes: b.bytes,
    formattedBytes: formatBytes(b.bytes),
  }));

  // Duplicate vs Unique storage ratio
  const duplicateBytes = stats.reclaimableBytes;
  const uniqueBytes = Math.max(0, stats.totalBytes - duplicateBytes);
  const ratioData = [
    { name: 'Unique Data', value: uniqueBytes, color: '#8064E9' },
    { name: 'Reclaimable Duplicates', value: duplicateBytes, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  // Dynamic Cleanup Recommendations derived from real stored file metrics
  const recommendations: Array<{
    id: string;
    type: 'duplicate' | 'large' | 'empty' | 'good';
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  }> = [];

  if (duplicateGroups.length > 0 && stats.reclaimableBytes > 0) {
    recommendations.push({
      id: 'dups',
      type: 'duplicate',
      title: `Eliminate ${duplicateGroups.length} Duplicate Groups`,
      description: `You have ${stats.duplicateFilesCount} duplicate files wasting ${formatBytes(
        stats.reclaimableBytes
      )}. Cleaning redundant copies is the quickest way to free local storage.`,
      actionLabel: 'Go to Duplicate Lab',
      onAction: () => setActiveTab('duplicates'),
    });
  }

  const emptyFiles = files.filter(f => f.size === 0);
  if (emptyFiles.length > 0) {
    recommendations.push({
      id: 'empty',
      type: 'empty',
      title: `Clean ${emptyFiles.length} Zero-Byte File${emptyFiles.length === 1 ? '' : 's'}`,
      description: `Empty files take up index records without holding actual content.`,
      actionLabel: 'Inspect Files',
      onAction: () => setActiveTab('files'),
    });
  }

  const largeFiles = files.filter(f => f.size > 5 * 1024 * 1024);
  if (largeFiles.length > 0) {
    recommendations.push({
      id: 'large',
      type: 'large',
      title: `Review ${largeFiles.length} Large File${largeFiles.length === 1 ? '' : 's'} (>5 MB)`,
      description: `Large files account for a substantial portion of browser storage. Ensure they are still needed locally.`,
      actionLabel: 'View Largest',
      onAction: () => setActiveTab('files'),
    });
  }

  if (recommendations.length === 0 && files.length > 0) {
    recommendations.push({
      id: 'optimized',
      type: 'good',
      title: 'Library is Highly Optimized',
      description: 'No redundant duplicates, zero-byte artifacts, or bloated storage detected. Your library is tidy!',
    });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2EF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE7FF] text-[#5B42C4] text-xs font-semibold mb-2.5 border border-[#D8D2EB]">
            <PieChartIcon size={14} className="text-[#8064E9]" />
            <span>Local Storage Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29243B] tracking-tight">
            Storage Insights
          </h1>
          <p className="text-sm text-[#6E6782] mt-1 max-w-xl">
            Real storage metrics calculated directly from files stored in your browser's IndexedDB database.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs">
          <HardDrive size={18} className="text-[#8064E9]" />
          <div>
            <div className="font-bold text-[#29243B]">{formatBytes(stats.totalBytes)}</div>
            <div className="text-[10px] text-[#6E6782]">{stats.totalFiles} files indexed</div>
          </div>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6E2EF] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F7F5FF] text-[#8064E9] flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-base font-bold text-[#29243B]">No Storage Data Available</h3>
          <p className="text-xs text-[#6E6782] max-w-md mx-auto mt-1 mb-5">
            Add files to FileSense to generate real category breakdowns, size distributions, and duplicate savings analysis.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-[#8064E9] text-white text-xs font-semibold shadow-xs hover:bg-[#5B42C4] cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Pie Chart */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#29243B]">Storage by Category</h3>
                <p className="text-xs text-[#6E6782] mb-4">
                  Byte distribution across file categories
                </p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryData.map(entry => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [formatBytes(Number(value)), 'Storage']}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E6E2EF',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F7F5FF]">
                {categoryData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-[#29243B] truncate">{item.name}</span>
                    <span className="text-[#6E6782] text-[11px] ml-auto">{item.formatted}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Size Distribution Bar Chart */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#29243B]">File Size Distribution</h3>
                <p className="text-xs text-[#6E6782] mb-4">
                  Count of files grouped by size brackets
                </p>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sizeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDF8" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#6E6782' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6E6782' }} />
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} files (${item.payload.formattedBytes})`,
                          'Volume',
                        ]}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          border: '1px solid #E6E2EF',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="filesCount" fill="#8064E9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs text-[#6E6782]">
                Tip: Files over 10 MB have the biggest impact on your browser's quota.
              </div>
            </div>
          </div>

          {/* Cleanup Recommendations */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#8064E9]" />
              <h3 className="text-sm font-bold text-[#29243B]">Cleanup Recommendations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rec.type === 'duplicate'
                      ? 'bg-amber-50/60 border-amber-200'
                      : rec.type === 'good'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-[#F7F5FF] border-[#E6E2EF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {rec.type === 'duplicate' && (
                        <AlertCircle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                      )}
                      {rec.type === 'good' && (
                        <CheckCircle size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                      )}
                      {rec.type !== 'duplicate' && rec.type !== 'good' && (
                        <Sparkles size={18} className="text-[#8064E9] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-[#29243B]">{rec.title}</h4>
                        <p className="text-xs text-[#6E6782] mt-1 leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    </div>

                    {rec.onAction && rec.actionLabel && (
                      <button
                        type="button"
                        onClick={rec.onAction}
                        className="flex items-center gap-1 text-xs font-semibold text-[#8064E9] hover:text-[#5B42C4] shrink-0 cursor-pointer"
                      >
                        <span>{rec.actionLabel}</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
