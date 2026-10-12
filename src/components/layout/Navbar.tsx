import React from 'react';
import { Upload, FolderSync, ShieldCheck, Menu, X, LogOut } from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { formatBytes } from '../../utils/fileUtils';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { stats, setIsUploadModalOpen, duplicateGroups, logoutUser, currentUser } = useFileContext();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E6E2EF] px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between w-full">
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#6E6782] hover:text-[#29243B] hover:bg-[#F7F5FF] transition-colors"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

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
        </div>

        {/* Right side controls & stats */}
        <div className="flex items-center gap-3">
          {/* Privacy badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDE7FF] border border-[#D8D2EB] text-[#5B42C4] text-xs font-medium">
            <ShieldCheck size={14} className="text-[#8064E9]" />
            <span>100% Client-Side Private</span>
          </div>

          {/* Quick Storage Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs text-[#29243B]">
            <span className="font-semibold">{stats.totalFiles}</span> files
            <span className="text-[#D8D2EB]">•</span>
            <span className="font-semibold">{formatBytes(stats.totalBytes)}</span>
            {duplicateGroups.length > 0 && (
              <>
                <span className="text-[#D8D2EB]">•</span>
                <span className="font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  {duplicateGroups.length} dup {duplicateGroups.length === 1 ? 'group' : 'groups'}
                </span>
              </>
            )}
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white font-medium text-sm shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Upload size={16} />
            <span>Upload Files</span>
          </button>

          {/* User Profile Badge */}
          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#8064E9] to-[#A38DF5] text-white text-[10px] font-bold flex items-center justify-center">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-semibold text-[#29243B] truncate max-w-[110px]" title={currentUser.email}>
                {currentUser.name}
              </span>
            </div>
          )}

          {/* Logout & Return to Dashboard Button */}
          <button
            type="button"
            onClick={logoutUser}
            title="Log out and return to Dashboard"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E2EF] hover:border-rose-200 hover:bg-rose-50/80 text-[#6E6782] hover:text-rose-600 font-medium text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
