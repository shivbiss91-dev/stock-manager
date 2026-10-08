import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid-blue' | 'solid-orange' | 'elevated' | 'plain';
  glow?: boolean;
  hoverEffect?: boolean;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'glass',
  glow = false,
  hoverEffect = false,
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
}) => {
  let variantClasses = '';

  if (variant === 'solid-blue') {
    variantClasses = 'bg-[#3B5BFF] text-white border border-white/20 shadow-glow-blue';
  } else if (variant === 'solid-orange') {
    variantClasses = 'bg-[#FF6B35] text-white border border-white/20 shadow-glow-orange';
  } else if (variant === 'plain') {
    variantClasses = 'bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/5';
  } else {
    // Glass default matching template (#12151D to #181B25, 1px border rgba(255,255,255,0.06), inner highlight)
    variantClasses = glow
      ? 'bg-gradient-to-b from-[#12151D] to-[#181B25] border border-[#FF6B35]/40 shadow-glow-orange text-slate-900 dark:text-app-text'
      : 'bg-white dark:bg-gradient-to-b dark:from-[#12151D] dark:to-[#181B25] border border-slate-200/90 dark:border-white/[0.06] shadow-sm dark:shadow-glass-card text-slate-900 dark:text-app-text';
  }

  const hoverClass = hoverEffect
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:border-white/10'
    : '';

  const isSolid = variant === 'solid-blue' || variant === 'solid-orange';

  return (
    <div
      className={`rounded-2xl md:rounded-[20px] ${variantClasses} ${hoverClass} overflow-hidden ${className}`}
    >
      {(title || headerAction) && (
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isSolid
              ? 'border-white/15'
              : 'border-slate-100 dark:border-white/[0.06]'
          }`}
        >
          <div>
            {title && (
              <h3
                className={`font-semibold text-base ${
                  isSolid
                    ? 'text-white'
                    : 'text-slate-900 dark:text-[#F2F4F8]'
                }`}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className={`text-xs mt-0.5 ${
                  isSolid
                    ? 'text-white/75'
                    : 'text-slate-500 dark:text-[#9AA0AE]'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className={noPadding ? '' : 'p-5'}>{children}</div>

      {footer && (
        <div
          className={`px-5 py-3.5 border-t ${
            isSolid
              ? 'bg-black/10 border-white/10 text-white/90'
              : 'bg-slate-50/80 dark:bg-black/20 border-slate-100 dark:border-white/[0.06]'
          }`}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
