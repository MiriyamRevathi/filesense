import React, { useState } from 'react';
import {
  CopyCheck,
  Sparkles,
  Trash2,
  Download,
  CheckCircle2,
  RefreshCw,
  Eye,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  FolderOpen,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { StoredFileRecord, DuplicateGroup } from '../../types';
import {
  formatBytes,
  formatDate,
  downloadFileBlob,
} from '../../utils/fileUtils';
import { FileIcon } from '../common/FileIcon';
import { CategoryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const DuplicateLabView: React.FC = () => {
  const {
    files,
    duplicateGroups,
    isScanning,
    scanProgress,
    scanDuplicates,
    deleteDuplicatesInGroup,
    setIsUploadModalOpen,
    setActiveTab,
  } = useFileContext();

  // Selection mapping per group: groupId -> Set of file IDs to delete
  const [groupSelections, setGroupSelections] = useState<Record<string, Set<string>>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Group cleanup confirmation modal
  const [activeGroupToClean, setActiveGroupToClean] = useState<{
    group: DuplicateGroup;
    fileIds: string[];
  } | null>(null);

  // Quick select helper: select all but oldest (keep original)
  const handleSelectKeepOldest = (group: DuplicateGroup) => {
    // files are already sorted by dateAdded ascending
    const toDelete = group.files.slice(1).map(f => f.id);
    setGroupSelections(prev => ({
      ...prev,
      [group.id]: new Set(toDelete),
    }));
  };

  // Quick select helper: select all but newest (keep latest)
  const handleSelectKeepNewest = (group: DuplicateGroup) => {
    const toDelete = group.files.slice(0, -1).map(f => f.id);
    setGroupSelections(prev => ({
      ...prev,
      [group.id]: new Set(toDelete),
    }));
  };

  // Toggle single file selection in a group
  const handleToggleFileInGroup = (groupId: string, fileId: string) => {
    setGroupSelections(prev => {
      const currentSet = new Set(prev[groupId] || []);
      if (currentSet.has(fileId)) {
        currentSet.delete(fileId);
      } else {
        currentSet.add(fileId);
      }
      return {
        ...prev,
        [groupId]: currentSet,
      };
    });
  };

  // Copy hash to clipboard
  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Calculate current planned savings from user's manual selections
  const totalUserSelectedSavings = duplicateGroups.reduce((acc, group) => {
    const selectedCount = (groupSelections[group.id] || new Set()).size;
    return acc + selectedCount * group.size;
  }, 0);

  // Confirm and execute removal
  const handleConfirmClean = async () => {
    if (!activeGroupToClean) return;
    const { group, fileIds } = activeGroupToClean;
    await deleteDuplicatesInGroup(group.id, fileIds);

    // Clean up local selection state for that group
    setGroupSelections(prev => {
      const next = { ...prev };
      delete next[group.id];
      return next;
    });
    setActiveGroupToClean(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Rescan Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2EF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE7FF] text-[#5B42C4] text-xs font-semibold mb-2.5 border border-[#D8D2EB]">
            <CopyCheck size={14} className="text-[#8064E9]" />
            <span>Cryptographic SHA-256 Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29243B] tracking-tight">
            Duplicate Lab
          </h1>
          <p className="text-sm text-[#6E6782] mt-1 max-w-xl">
            Detects exact byte-for-byte duplicates using real Web Crypto digests. Files with different names but identical contents are grouped together.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => scanDuplicates(true)}
            disabled={isScanning || files.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-medium text-sm shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Analyzing Files...' : 'Run Full SHA-256 Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scanning Progress Bar */}
      {isScanning && scanProgress && (
        <div className="bg-[#EDE7FF] border border-[#D8D2EB] rounded-2xl p-4 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5B42C4] mb-2">
            <span className="flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-[#8064E9]" />
              {scanProgress.stage === 'analyzing_sizes' && 'Comparing file byte sizes...'}
              {scanProgress.stage === 'hashing' &&
                `Computing SHA-256 hashes (${scanProgress.processed} / ${scanProgress.total})...`}
              {scanProgress.stage === 'grouping' && 'Grouping duplicate signatures...'}
              {scanProgress.stage === 'complete' && 'Analysis complete.'}
            </span>
            <span>
              {scanProgress.total > 0
                ? Math.round((scanProgress.processed / scanProgress.total) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white overflow-hidden">
            <div
              className="h-full bg-[#8064E9] transition-all duration-200"
              style={{
                width: `${
                  scanProgress.total > 0
                    ? (scanProgress.processed / scanProgress.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          {scanProgress.currentFileName && (
            <p className="text-[11px] text-[#6E6782] mt-1.5 truncate">
              Current file: <span className="font-mono text-[#29243B]">{scanProgress.currentFileName}</span>
            </p>
          )}
        </div>
      )}

      {/* Summary KPI Cards if duplicates exist */}
      {duplicateGroups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#E6E2EF] shadow-xs">
            <span className="text-xs font-semibold text-[#6E6782] uppercase tracking-wider block mb-1">
              Duplicate Groups
            </span>
            <div className="text-2xl font-bold text-amber-700">
              {duplicateGroups.length}
            </div>
            <p className="text-xs text-[#6E6782] mt-0.5">
              Unique file signatures with duplicates
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E6E2EF] shadow-xs">
            <span className="text-xs font-semibold text-[#6E6782] uppercase tracking-wider block mb-1">
              Redundant Copies
            </span>
            <div className="text-2xl font-bold text-[#29243B]">
              {duplicateGroups.reduce((acc, g) => acc + g.files.length, 0)} files
            </div>
            <p className="text-xs text-[#6E6782] mt-0.5">
              Across all duplicate groups
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#E6E2EF] shadow-xs">
            <span className="text-xs font-semibold text-[#6E6782] uppercase tracking-wider block mb-1">
              Reclaimable Storage
            </span>
            <div className="text-2xl font-bold text-[#8064E9]">
              {formatBytes(duplicateGroups.reduce((acc, g) => acc + g.wastedBytes, 0))}
            </div>
            <p className="text-xs text-[#6E6782] mt-0.5">
              Calculated strictly as (n - 1) × size
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Groups List or Zero Duplicates State */}
      {duplicateGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E6E2EF] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#29243B]">
            No Duplicate Files Found
          </h3>
          <p className="text-xs text-[#6E6782] max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            Every stored file has a distinct byte size or verified unique SHA-256 cryptographic signature. Your local library is completely deduplicated.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Upload More Files
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className="px-4 py-2.5 rounded-xl bg-[#F7F5FF] hover:bg-[#EDE7FF] text-[#5B42C4] text-xs font-semibold border border-[#D8D2EB] transition-colors cursor-pointer"
            >
              Browse Library
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {duplicateGroups.map((group, groupIndex) => {
            const selectedSet = groupSelections[group.id] || new Set();
            const groupWasted = group.wastedBytes;
            const primaryCopy = group.files[0];

            return (
              <div
                key={group.id}
                className="bg-white rounded-3xl border border-[#E6E2EF] shadow-xs overflow-hidden transition-all"
              >
                {/* Group Header Card */}
                <div className="p-5 sm:p-6 bg-[#F7F5FF] border-b border-[#E6E2EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#EDE7FF] text-[#5B42C4] border border-[#D8D2EB]">
                        Group #{groupIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200">
                        {group.files.length} Identical Copies
                      </span>
                      <span className="text-xs font-semibold text-[#6E6782]">
                        {formatBytes(group.size)} each
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#6E6782]">
                      <span>Reclaimable:</span>
                      <span className="font-bold text-[#8064E9]">
                        {formatBytes(groupWasted)}
                      </span>
                    </div>

                    {/* SHA-256 Hash Display with Copy Button */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-[#6E6782]">SHA-256:</span>
                      <code className="text-[11px] font-mono text-[#29243B] bg-white px-2 py-0.5 rounded border border-[#E6E2EF] truncate max-w-xs sm:max-w-md">
                        {group.hash}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(group.hash)}
                        className="p-1 text-[#6E6782] hover:text-[#8064E9] cursor-pointer"
                        title="Copy hash"
                      >
                        {copiedHash === group.hash ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Smart Selection Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectKeepOldest(group)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDE7FF]/50 border border-[#D8D2EB] text-xs font-medium text-[#5B42C4] transition-colors cursor-pointer"
                    >
                      Keep Oldest
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectKeepNewest(group)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#EDE7FF]/50 border border-[#D8D2EB] text-xs font-medium text-[#5B42C4] transition-colors cursor-pointer"
                    >
                      Keep Newest
                    </button>

                    {selectedSet.size > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveGroupToClean({
                            group,
                            fileIds: Array.from(selectedSet),
                          })
                        }
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete {selectedSet.size} Selected</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Group Files List */}
                <div className="divide-y divide-[#E6E2EF]">
                  {group.files.map((file, fileIdx) => {
                    const isMarkedForDeletion = selectedSet.has(file.id);
                    const isOldestOriginal = fileIdx === 0;

                    return (
                      <div
                        key={file.id}
                        className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                          isMarkedForDeletion
                            ? 'bg-rose-50/40'
                            : fileIdx === 0
                            ? 'bg-emerald-50/20'
                            : 'hover:bg-[#F7F5FF]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 truncate pr-2">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={isMarkedForDeletion}
                            onChange={() => handleToggleFileInGroup(group.id, file.id)}
                            className="w-4 h-4 rounded text-[#8064E9] focus:ring-[#8064E9] border-[#D8D2EB] cursor-pointer"
                            title="Mark for deletion"
                          />

                          <FileIcon category={file.category} size={20} />

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  isMarkedForDeletion
                                    ? 'line-through text-rose-800'
                                    : 'text-[#29243B]'
                                }`}
                                title={file.name}
                              >
                                {file.name}
                              </span>

                              {isOldestOriginal && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Earliest Added
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#6E6782] mt-0.5">
                              <span>Added {formatDate(file.dateAdded)}</span>
                              <span>•</span>
                              <span>Modified {formatDate(file.lastModified)}</span>
                            </div>
                          </div>
                        </div>

                        {/* File Action Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => downloadFileBlob(file.blob, file.name)}
                            className="p-1.5 rounded-lg text-[#6E6782] hover:text-[#8064E9] hover:bg-white border border-transparent hover:border-[#E6E2EF] transition-colors cursor-pointer"
                            title="Download to verify content"
                          >
                            <Download size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setActiveGroupToClean({
                                group,
                                fileIds: [file.id],
                              })
                            }
                            className="p-1.5 rounded-lg text-[#6E6782] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Delete this copy"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      <Modal
        isOpen={!!activeGroupToClean}
        onClose={() => setActiveGroupToClean(null)}
        title="Confirm Duplicate Deletion"
        description="Verify the specific file copies you are about to remove."
        maxWidth="md"
      >
        {activeGroupToClean && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Cleaning {activeGroupToClean.fileIds.length}{' '}
                    {activeGroupToClean.fileIds.length === 1 ? 'copy' : 'copies'}
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    Remaining in group:{' '}
                    {activeGroupToClean.group.files.length - activeGroupToClean.fileIds.length}{' '}
                    copy will remain safe in your library.
                  </p>
                  <p className="mt-1 font-semibold text-[#8064E9]">
                    Immediate reclaimed space:{' '}
                    {formatBytes(
                      activeGroupToClean.fileIds.length * activeGroupToClean.group.size
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-[#E6E2EF] rounded-xl p-2 bg-[#F7F5FF]">
              {activeGroupToClean.fileIds.map(id => {
                const f = activeGroupToClean.group.files.find(item => item.id === id);
                if (!f) return null;
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-1.5 rounded bg-white border border-[#E6E2EF] text-xs"
                  >
                    <span className="truncate pr-2 font-medium">{f.name}</span>
                    <span className="text-[#6E6782] shrink-0">{formatBytes(f.size)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveGroupToClean(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E2EF] text-xs font-semibold text-[#29243B] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClean}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Delete Selected Copies
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
