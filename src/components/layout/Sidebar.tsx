import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  CopyCheck,
  PieChart,
  Settings,
  Sparkles,
  HardDrive,
  LogOut,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { ActiveTab } from '../../types';
import { formatBytes } from '../../utils/fileUtils';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, stats, duplicateGroups, logoutUser } = useFileContext();

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeVariant?: 'neutral' | 'warning' | 'purple';
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'files',
      label: 'My Files',
      icon: <FolderOpen size={18} />,
      badge: stats.totalFiles > 0 ? stats.totalFiles : undefined,
      badgeVariant: 'neutral',
    },
    {
      id: 'duplicates',
      label: 'Duplicate Lab',
      icon: <CopyCheck size={18} />,
      badge: duplicateGroups.length > 0 ? duplicateGroups.length : undefined,
      badgeVariant: 'warning',
    },
    {
      id: 'insights',
      label: 'Storage Insights',
      icon: <PieChart size={18} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#29243B]/30 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-[61px] left-0 h-[calc(100vh-61px)] w-64 bg-white border-r border-[#E6E2EF] p-4 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[11px] font-semibold text-[#6E6782] uppercase tracking-wider px-3 mb-2">
              Menu
            </div>
            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#EDE7FF] text-[#5B42C4] font-semibold'
                        : 'text-[#6E6782] hover:text-[#29243B] hover:bg-[#F7F5FF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-[#8064E9]' : 'text-[#6E6782]'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.badgeVariant === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-[#F7F5FF] text-[#6E6782] border border-[#E6E2EF]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Lower Storage Card / Duplicate Callout */}
        <div className="space-y-3 pt-4 border-t border-[#E6E2EF]">
          {duplicateGroups.length > 0 && stats.reclaimableBytes > 0 ? (
            <div className="rounded-2xl p-3.5 bg-gradient-to-br from-[#EDE7FF] to-[#F7F5FF] border border-[#D8D2EB]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5B42C4] mb-1">
                <Sparkles size={14} className="text-[#8064E9]" />
                <span>Space to Reclaim</span>
              </div>
              <p className="text-base font-bold text-[#29243B]">
                {formatBytes(stats.reclaimableBytes)}
              </p>
              <p className="text-[11px] text-[#6E6782] mt-0.5">
                Found across {duplicateGroups.length} exact duplicate groups.
              </p>
              <button
                type="button"
                onClick={() => handleNavClick('duplicates')}
                className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-medium transition-colors cursor-pointer text-center block"
              >
                Review in Duplicate Lab
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 bg-[#F7F5FF] border border-[#E6E2EF]">
              <div className="flex items-center gap-2 text-xs font-medium text-[#6E6782] mb-1">
                <HardDrive size={14} className="text-[#8064E9]" />
                <span>IndexedDB Storage</span>
              </div>
              <p className="text-sm font-semibold text-[#29243B]">
                {formatBytes(stats.totalBytes)} stored
              </p>
              <p className="text-[11px] text-[#6E6782] mt-0.5">
                All files stay private in your browser.
              </p>
            </div>
          )}

          {/* Logout Action in Sidebar */}
          <button
            type="button"
            onClick={() => {
              logoutUser();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#E6E2EF] hover:border-rose-200 hover:bg-rose-50/80 text-[#6E6782] hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Log Out &amp; Go to Dashboard</span>
          </button>
        </div>
      </aside>
    </>
  );
};
