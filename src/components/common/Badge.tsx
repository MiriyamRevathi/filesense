import React from 'react';
import { FileCategory } from '../../types';
import { getCategoryColor, getCategoryLabel } from '../../utils/fileUtils';

interface CategoryBadgeProps {
  category: FileCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const colors = getCategoryColor(category);
  const label = getCategoryLabel(category);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {label}
    </span>
  );
};

interface StatusBadgeProps {
  status: 'unhashed' | 'hashing' | 'hashed' | 'error' | 'duplicate';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'duplicate':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
          Duplicate
        </span>
      );
    case 'hashed':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
          Verified SHA-256
        </span>
      );
    case 'hashing':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 animate-pulse ${className}`}>
          Hashing...
        </span>
      );
    case 'error':
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ${className}`}>
          Hash Error
        </span>
      );
    case 'unhashed':
    default:
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`}>
          Unhashed
        </span>
      );
  }
};
