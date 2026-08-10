import React, { useState } from 'react';
import { FileProvider, useFileContext } from './context/FileContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { UploadModal } from './components/upload/UploadModal';
import {
  LandingPage,
  DashboardPage,
  FilesPage,
  DuplicatesPage,
  InsightsPage,
  SettingsPage,
} from './pages';
import { FolderSync } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, loading, isLoggedIn } = useFileContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#8064E9] flex items-center justify-center text-white shadow-md animate-bounce mb-4">
          <FolderSync size={28} />
        </div>
        <h2 className="text-base font-bold text-[#29243B]">Loading FileSense...</h2>
        <p className="text-xs text-[#6E6782] mt-1">Connecting to local IndexedDB storage</p>
      </div>
    );
  }

  // When logged out or on landing tab, show full-bleed Landing Page with zero side gaps
  if (!isLoggedIn || activeTab === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navbar */}
      <Navbar
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex w-full">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Content Tab */}
        <main className={`flex-1 min-w-0 w-full ${activeTab === 'dashboard' ? 'p-0' : 'p-4 sm:p-6 lg:p-8'}`}>
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'files' && <FilesPage />}
          {activeTab === 'duplicates' && <DuplicatesPage />}
          {activeTab === 'insights' && <InsightsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Upload Modal */}
      <UploadModal />
    </div>
  );
};

export default function App() {
  return (
    <FileProvider>
      <AppContent />
    </FileProvider>
  );
}
