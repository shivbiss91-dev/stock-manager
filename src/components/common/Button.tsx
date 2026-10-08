import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'blue' | 'teal' | 'orange' | 'outline' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-xs md:text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-sm md:text-base px-5 py-2.5 gap-2.5 h-12',
    icon: 'w-10 h-10 p-2 rounded-xl flex items-center justify-center flex-shrink-0',
  };

  const variantStyles = {
    primary:
      'bg-[#FF6B35] hover:bg-[#FF7C4B] text-white dark:text-slate-950 font-bold shadow-glow-orange border border-white/10',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-[#1A1D26] dark:hover:bg-[#232733] dark:text-[#F2F4F8] border border-slate-200 dark:border-white/[0.08]',
    blue:
      'bg-[#3B5BFF] hover:bg-[#4E6BFF] text-white font-semibold shadow-glow-blue border border-white/10',
    teal:
      'bg-[#0E8F83] hover:bg-[#13B2A4] text-white font-semibold shadow-sm',
    orange:
      'bg-[#FF6B35] hover:bg-[#FF7C4B] text-white font-semibold shadow-glow-orange',
    outline:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-[#F2F4F8] border border-slate-300 dark:border-white/10',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-[#9AA0AE] hover:text-white',
    danger:
      'bg-[#FF4D4F] hover:bg-rose-600 text-white shadow-sm',
    icon:
      'bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1D26] dark:hover:bg-[#252936] text-slate-700 dark:text-[#F2F4F8] border border-slate-200 dark:border-white/[0.08]',
  };

  const computedSize = size === 'icon' || variant === 'icon' ? 'icon' : size;

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[computedSize]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
