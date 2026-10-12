import React, { useRef, useState } from 'react';
import {
  FolderArchive,
  HardDrive,
  CopyCheck,
  Sparkles,
  Upload,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Download,
  FolderOpen,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { formatBytes, formatDate, downloadFileBlob } from '../../utils/fileUtils';
import { StatsCard } from '../common/StatsCard';
import { FileIcon } from '../common/FileIcon';
import { CategoryBadge } from '../common/Badge';

export const DashboardView: React.FC = () => {
  const {
    files,
    stats,
    duplicateGroups,
    setActiveTab,
    setIsUploadModalOpen,
    seedDemoData,
    uploadFiles,
    scanDuplicates,
    isScanning,
    logoutNotice,
    setLogoutNotice,
  } = useFileContext();

  const [isDragging, setIsDragging] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const handleQuickDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleQuickInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(Array.from(e.target.files));
      if (quickInputRef.current) quickInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full pb-12">
      {/* Logout Feedback Banner */}
      {logoutNotice && (
        <div className="w-full bg-[#EDE7FF] border-b border-[#D8D2EB] px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between text-xs font-semibold text-[#5B42C4] animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#8064E9] shrink-0" />
            <span>{logoutNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLogoutNotice(null)}
            className="text-[#6E6782] hover:text-[#29243B] p-1 rounded-md cursor-pointer"
            title="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Full-Bleed Welcome & Action Landing Hero - Zero gap left to right */}
      <div className="w-full bg-gradient-to-r from-white via-[#F7F5FF] to-white border-b border-[#E6E2EF] px-4 sm:px-8 lg:px-12 py-8 sm:py-10 shadow-xs relative overflow-hidden">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE7FF] text-[#5B42C4] text-xs font-semibold mb-3 border border-[#D8D2EB]">
              <ShieldCheck size={14} className="text-[#8064E9]" />
              <span>Zero-Cloud Local Storage</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#29243B] tracking-tight">
              Smart File Organizer &amp; Duplicate Cleaner
            </h1>
            <p className="text-sm text-[#6E6782] mt-2 leading-relaxed">
              Analyze your local library, detect true identical duplicates via cryptographic
              SHA-256 signatures, and reclaim precious disk space.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-medium text-sm shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
            >
              <Upload size={17} />
              <span>Upload Files</span>
            </button>

            {files.length === 0 ? (
              <button
                type="button"
                onClick={() => seedDemoData()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D8D2EB] hover:border-[#8064E9] text-[#5B42C4] font-medium text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles size={16} className="text-[#8064E9]" />
                <span>Load Sample Files</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => scanDuplicates(true)}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D8D2EB] hover:border-[#8064E9] text-[#5B42C4] font-medium text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <CopyCheck size={16} className="text-[#8064E9]" />
                <span>{isScanning ? 'Scanning...' : 'Rescan Duplicates'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Content - Full Width Edge to Edge */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-6 space-y-6">
        {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Stored Files"
          value={stats.totalFiles}
          subtext="Indexed in local database"
          icon={<FolderArchive size={20} />}
          badge={{
            text: `${stats.categoryBreakdown.filter(c => c.count > 0).length} categories`,
            variant: 'purple',
          }}
          onClick={() => setActiveTab('files')}
        />

        <StatsCard
          title="Total Size"
          value={formatBytes(stats.totalBytes)}
          subtext="Occupied in browser storage"
          icon={<HardDrive size={20} />}
          onClick={() => setActiveTab('insights')}
        />

        <StatsCard
          title="Duplicate Groups"
          value={stats.duplicateGroupsCount}
          subtext={`${stats.duplicateFilesCount} files involved`}
          icon={<CopyCheck size={20} />}
          badge={
            stats.duplicateGroupsCount > 0
              ? { text: 'Duplicates Found', variant: 'warning' }
              : { text: 'Clean', variant: 'success' }
          }
          onClick={() => setActiveTab('duplicates')}
        />

        <StatsCard
          title="Reclaimable Space"
          value={formatBytes(stats.reclaimableBytes)}
          subtext="Potential immediate savings"
          icon={<TrendingDown size={20} />}
          badge={
            stats.reclaimableBytes > 0
              ? { text: 'Actionable', variant: 'purple' }
              : { text: '0 B wasted', variant: 'neutral' }
          }
          onClick={() => setActiveTab('duplicates')}
        />
      </div>

      {/* Duplicate Alert Banner if Duplicates Exist */}
      {duplicateGroups.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {duplicateGroups.length} exact duplicate {duplicateGroups.length === 1 ? 'group' : 'groups'} detected
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                You can safely reclaim up to <span className="font-semibold">{formatBytes(stats.reclaimableBytes)}</span> of browser storage by retaining single primary copies and cleaning redundant duplicates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('duplicates')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span>Resolve Duplicates</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Quick Drag & Drop Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleQuickDrop}
        onClick={() => quickInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-[#8064E9] bg-[#EDE7FF]/60 scale-[1.005]'
            : 'border-[#E6E2EF] bg-white hover:border-[#8064E9] hover:bg-[#F7F5FF]/50'
        }`}
      >
        <input
          ref={quickInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleQuickInput}
        />
        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EDE7FF] text-[#8064E9] flex items-center justify-center mb-3">
            <Upload size={22} />
          </div>
          <p className="text-sm font-semibold text-[#29243B]">
            Quick Dropzone: Drag files directly onto this card to add them
          </p>
          <p className="text-xs text-[#6E6782] mt-1">
            Files are immediately hashed and stored in your browser profile.
          </p>
        </div>
      </div>

      {/* Storage Breakdown by Category */}
      <div className="bg-white rounded-2xl p-6 border border-[#E6E2EF] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#29243B]">Storage Distribution by Category</h3>
            <p className="text-xs text-[#6E6782]">Calculated from actual file sizes in your library</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className="text-xs text-[#8064E9] hover:text-[#5B42C4] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Insights</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-[#F7F5FF] overflow-hidden flex mb-4 border border-[#E6E2EF]">
          {stats.totalBytes === 0 ? (
            <div className="w-full bg-[#E6E2EF]" />
          ) : (
            stats.categoryBreakdown
              .filter(c => c.bytes > 0)
              .map(cat => (
                <div
                  key={cat.category}
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.label}: ${formatBytes(cat.bytes)} (${cat.percentage}%)`}
                />
              ))
          )}
        </div>

        {/* Categories Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.categoryBreakdown.map(cat => (
            <div
              key={cat.category}
              className="p-2.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-semibold text-[#29243B] truncate">{cat.label}</span>
              </div>
              <div className="text-[11px] text-[#6E6782]">{formatBytes(cat.bytes)}</div>
              <div className="text-[10px] text-[#6E6782] mt-0.5">
                {cat.count} {cat.count === 1 ? 'file' : 'files'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Largest Files & Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Largest Files */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-[#8064E9]" />
                <h3 className="text-sm font-bold text-[#29243B]">Largest Stored Files</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className="text-xs text-[#8064E9] hover:text-[#5B42C4] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {stats.largestFiles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6E6782]">
                No files uploaded yet. Add files to see size rankings.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.largestFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] hover:border-[#D8D2EB] transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate pr-3">
                      <span className="text-xs font-bold text-[#6E6782] w-4 text-center">
                        #{idx + 1}
                      </span>
                      <FileIcon category={file.category} size={18} />
                      <div className="truncate">
                        <span className="text-xs font-medium text-[#29243B] truncate block">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#6E6782]">
                          <span>{formatDate(file.dateAdded)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-[#29243B]">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadFileBlob(file.blob, file.name)}
                        className="p-1 rounded-md text-[#6E6782] hover:text-[#8064E9] hover:bg-white transition-colors"
                        title="Download file"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white rounded-2xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#8064E9]" />
                <h3 className="text-sm font-bold text-[#29243B]">Recent Uploads</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('files')}
                className="text-xs text-[#8064E9] hover:text-[#5B42C4] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Browse Files</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {stats.recentFiles.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6E6782]">
                No recent files found. Upload files or load demo files to begin.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] hover:border-[#D8D2EB] transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate pr-3">
                      <FileIcon category={file.category} size={18} />
                      <div className="truncate">
                        <span className="text-xs font-medium text-[#29243B] truncate block">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#6E6782]">
                          <span>{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.dateAdded)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <CategoryBadge category={file.category} />
                      <button
                        type="button"
                        onClick={() => downloadFileBlob(file.blob, file.name)}
                        className="p-1 rounded-md text-[#6E6782] hover:text-[#8064E9] hover:bg-white transition-colors"
                        title="Download file"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
