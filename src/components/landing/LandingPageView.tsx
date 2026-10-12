import React, { useState } from 'react';
import {
  FolderSync,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  HardDrive,
  CopyCheck,
  PieChart,
  UploadCloud,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck2,
  X,
  Play,
  LogIn,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { formatBytes } from '../../utils/fileUtils';
import { LoginModal } from '../auth/LoginModal';

export const LandingPageView: React.FC = () => {
  const {
    loginUser,
    seedDemoData,
    stats,
    duplicateGroups,
    logoutNotice,
    setLogoutNotice,
  } = useFileContext();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLaunchWithDemo = async () => {
    await seedDemoData();
    setIsLoginModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F5FF] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Logout Notice Toast / Banner */}
      {logoutNotice && (
        <div className="w-full bg-[#EDE7FF] border-b border-[#D8D2EB] px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between text-xs font-semibold text-[#5B42C4] sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#8064E9] shrink-0" />
            <span>{logoutNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLogoutNotice(null)}
            className="text-[#6E6782] hover:text-[#29243B] p-1 rounded-md cursor-pointer"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Navigation Bar - Full Width with Zero Gap */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E6E2EF] px-4 sm:px-8 lg:px-12 py-4 transition-all w-full">
        <div className="flex items-center justify-between w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8064E9] to-[#A38DF5] flex items-center justify-center text-white shadow-sm shadow-[#8064E9]/30">
              <FolderSync size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#29243B] block leading-tight">
                File<span className="text-[#8064E9]">Sense</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#6E6782] tracking-wider block">
                Local Privacy Organizer
              </span>
            </div>
          </div>

          {/* Navigation Links and Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDE7FF] border border-[#D8D2EB] text-[#5B42C4] text-xs font-medium">
              <ShieldCheck size={14} className="text-[#8064E9]" />
              <span>100% Client-Side Private</span>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-[#D8D2EB] hover:border-[#8064E9] text-[#5B42C4] font-semibold text-xs sm:text-sm hover:bg-[#EDE7FF]/50 transition-colors cursor-pointer"
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Edge to Edge Full Width with Zero Gap */}
      <section className="w-full bg-gradient-to-b from-white via-[#F7F5FF] to-white border-b border-[#E6E2EF] px-4 sm:px-8 lg:px-16 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8064E9]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#5B42C4]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE7FF] text-[#5B42C4] text-xs font-bold border border-[#D8D2EB] shadow-2xs">
            <Sparkles size={14} className="text-[#8064E9]" />
            <span>Privacy-First Duplicate Cleaner &amp; Local File Manager</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#29243B] tracking-tight leading-tight sm:leading-tight">
            Smart File Organizer &amp;{' '}
            <span className="text-[#8064E9]">Duplicate Cleaner</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6E6782] max-w-2xl mx-auto leading-relaxed">
            Zero-cloud, high-performance browser organizer. Discover duplicate files, analyze
            storage distribution, and reclaim space with byte-for-byte SHA-256 accuracy.
          </p>

          {/* Primary Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-bold text-sm shadow-md shadow-[#8064E9]/25 transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={handleLaunchWithDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white border border-[#D8D2EB] hover:border-[#8064E9] text-[#5B42C4] font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Play size={15} className="text-[#8064E9]" />
              <span>Explore Demo Workspace</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-[#6E6782]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>100% In-Browser Privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-[#8064E9]" />
              <span>No Cloud Uploads</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive size={15} className="text-blue-600" />
              <span>Persistent IndexedDB</span>
            </div>
            <div className="flex items-center gap-2">
              <CopyCheck size={15} className="text-amber-600" />
              <span>SHA-256 Exact Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Workspace Status Callout (Full Width) */}
      {stats.totalFiles > 0 && (
        <section className="w-full bg-[#EDE7FF]/40 border-b border-[#E6E2EF] px-4 sm:px-8 lg:px-16 py-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#D8D2EB] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#EDE7FF] text-[#8064E9]">
                <HardDrive size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#29243B]">
                  Existing Local Library Active in Browser
                </h4>
                <p className="text-xs text-[#6E6782]">
                  {stats.totalFiles} files saved ({formatBytes(stats.totalBytes)}) •{' '}
                  {duplicateGroups.length} duplicate groups detected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <span>Resume in Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* Feature Pillars Section - Edge to Edge */}
      <section className="w-full px-4 sm:px-8 lg:px-16 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#29243B] tracking-tight">
              Engineered for Complete Control
            </h2>
            <p className="text-sm text-[#6E6782] mt-2 leading-relaxed">
              Every analysis, hash computation, and file operation happens locally on your computer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between hover:border-[#8064E9] transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F5FF] group-hover:bg-[#EDE7FF] text-[#8064E9] flex items-center justify-center mb-4 transition-colors">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-[#29243B]">Zero-Cloud Privacy</h3>
                <p className="text-xs text-[#6E6782] mt-2 leading-relaxed">
                  Files, names, metadata, and cryptographic hashes are stored 100% inside your browser's IndexedDB. No data leaves your machine.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between hover:border-[#8064E9] transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F5FF] group-hover:bg-[#EDE7FF] text-[#8064E9] flex items-center justify-center mb-4 transition-colors">
                  <CopyCheck size={24} />
                </div>
                <h3 className="text-base font-bold text-[#29243B]">SHA-256 Engine</h3>
                <p className="text-xs text-[#6E6782] mt-2 leading-relaxed">
                  Never confuses files with the same name. Uses Web Crypto API to ensure only true, identical byte-for-byte duplicates are grouped.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between hover:border-[#8064E9] transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F5FF] group-hover:bg-[#EDE7FF] text-[#8064E9] flex items-center justify-center mb-4 transition-colors">
                  <UploadCloud size={24} />
                </div>
                <h3 className="text-base font-bold text-[#29243B]">Drag &amp; Drop Moving</h3>
                <p className="text-xs text-[#6E6782] mt-2 leading-relaxed">
                  Drag files directly from your desktop to import, or drag them between category folders to reclassify your library in seconds.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E2EF] shadow-xs flex flex-col justify-between hover:border-[#8064E9] transition-all group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F5FF] group-hover:bg-[#EDE7FF] text-[#8064E9] flex items-center justify-center mb-4 transition-colors">
                  <PieChart size={24} />
                </div>
                <h3 className="text-base font-bold text-[#29243B]">Storage Insights</h3>
                <p className="text-xs text-[#6E6782] mt-2 leading-relaxed">
                  Real charts and breakdowns of disk space by category, size bracket distributions, and actionable cleanup recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Walkthrough */}
      <section className="w-full bg-white border-y border-[#E6E2EF] px-4 sm:px-8 lg:px-16 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#29243B] tracking-tight">
              How FileSense Works
            </h2>
            <p className="text-sm text-[#6E6782] mt-2 leading-relaxed">
              Three transparent steps to clean and organize files safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-[#F7F5FF] border border-[#E6E2EF] space-y-3">
              <span className="w-8 h-8 rounded-full bg-[#8064E9] text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-bold text-[#29243B]">Import or Drop Files</h4>
              <p className="text-xs text-[#6E6782] leading-relaxed">
                Add files from your desktop. They are saved directly into your browser's persistent IndexedDB storage.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F5FF] border border-[#E6E2EF] space-y-3">
              <span className="w-8 h-8 rounded-full bg-[#8064E9] text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-bold text-[#29243B]">Cryptographic Hash Scan</h4>
              <p className="text-xs text-[#6E6782] leading-relaxed">
                FileSense computes SHA-256 signatures client-side, grouping exact copies while safely ignoring false matches.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F5FF] border border-[#E6E2EF] space-y-3">
              <span className="w-8 h-8 rounded-full bg-[#8064E9] text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="text-sm font-bold text-[#29243B]">Review &amp; Reclaim</h4>
              <p className="text-xs text-[#6E6782] leading-relaxed">
                Select which duplicate to keep using smart presets (*Keep Oldest* or *Keep Newest*) and clean redundant copies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner - Edge to Edge */}
      <section className="w-full bg-gradient-to-r from-[#EDE7FF]/60 via-white to-[#EDE7FF]/60 px-4 sm:px-8 lg:px-16 py-16 sm:py-20 border-b border-[#E6E2EF]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#29243B] tracking-tight">
            Ready to Organize Your Local Files?
          </h2>
          <p className="text-sm text-[#6E6782] max-w-lg mx-auto">
            Open your dashboard now to inspect storage metrics, detect duplicates, and organize your folders.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Full Width */}
      <footer className="w-full bg-white px-4 sm:px-8 lg:px-12 py-6 text-center text-xs text-[#6E6782] border-t border-[#E6E2EF]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 font-medium text-[#29243B]">
            <FolderSync size={16} className="text-[#8064E9]" />
            <span>FileSense Local Organizer</span>
          </div>
          <div>
            100% Client-Side Private • IndexedDB &amp; Web Crypto API • Zero Cloud Tracking
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};
