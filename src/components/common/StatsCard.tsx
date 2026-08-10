import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant: 'neutral' | 'success' | 'warning' | 'purple';
  };
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  badge,
  onClick,
}) => {
  const getBadgeStyle = () => {
    switch (badge?.variant) {
      case 'purple':
        return 'bg-[#EDE7FF] text-[#5B42C4] border-[#D8D2EB]';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'neutral':
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-[#E6E2EF] shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[#8064E9] hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6E6782] uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-[#F7F5FF] text-[#8064E9] border border-[#E6E2EF]">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold text-[#29243B] tracking-tight">{value}</h3>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getBadgeStyle()}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1.5 text-xs text-[#6E6782]">{subtext}</p>}
    </div>
  );
};
