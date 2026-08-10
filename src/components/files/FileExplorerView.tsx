import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Download,
  Eye,
  CheckSquare,
  Square,
  Info,
  X,
  ShieldCheck,
  FileQuestion,
  UploadCloud,
  Move,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import {
  StoredFileRecord,
  SortOption,
  FileCategory,
} from '../../types';
import {
  formatBytes,
  formatDate,
  downloadFileBlob,
  getFileExtension,
} from '../../utils/fileUtils';
import { filterAndSortFiles } from '../../utils/storageCalculations';
import { FileIcon } from '../common/FileIcon';
import { CategoryBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const FileExplorerView: React.FC = () => {
  const {
    files,
    viewMode,
    setViewMode,
    selectedFileIds,
    toggleSelectFile,
    selectAllFiles,
    clearSelection,
    deleteFile,
    deleteFiles,
    setIsUploadModalOpen,
    uploadFiles,
    updateFileCategory,
  } = useFileContext();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Drag and Drop state
  const [isDesktopDragging, setIsDesktopDragging] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspector and preview modal state
  const [inspectedFile, setInspectedFile] = useState<StoredFileRecord | null>(null);
  const [previewFile, setPreviewFile] = useState<StoredFileRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Deletion confirmation modal
  const [filesToDelete, setFilesToDelete] = useState<StoredFileRecord[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Manage image blob URL for preview
  useEffect(() => {
    if (previewFile && previewFile.category === 'images') {
      const url = URL.createObjectURL(previewFile.blob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setPreviewUrl(null);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [previewFile]);

  // Filtered and sorted files
  const filteredFiles = useMemo(() => {
    return filterAndSortFiles(files, {
      search: searchTerm,
      category: categoryFilter,
      sortBy,
    });
  }, [files, searchTerm, categoryFilter, sortBy]);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Files' },
    { id: 'images', label: 'Images' },
    { id: 'documents', label: 'Documents' },
    { id: 'code', label: 'Code & Data' },
    { id: 'audio', label: 'Audio' },
    { id: 'video', label: 'Video' },
    { id: 'archives', label: 'Archives' },
    { id: 'other', label: 'Other' },
  ];

  const handleOpenDeleteConfirm = (records: StoredFileRecord[]) => {
    setFilesToDelete(records);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const ids = filesToDelete.map(f => f.id);
    if (ids.length === 1) {
      await deleteFile(ids[0]);
    } else {
      await deleteFiles(ids);
    }
    if (inspectedFile && ids.includes(inspectedFile.id)) {
      setInspectedFile(null);
    }
    if (previewFile && ids.includes(previewFile.id)) {
      setPreviewFile(null);
    }
    setIsDeleteModalOpen(false);
    setFilesToDelete([]);
  };

  const handleDownloadSelected = () => {
    const selectedRecords = files.filter(f => selectedFileIds.has(f.id));
    for (const record of selectedRecords) {
      downloadFileBlob(record.blob, record.name);
    }
  };

  const allFilteredSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every(f => selectedFileIds.has(f.id));

  // Desktop Drag-and-Drop Handlers for FileExplorerView
  const handleContainerDragOver = (e: React.DragEvent) => {
    // If dragging desktop files
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
      setIsDesktopDragging(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDesktopDragging(false);
  };

  const handleContainerDrop = async (e: React.DragEvent) => {
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsDesktopDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      await uploadFiles(dropped);
      setToastMessage(`Imported ${dropped.length} file${dropped.length === 1 ? '' : 's'} from desktop.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Inter-category Drag and Drop Handlers
  const handleCategoryDragOver = (e: React.DragEvent, catId: string) => {
    if (catId !== 'all') {
      e.preventDefault();
      setDragOverCategory(catId);
    }
  };

  const handleCategoryDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleCategoryDrop = async (e: React.DragEvent, catId: string) => {
    e.preventDefault();
    setDragOverCategory(null);
    const fileId = e.dataTransfer.getData('application/filesense-file') || draggedFileId;
    if (fileId && catId !== 'all') {
      const file = files.find(f => f.id === fileId);
      await updateFileCategory(fileId, catId as FileCategory);
      const catObj = categories.find(c => c.id === catId);
      setToastMessage(`Moved "${file ? file.name : 'file'}" to ${catObj?.label || catId}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
    setDraggedFileId(null);
  };

  return (
    <div
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
      className="space-y-6 pb-12 relative"
    >
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#29243B] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={16} className="text-[#A38DF5] shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Desktop Drag-and-Drop Overlay */}
      {isDesktopDragging && (
        <div className="absolute inset-0 z-40 bg-[#EDE7FF]/90 backdrop-blur-xs rounded-3xl border-3 border-dashed border-[#8064E9] flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-white text-[#8064E9] shadow-lg flex items-center justify-center mb-3">
            <UploadCloud size={32} className="animate-bounce" />
          </div>
          <h3 className="text-lg font-bold text-[#29243B]">Drop Files Here to Import</h3>
          <p className="text-xs text-[#5B42C4] font-medium mt-1">
            Files will be stored securely in your browser's IndexedDB
          </p>
        </div>
      )}

      {/* Inline Desktop Dropzone Banner */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#EDE7FF]/60 via-white to-[#F7F5FF] border border-dashed border-[#D8D2EB] hover:border-[#8064E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:bg-[#EDE7FF]/80 group shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white text-[#8064E9] shadow-xs group-hover:scale-105 transition-transform border border-[#E6E2EF]">
            <UploadCloud size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#29243B] block">
              Drag &amp; drop files directly from your desktop here
            </span>
            <span className="text-[11px] text-[#6E6782]">
              Or click here to browse files to add them directly to your local library
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#5B42C4] border border-[#D8D2EB] text-xs font-semibold hover:border-[#8064E9] shadow-xs transition-colors cursor-pointer"
          >
            Browse Files
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={async e => {
            if (e.target.files && e.target.files.length > 0) {
              const fileList = Array.from(e.target.files);
              await uploadFiles(fileList);
              setToastMessage(`Added ${fileList.length} file${fileList.length === 1 ? '' : 's'}.`);
              setTimeout(() => setToastMessage(null), 3000);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }
          }}
        />
      </div>

      {/* Top Controls: Search, Filters, View Toggles */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2EF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6782]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-sm text-[#29243B] placeholder:text-[#6E6782] focus:outline-hidden focus:border-[#8064E9] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6782] hover:text-[#29243B]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort & View Mode Switches */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF] text-xs text-[#29243B]">
              <ArrowUpDown size={14} className="text-[#6E6782]" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                aria-label="Sort files by"
                className="bg-transparent border-none text-xs font-medium text-[#29243B] focus:outline-hidden cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="size-desc">Size (Largest)</option>
                <option value="size-asc">Size (Smallest)</option>
                <option value="type-asc">Type</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#8064E9] shadow-xs'
                    : 'text-[#6E6782] hover:text-[#29243B]'
                }`}
                title="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#8064E9] shadow-xs'
                    : 'text-[#6E6782] hover:text-[#29243B]'
                }`}
                title="List view"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Drag Drop Targets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6E6782] uppercase tracking-wider">
              <Filter size={13} className="text-[#6E6782]" />
              <span>Category Folders</span>
            </div>
            {draggedFileId && (
              <span className="text-[11px] font-semibold text-[#8064E9] animate-pulse flex items-center gap-1">
                <Move size={12} />
                <span>Drop on any category below to move</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => {
              const isSelected = categoryFilter === cat.id;
              const isTargetHovered = dragOverCategory === cat.id;
              const isDroppable = !!draggedFileId && cat.id !== 'all';

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  onDragOver={e => handleCategoryDragOver(e, cat.id)}
                  onDragLeave={handleCategoryDragLeave}
                  onDrop={e => handleCategoryDrop(e, cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 shrink-0 cursor-pointer ${
                    isTargetHovered
                      ? 'bg-[#EDE7FF] text-[#5B42C4] ring-2 ring-[#8064E9] scale-105 shadow-sm font-bold'
                      : isDroppable
                      ? 'border-dashed border-[#8064E9] bg-white text-[#5B42C4] hover:bg-[#EDE7FF]/60'
                      : isSelected
                      ? 'bg-[#8064E9] text-white shadow-xs'
                      : 'bg-[#F7F5FF] text-[#6E6782] hover:text-[#29243B] hover:bg-[#EDE7FF]/60 border border-[#E6E2EF]'
                  }`}
                  title={
                    isDroppable
                      ? `Drop here to move into ${cat.label}`
                      : `Filter by ${cat.label}`
                  }
                >
                  <span>{cat.label}</span>
                  {isTargetHovered && <span className="ml-1 text-[10px]">📥</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-selection Floating Action Bar */}
      {selectedFileIds.size > 0 && (
        <div className="sticky top-[70px] z-20 bg-[#EDE7FF] border border-[#D8D2EB] rounded-2xl p-3 px-4 shadow-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (allFilteredSelected) {
                  clearSelection();
                } else {
                  selectAllFiles(filteredFiles.map(f => f.id));
                }
              }}
              className="text-[#5B42C4] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {allFilteredSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              <span>
                {selectedFileIds.size} {selectedFileIds.size === 1 ? 'file' : 'files'} selected
              </span>
            </button>
            <span className="text-xs text-[#6E6782]">
              (Total{' '}
              {formatBytes(
                files
                  .filter(f => selectedFileIds.has(f.id))
                  .reduce((acc, f) => acc + f.size, 0)
              )}
              )
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSelected}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F5FF] text-[#5B42C4] text-xs font-semibold border border-[#D8D2EB] shadow-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download Selected</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleOpenDeleteConfirm(
                  files.filter(f => selectedFileIds.has(f.id))
                )
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="p-1.5 rounded-lg text-[#6E6782] hover:text-[#29243B] hover:bg-white transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Main Files Display */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E6E2EF] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F7F5FF] text-[#8064E9] flex items-center justify-center mx-auto mb-3">
            <FileQuestion size={32} />
          </div>
          <h3 className="text-base font-bold text-[#29243B]">No files match your filter</h3>
          <p className="text-xs text-[#6E6782] max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try modifying your search query or choosing another category filter.'
              : 'Your file organizer library is empty. Drag and drop files from your desktop or browse to start.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {(searchTerm || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#F7F5FF] text-[#5B42C4] border border-[#D8D2EB] text-xs font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#8064E9] text-white text-xs font-semibold shadow-xs hover:bg-[#5B42C4] cursor-pointer"
            >
              Upload Files
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map(file => {
            const isSelected = selectedFileIds.has(file.id);
            const isBeingDragged = draggedFileId === file.id;
            const ext = getFileExtension(file.name);

            return (
              <div
                key={file.id}
                draggable={true}
                onDragStart={e => {
                  e.dataTransfer.setData('application/filesense-file', file.id);
                  e.dataTransfer.setData('text/plain', file.id);
                  setDraggedFileId(file.id);
                }}
                onDragEnd={() => {
                  setDraggedFileId(null);
                  setDragOverCategory(null);
                }}
                className={`group bg-white rounded-2xl p-4 border transition-all duration-150 flex flex-col justify-between relative shadow-xs hover:shadow-md ${
                  isBeingDragged ? 'opacity-40 scale-95 border-[#8064E9]' : ''
                } ${
                  isSelected
                    ? 'border-[#8064E9] ring-2 ring-[#8064E9]/20 bg-[#FAF8FF]'
                    : 'border-[#E6E2EF] hover:border-[#D8D2EB]'
                }`}
              >
                {/* Top card bar with drag grip */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectFile(file.id)}
                      className="text-[#6E6782] hover:text-[#8064E9] transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-[#8064E9]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <span
                      className="text-[#6E6782]/60 group-hover:text-[#8064E9] cursor-grab active:cursor-grabbing"
                      title="Drag to move to another category folder"
                    >
                      <Move size={13} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ext && (
                      <span className="text-[10px] uppercase font-bold text-[#6E6782] px-1.5 py-0.5 rounded-md bg-[#F7F5FF] border border-[#E6E2EF]">
                        {ext}
                      </span>
                    )}
                    <CategoryBadge category={file.category} />
                  </div>
                </div>

                {/* Thumbnail / Icon center preview */}
                <div
                  onClick={() => {
                    if (file.category === 'images') {
                      setPreviewFile(file);
                    } else {
                      setInspectedFile(file);
                    }
                  }}
                  className="py-6 flex flex-col items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#F7F5FF] flex items-center justify-center border border-[#E6E2EF] shadow-xs">
                    <FileIcon category={file.category} size={28} />
                  </div>
                </div>

                {/* File details info */}
                <div className="mt-2 pt-2 border-t border-[#F7F5FF]">
                  <h4
                    onClick={() => setInspectedFile(file)}
                    className="text-xs font-semibold text-[#29243B] truncate hover:text-[#8064E9] cursor-pointer"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-[#6E6782] mt-1">
                    <span className="font-medium text-[#29243B]">{formatBytes(file.size)}</span>
                    <span>{formatDate(file.dateAdded)}</span>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E6E2EF]">
                  <div className="flex items-center gap-1">
                    {file.category === 'images' && (
                      <button
                        type="button"
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 rounded-lg text-[#6E6782] hover:text-[#8064E9] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
                        title="Quick preview"
                      >
                        <Eye size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setInspectedFile(file)}
                      className="p-1.5 rounded-lg text-[#6E6782] hover:text-[#8064E9] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
                      title="Inspect metadata & change folder"
                    >
                      <Info size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => downloadFileBlob(file.blob, file.name)}
                      className="p-1.5 rounded-lg text-[#6E6782] hover:text-[#8064E9] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
                      title="Download file"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteConfirm([file])}
                      className="p-1.5 rounded-lg text-[#6E6782] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-[#E6E2EF] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FF] border-b border-[#E6E2EF] text-[#6E6782] font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5 pl-4 w-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (allFilteredSelected) {
                          clearSelection();
                        } else {
                          selectAllFiles(filteredFiles.map(f => f.id));
                        }
                      }}
                      className="text-[#6E6782] hover:text-[#8064E9] cursor-pointer"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare size={16} className="text-[#8064E9]" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5">Filename</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">SHA-256 Hash</th>
                  <th className="p-3.5">Added</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2EF]">
                {filteredFiles.map(file => {
                  const isSelected = selectedFileIds.has(file.id);
                  const isBeingDragged = draggedFileId === file.id;

                  return (
                    <tr
                      key={file.id}
                      draggable={true}
                      onDragStart={e => {
                        e.dataTransfer.setData('application/filesense-file', file.id);
                        e.dataTransfer.setData('text/plain', file.id);
                        setDraggedFileId(file.id);
                      }}
                      onDragEnd={() => {
                        setDraggedFileId(null);
                        setDragOverCategory(null);
                      }}
                      className={`hover:bg-[#F7F5FF]/60 transition-colors ${
                        isBeingDragged ? 'opacity-40' : ''
                      } ${isSelected ? 'bg-[#EDE7FF]/40' : ''}`}
                    >
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSelectFile(file.id)}
                            className="text-[#6E6782] hover:text-[#8064E9] cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} className="text-[#8064E9]" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                          <span
                            className="text-[#6E6782]/50 hover:text-[#8064E9] cursor-grab active:cursor-grabbing"
                            title="Drag to category"
                          >
                            <Move size={12} />
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5 max-w-xs truncate">
                          <FileIcon category={file.category} size={18} />
                          <span
                            onClick={() => setInspectedFile(file)}
                            className="font-medium text-[#29243B] truncate hover:text-[#8064E9] cursor-pointer"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <CategoryBadge category={file.category} />
                      </td>
                      <td className="p-3.5 font-medium text-[#29243B]">
                        {formatBytes(file.size)}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-[#6E6782]">
                        {file.hash ? (
                          <span title={file.hash}>
                            {file.hash.slice(0, 10)}...{file.hash.slice(-6)}
                          </span>
                        ) : (
                          <StatusBadge status={file.hashStatus} />
                        )}
                      </td>
                      <td className="p-3.5 text-[#6E6782] whitespace-nowrap">
                        {formatDate(file.dateAdded)}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {file.category === 'images' && (
                            <button
                              type="button"
                              onClick={() => setPreviewFile(file)}
                              className="p-1 rounded-md text-[#6E6782] hover:text-[#8064E9] hover:bg-white transition-colors cursor-pointer"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectedFile(file)}
                            className="p-1 rounded-md text-[#6E6782] hover:text-[#8064E9] hover:bg-white transition-colors cursor-pointer"
                            title="Inspect metadata"
                          >
                            <Info size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadFileBlob(file.blob, file.name)}
                            className="p-1 rounded-md text-[#6E6782] hover:text-[#8064E9] hover:bg-white transition-colors cursor-pointer"
                            title="Download file"
                          >
                            <Download size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteConfirm([file])}
                            className="p-1 rounded-md text-[#6E6782] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* File Details Inspector Modal */}
      <Modal
        isOpen={!!inspectedFile}
        onClose={() => setInspectedFile(null)}
        title="File Metadata Inspector"
        description="Inspect complete cryptographic hash, MIME type, and local storage record."
        maxWidth="lg"
      >
        {inspectedFile && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
              <FileIcon category={inspectedFile.category} size={28} />
              <div className="truncate">
                <h4 className="text-sm font-bold text-[#29243B] truncate" title={inspectedFile.name}>
                  {inspectedFile.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={inspectedFile.category} />
                  <span className="text-xs text-[#6E6782]">{inspectedFile.type}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
                <div className="text-[11px] font-semibold text-[#6E6782] uppercase mb-1">
                  Exact Byte Size
                </div>
                <div className="font-bold text-[#29243B]">
                  {formatBytes(inspectedFile.size)} ({inspectedFile.size.toLocaleString()} bytes)
                </div>
              </div>

              {/* Category Folder Switcher */}
              <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
                <div className="text-[11px] font-semibold text-[#6E6782] uppercase mb-1">
                  Category Folder
                </div>
                <select
                  value={inspectedFile.category}
                  onChange={async e => {
                    const newCat = e.target.value as FileCategory;
                    await updateFileCategory(inspectedFile.id, newCat);
                    setInspectedFile({ ...inspectedFile, category: newCat });
                    setToastMessage(`Category updated to ${newCat}`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="w-full bg-white text-xs font-semibold text-[#29243B] p-1 rounded-md border border-[#E6E2EF] cursor-pointer"
                >
                  <option value="images">Images</option>
                  <option value="documents">Documents</option>
                  <option value="code">Code &amp; Data</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="archives">Archives</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
                <div className="text-[11px] font-semibold text-[#6E6782] uppercase mb-1">
                  Added to FileSense
                </div>
                <div className="text-[#29243B] font-medium">
                  {formatDate(inspectedFile.dateAdded)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
                <div className="text-[11px] font-semibold text-[#6E6782] uppercase mb-1">
                  Last Modified Timestamp
                </div>
                <div className="text-[#29243B] font-medium">
                  {formatDate(inspectedFile.lastModified)}
                </div>
              </div>
            </div>

            {/* SHA-256 Digest Information */}
            <div className="p-3.5 rounded-xl bg-[#F7F5FF] border border-[#E6E2EF]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#6E6782] uppercase tracking-wider">
                  Cryptographic SHA-256 Digest
                </span>
                <StatusBadge status={inspectedFile.hashStatus} />
              </div>
              <div className="font-mono text-xs text-[#29243B] bg-white p-2.5 rounded-lg border border-[#E6E2EF] break-all select-all">
                {inspectedFile.hash || 'Not computed yet. Run duplicate scan to generate signature.'}
              </div>
            </div>

            {/* Inspector Modal Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const target = inspectedFile;
                  setInspectedFile(null);
                  handleOpenDeleteConfirm([target]);
                }}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete File
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadFileBlob(inspectedFile.blob, inspectedFile.name)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || 'Image Preview'}
        description={`${previewFile ? formatBytes(previewFile.size) : ''} • Image Viewer`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="max-h-[60vh] flex items-center justify-center bg-[#F7F5FF] rounded-xl border border-[#E6E2EF] p-2 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={previewFile?.name}
                className="max-h-[55vh] max-w-full object-contain rounded-lg shadow-xs"
              />
            ) : (
              <div className="py-12 text-xs text-[#6E6782]">Generating image preview...</div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#6E6782]">{previewFile?.type}</span>
            <div className="flex items-center gap-2">
              {previewFile && (
                <button
                  type="button"
                  onClick={() => downloadFileBlob(previewFile.blob, previewFile.name)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8064E9] hover:bg-[#5B42C4] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Image</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm File Removal"
        description="Are you sure you want to delete these files from local IndexedDB?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <p className="font-semibold mb-1">
              Warning: This operation will permanently remove {filesToDelete.length}{' '}
              {filesToDelete.length === 1 ? 'file' : 'files'} from browser storage.
            </p>
            <p>
              Total space released:{' '}
              <span className="font-bold">
                {formatBytes(filesToDelete.reduce((acc, f) => acc + f.size, 0))}
              </span>
            </p>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 border border-[#E6E2EF] rounded-xl p-2.5 bg-[#F7F5FF]">
            {filesToDelete.map(f => (
              <div
                key={f.id}
                className="flex items-center justify-between text-xs text-[#29243B] p-1.5 rounded-lg bg-white border border-[#E6E2EF]"
              >
                <span className="truncate pr-2">{f.name}</span>
                <span className="text-[#6E6782] shrink-0">{formatBytes(f.size)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E6E2EF] text-xs font-semibold text-[#29243B] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Permanently Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
