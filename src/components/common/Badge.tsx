import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'teal'
  | 'orange'
  | 'solid-blue'
  | 'solid-orange';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotColor: string }> = {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-[#2ECC71]',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      dotColor: 'bg-[#2ECC71]',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-[#FFB020]',
      border: 'border-amber-200 dark:border-amber-800/60',
      dotColor: 'bg-[#FFB020]',
    },
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-[#FF4D4F]',
      border: 'border-rose-200 dark:border-rose-800/60',
      dotColor: 'bg-[#FF4D4F]',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-[#3B5BFF]/15',
      text: 'text-blue-700 dark:text-[#6079FF]',
      border: 'border-blue-200 dark:border-[#3B5BFF]/30',
      dotColor: 'bg-[#3B5BFF]',
    },
    neutral: {
      bg: 'bg-slate-100 dark:bg-[#1A1D26]',
      text: 'text-slate-700 dark:text-[#9AA0AE]',
      border: 'border-slate-200 dark:border-white/[0.08]',
      dotColor: 'bg-slate-400',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-[#13B2A4]',
      border: 'border-teal-200 dark:border-teal-800/60',
      dotColor: 'bg-[#0E8F83]',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-[#FF6B35]/15',
      text: 'text-orange-700 dark:text-[#FF885A]',
      border: 'border-orange-200 dark:border-[#FF6B35]/30',
      dotColor: 'bg-[#FF6B35]',
    },
    'solid-blue': {
      bg: 'bg-[#3B5BFF]',
      text: 'text-white',
      border: 'border-white/10 shadow-sm',
      dotColor: 'bg-white',
    },
    'solid-orange': {
      bg: '#FF6B35',
      text: 'text-white',
      border: 'border-white/10 shadow-sm',
      dotColor: 'bg-white',
    },
  };

  const style = variantStyles[variant];
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${style.dotColor} animate-pulse`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
