import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';
import { useFileContext } from '../../context/FileContext';
import { formatBytes } from '../../utils/fileUtils';
import { Modal } from '../common/Modal';

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadFiles,
    uploadQueue,
  } = useFileContext();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFiles = async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    if (filesToUpload.length === 0) return;

    setIsProcessing(true);
    try {
      await uploadFiles(filesToUpload);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        await processFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Modal
      isOpen={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      title="Upload Local Files"
      description="Files are processed and stored securely in your browser's IndexedDB."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-[#8064E9] bg-[#EDE7FF]/60 scale-[1.01]'
              : 'border-[#D8D2EB] hover:border-[#8064E9] bg-[#F7F5FF]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#8064E9] shadow-sm border border-[#E6E2EF] mb-3">
              <UploadCloud size={28} />
            </div>
            <p className="text-sm font-semibold text-[#29243B]">
              Drag and drop files here, or <span className="text-[#8064E9]">browse</span>
            </p>
            <p className="text-xs text-[#6E6782] mt-1 max-w-sm">
              Supports documents, photos, code, audio, archives, or any data files. Everything remains offline on your device.
            </p>
          </div>
        </div>

        {/* Upload Queue / Status List */}
        {uploadQueue.length > 0 && (
          <div className="border border-[#E6E2EF] rounded-xl p-3 bg-white max-h-56 overflow-y-auto space-y-2">
            <div className="text-xs font-semibold text-[#6E6782] uppercase px-1 mb-1">
              Recent Uploads ({uploadQueue.length})
            </div>
            {uploadQueue.slice(-10).reverse().map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F7F5FF] border border-[#E6E2EF] text-xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText size={16} className="text-[#8064E9] shrink-0" />
                  <div className="truncate">
                    <span className="font-medium text-[#29243B] truncate block">
                      {item.file.name}
                    </span>
                    <span className="text-[10px] text-[#6E6782]">
                      {formatBytes(item.file.size)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {item.status === 'uploading' && (
                    <span className="text-[#8064E9] font-medium text-[11px] flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-[#8064E9] border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  )}
                  {item.status === 'completed' && (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium text-[11px]">
                      <CheckCircle2 size={14} /> Saved
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-rose-600 flex items-center gap-1 font-medium text-[11px]" title={item.error}>
                      <AlertCircle size={14} /> Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E6E2EF] text-sm font-medium text-[#29243B] hover:bg-[#F7F5FF] transition-colors cursor-pointer"
          >
            {isProcessing ? 'Processing in background...' : 'Done'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
