import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Code,
  Archive,
  File as FileGeneric,
} from 'lucide-react';
import { FileCategory } from '../../types';

interface FileIconProps {
  category: FileCategory;
  className?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ category, className = '', size = 20 }) => {
  switch (category) {
    case 'images':
      return <ImageIcon size={size} className={`text-purple-600 ${className}`} />;
    case 'documents':
      return <FileText size={size} className={`text-violet-600 ${className}`} />;
    case 'audio':
      return <Music size={size} className={`text-pink-600 ${className}`} />;
    case 'video':
      return <Video size={size} className={`text-amber-600 ${className}`} />;
    case 'code':
      return <Code size={size} className={`text-sky-600 ${className}`} />;
    case 'archives':
      return <Archive size={size} className={`text-yellow-600 ${className}`} />;
    case 'other':
    default:
      return <FileGeneric size={size} className={`text-slate-500 ${className}`} />;
  }
};
