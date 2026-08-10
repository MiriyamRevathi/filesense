import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  StoredFileRecord,
  DuplicateGroup,
  StorageStats,
  ActiveTab,
  ViewMode,
  UploadItem,
  FileCategory,
  UserProfile,
} from '../types';
import {
  getAllFileRecords,
  saveFileRecordsBatch,
  deleteFileRecord,
  deleteFileRecordsBatch,
  clearAllFileRecords,
  getPreference,
  setPreference,
  updateFileRecord,
} from '../services/db';
import { createFileRecordFromFile } from '../utils/fileUtils';
import { runDuplicateAnalysis, DuplicateScanProgress } from '../services/duplicateEngine';
import { calculateStorageStats } from '../utils/storageCalculations';
import { createDemoFiles } from '../services/demoFiles';

interface FileContextType {
  files: StoredFileRecord[];
  loading: boolean;
  error: string | null;
  stats: StorageStats;
  duplicateGroups: DuplicateGroup[];
  isScanning: boolean;
  scanProgress: DuplicateScanProgress | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFileIds: Set<string>;
  toggleSelectFile: (id: string) => void;
  selectAllFiles: (filteredIds?: string[]) => void;
  clearSelection: () => void;
  uploadQueue: UploadItem[];
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  uploadFiles: (fileList: File[]) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  deleteFiles: (ids: string[]) => Promise<void>;
  scanDuplicates: (forceRehash?: boolean) => Promise<void>;
  deleteDuplicatesInGroup: (groupId: string, fileIdsToDelete: string[]) => Promise<void>;
  updateFileCategory: (id: string, newCategory: FileCategory) => Promise<void>;
  seedDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  logoutUser: () => void;
  loginUser: (email?: string, name?: string) => void;
  isLoggedIn: boolean;
  currentUser: UserProfile | null;
  logoutNotice: string | null;
  setLogoutNotice: (msg: string | null) => void;
}

const FileContext = createContext<FileContextType | null>(null);

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<StoredFileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<DuplicateScanProgress | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    email: 'user@filesense.local',
    name: 'Local User',
  });
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  // Load initial view mode preference
  useEffect(() => {
    getPreference<ViewMode>('pref_view_mode', 'grid').then(mode => {
      setViewModeState(mode);
    });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setPreference('pref_view_mode', mode);
  }, []);

  // Duplicate analysis runner
  const executeScan = useCallback(
    async (records: StoredFileRecord[], forceRehash = false) => {
      if (records.length === 0) {
        setDuplicateGroups([]);
        return;
      }
      setIsScanning(true);
      try {
        const result = await runDuplicateAnalysis(records, {
          concurrency: 3,
          forceRehash,
          onProgress: setScanProgress,
        });

        // Persist updated hashes to IndexedDB
        for (const updated of result.updatedFiles) {
          const original = records.find(r => r.id === updated.id);
          if (original && (original.hash !== updated.hash || original.hashStatus !== updated.hashStatus)) {
            await updateFileRecord(updated);
          }
        }

        setFiles(result.updatedFiles);
        setDuplicateGroups(result.duplicateGroups);
      } catch (err) {
        console.error('Error during duplicate analysis:', err);
        setError(err instanceof Error ? err.message : 'Duplicate scan failed');
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  // Initial load from IndexedDB
  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await getAllFileRecords();
      setFiles(records);
      await executeScan(records, false);
    } catch (err) {
      console.error('Failed to load files from IndexedDB:', err);
      setError('Failed to load stored files from local database.');
    } finally {
      setLoading(false);
    }
  }, [executeScan]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const scanDuplicates = useCallback(
    async (forceRehash = false) => {
      await executeScan(files, forceRehash);
    },
    [executeScan, files]
  );

  // Upload multiple files
  const uploadFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return;
      setError(null);

      const newUploadItems: UploadItem[] = fileList.map(f => ({
        id: 'up_' + Math.random().toString(36).substring(2, 9),
        file: f,
        progress: 10,
        status: 'uploading',
      }));

      setUploadQueue(prev => [...prev, ...newUploadItems]);

      const recordsToStore: StoredFileRecord[] = [];

      try {
        for (let i = 0; i < fileList.length; i++) {
          const f = fileList[i];
          const record = createFileRecordFromFile(f);
          recordsToStore.push(record);

          // Update individual item progress
          setUploadQueue(prev =>
            prev.map(item =>
              item.file === f ? { ...item, progress: 80, status: 'uploading' } : item
            )
          );
        }

        // Commit batch transaction to IndexedDB
        await saveFileRecordsBatch(recordsToStore);

        setUploadQueue(prev =>
          prev.map(item =>
            fileList.includes(item.file) ? { ...item, progress: 100, status: 'completed' } : item
          )
        );

        // Update active files
        const combined = [...files, ...recordsToStore];
        setFiles(combined);

        // Run duplicate detection on newly combined set
        await executeScan(combined, false);
      } catch (err) {
        console.error('Storage error during upload:', err);
        const errMsg = err instanceof Error ? err.message : 'Storage quota exceeded or write failed';
        setError(errMsg);
        setUploadQueue(prev =>
          prev.map(item =>
            fileList.includes(item.file) ? { ...item, status: 'error', error: errMsg } : item
          )
        );
      }
    },
    [files, executeScan]
  );

  // Delete single file
  const deleteFile = useCallback(
    async (id: string) => {
      try {
        await deleteFileRecord(id);
        const updated = files.filter(f => f.id !== id);
        setFiles(updated);
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await executeScan(updated, false);
      } catch (err) {
        console.error('Failed to delete file:', err);
        setError('Failed to delete file from local database.');
      }
    },
    [files, executeScan]
  );

  // Batch delete files
  const deleteFiles = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      try {
        await deleteFileRecordsBatch(ids);
        const idSet = new Set(ids);
        const updated = files.filter(f => !idSet.has(f.id));
        setFiles(updated);
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          for (const id of ids) next.delete(id);
          return next;
        });
        await executeScan(updated, false);
      } catch (err) {
        console.error('Failed to batch delete files:', err);
        setError('Failed to delete selected files from local database.');
      }
    },
    [files, executeScan]
  );

  // Delete specific duplicates within a duplicate group
  const deleteDuplicatesInGroup = useCallback(
    async (groupId: string, fileIdsToDelete: string[]) => {
      if (fileIdsToDelete.length === 0) return;
      await deleteFiles(fileIdsToDelete);
    },
    [deleteFiles]
  );

  // Update file category (e.g. via drag-and-drop or manual reclassification)
  const updateFileCategory = useCallback(
    async (id: string, newCategory: FileCategory) => {
      const target = files.find(f => f.id === id);
      if (!target) return;
      const updated: StoredFileRecord = { ...target, category: newCategory };
      try {
        await updateFileRecord(updated);
        setFiles(prev => prev.map(f => (f.id === id ? updated : f)));
      } catch (err) {
        console.error('Failed to update file category:', err);
        setError('Failed to update file category in local storage.');
      }
    },
    [files]
  );

  // Seed demo files
  const seedDemoData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const demoItems = createDemoFiles();
      await saveFileRecordsBatch(demoItems);
      setFiles(demoItems);
      await executeScan(demoItems, false);
    } catch (err) {
      console.error('Failed to seed demo data:', err);
      setError('Failed to seed sample files.');
    } finally {
      setLoading(false);
    }
  }, [executeScan]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    try {
      setLoading(true);
      await clearAllFileRecords();
      setFiles([]);
      setDuplicateGroups([]);
      setSelectedFileIds(new Set());
      setUploadQueue([]);
    } catch (err) {
      console.error('Failed to clear database:', err);
      setError('Failed to clear local data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Selection management
  const toggleSelectFile = useCallback((id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllFiles = useCallback(
    (filteredIds?: string[]) => {
      if (filteredIds) {
        setSelectedFileIds(new Set(filteredIds));
      } else {
        setSelectedFileIds(new Set(files.map(f => f.id)));
      }
    },
    [files]
  );

  const clearSelection = useCallback(() => {
    setSelectedFileIds(new Set());
  }, []);

  const logoutUser = useCallback(() => {
    setSelectedFileIds(new Set());
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('landing');
    setLogoutNotice('Logged out successfully. Welcome to the FileSense landing page.');
    setTimeout(() => {
      setLogoutNotice(null);
    }, 4500);
  }, []);

  const loginUser = useCallback((email?: string, name?: string) => {
    const userEmail = email?.trim() || 'user@filesense.local';
    const userName = name?.trim() || userEmail.split('@')[0] || 'Local User';
    setCurrentUser({ email: userEmail, name: userName });
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  }, []);

  // Real calculated storage stats
  const stats = useMemo(() => {
    return calculateStorageStats(files, duplicateGroups);
  }, [files, duplicateGroups]);

  return (
    <FileContext.Provider
      value={{
        files,
        loading,
        error,
        stats,
        duplicateGroups,
        isScanning,
        scanProgress,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        selectedFileIds,
        toggleSelectFile,
        selectAllFiles,
        clearSelection,
        uploadQueue,
        isUploadModalOpen,
        setIsUploadModalOpen,
        uploadFiles,
        deleteFile,
        deleteFiles,
        scanDuplicates,
        deleteDuplicatesInGroup,
        updateFileCategory,
        seedDemoData,
        clearAllData,
        refreshFiles,
        logoutUser,
        loginUser,
        isLoggedIn,
        currentUser,
        logoutNotice,
        setLogoutNotice,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export function useFileContext(): FileContextType {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
}
