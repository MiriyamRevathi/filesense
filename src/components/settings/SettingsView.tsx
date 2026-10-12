import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Download,
  Trash2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { formatBytes, exportMetadataAsJson } from '../../utils/fileUtils';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const {
    files,
    stats,
    seedDemoData,
    clearAllData,
    viewMode,
    setViewMode,
  } = useFileContext();

  const [quotaEstimate, setQuotaEstimate] = useState<{
    quota: number;
    usage: number;
  } | null>(null);

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Read actual browser quota using Storage API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setQuotaEstimate({
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        });
      }).catch(err => {
        console.warn('Storage estimate failed:', err);
      });
    }
  }, [files]);

  const handleExportMetadata = () => {
    exportMetadataAsJson(files);
    setFeedbackMessage('Metadata exported successfully as JSON.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleConfirmClear = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return;
    await clearAllData();
    setIsClearModalOpen(false);
    setConfirmInput('');
    setFeedbackMessage('All local files and database records cleared.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSeedDemo = async () => {
    await seedDemoData();
    setFeedbackMessage('Curated demo files loaded and duplicate scan completed.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const usagePercent =
    quotaEstimate && quotaEstimate.quota > 0
      ? ((quotaEstimate.usage / quotaEstimate.quota) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E2EF] shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29243B] tracking-tight">
          Settings &amp; Storage Preferences
        </h1>
        <p className="text-sm text-[#6E6782] mt-1 max-w-xl">
          Manage your persistent IndexedDB library, monitor browser quota, and configure local preferences.
        </p>

        {feedbackMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}
      </div>

      {/* Browser Storage Quota Status */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#EDE7FF] text-[#8064E9]">
            <HardDrive size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#29243B]">Browser Storage Quota</h3>
            <p className="text-xs text-[#6E6782]">
              Reported by the browser's Storage Manager API (navigator.storage)
            </p>
          </div>
        </div>

        {quotaEstimate ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6E6782]">
                Total Browser Storage Used: <strong className="text-[#29243B]">{formatBytes(quotaEstimate.usage)}</strong>
              </span>
              <span className="text-[#6E6782]">
                Quota Limit: <strong className="text-[#29243B]">{formatBytes(quotaEstimate.quota)}</strong> ({usagePercent}%)
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#F7F5FF] overflow-hidden border border-[#E6E2EF]">
              <div
                className="h-full bg-[#8064E9] rounded-full"
                style={{ width: `${Math.min(100, Math.max(1, Number(usagePercent)))}%` }}
              />
            </div>

            <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] flex items-center justify-between text-xs">
              <span className="text-[#6E6782]">FileSense Stored Files Volume:</span>
              <span className="font-bold text-[#8064E9]">{formatBytes(stats.totalBytes)}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#F7F5FF] text-xs text-[#6E6782]">
            Detailed quota metrics are not supported in this browser environment. IndexedDB is active and storing files locally.
          </div>
        )}
      </div>

      {/* Export & Data Management */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#EDE7FF] text-[#8064E9]">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#29243B]">Data Export &amp; Sample Data</h3>
            <p className="text-xs text-[#6E6782]">
              Backup metadata or populate realistic test files
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export JSON */}
          <div className="p-4 rounded-2xl bg-[#F7F5FF] border border-[#E6E2EF] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#29243B]">Export File Metadata (JSON)</h4>
              <p className="text-xs text-[#6E6782] mt-1 leading-relaxed">
                Download a structured JSON file containing all stored file names, sizes, categories, timestamps, and SHA-256 hashes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportMetadata}
              disabled={files.length === 0}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D8D2EB] hover:border-[#8064E9] text-[#5B42C4] text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>Export Metadata</span>
            </button>
          </div>

          {/* Seed Demo Data */}
          <div className="p-4 rounded-2xl bg-[#F7F5FF] border border-[#E6E2EF] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#29243B]">Load Curated Demo Files</h4>
              <p className="text-xs text-[#6E6782] mt-1 leading-relaxed">
                Inject realistic files including exact duplicates, varying formats (PDF, Markdown, SVG, Audio), and same-name content variants to explore.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeedDemo}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Load Sample Files</span>
            </button>
          </div>
        </div>
      </div>

      {/* Local Preferences */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#29243B]">Local Preferences</h3>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs">
          <div>
            <span className="font-semibold text-[#29243B] block">Default Explorer View</span>
            <span className="text-[#6E6782]">Choose how files are shown when browsing</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#8064E9] text-white'
                  : 'bg-white text-[#6E6782] border border-[#E6E2EF]'
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#8064E9] text-white'
                  : 'bg-white text-[#6E6782] border border-[#E6E2EF]'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Explanation & Storage Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#5B42C4]">
            <ShieldCheck size={16} className="text-[#8064E9]" />
            <span>Zero-Knowledge Privacy Architecture</span>
          </div>
          <p className="text-xs text-[#6E6782] leading-relaxed">
            FileSense executes 100% inside your web browser. No files, metadata, cryptographic hashes, or search queries ever leave your device. There is no remote database server, cloud storage bucket, or tracking telemetry.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
            <Info size={16} className="text-amber-600" />
            <span>Browser Storage Limitations</span>
          </div>
          <p className="text-xs text-[#6E6782] leading-relaxed">
            Data is persisted inside IndexedDB for this browser profile. If you manually clear site cookies and browsing data, or run inside private/incognito mode, stored files may be removed by the browser engine upon session end.
          </p>
        </div>
      </div>

      {/* Danger Zone: Clear Local Database */}
      <div className="bg-rose-50/50 rounded-3xl p-6 border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle size={18} />
          <h3 className="text-sm font-bold">Clear All Local Data</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed max-w-xl">
          Permanently delete all stored file records and blobs from IndexedDB. This action cannot be reversed.
        </p>
        <div>
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Reset and Clear Database</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Confirm Complete Database Wipe"
        description="Type DELETE to permanently erase all files from IndexedDB."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-rose-700">
            This will remove all {files.length} stored files ({formatBytes(stats.totalBytes)}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#29243B] mb-1">
              Type <strong className="text-rose-600">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 rounded-xl border border-[#E6E2EF] text-sm focus:outline-hidden focus:border-rose-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsClearModalOpen(false);
                setConfirmInput('');
              }}
              className="px-4 py-2 rounded-xl border border-[#E6E2EF] text-xs font-semibold text-[#29243B] hover:bg-[#F7F5FF] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmClear}
              disabled={confirmInput.trim().toUpperCase() !== 'DELETE'}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-40"
            >
              Permanently Wipe
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
