import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  collapsed?: boolean;
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  collapsed = false,
  className = '',
  showTagline = true,
}) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 42 : 34;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Template-styled Isometric Orange 3D Cube Mark */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="cubeTop" x1="20" y1="4" x2="20" y2="18" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA07A" />
              <stop offset="100%" stopColor="#FF6B35" />
            </linearGradient>
            <linearGradient id="cubeLeft" x1="6" y1="14" x2="20" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#D94814" />
            </linearGradient>
            <linearGradient id="cubeRight" x1="20" y1="18" x2="34" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E05520" />
              <stop offset="100%" stopColor="#A82E05" />
            </linearGradient>
            <filter id="cubeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#FF6B35" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Top Face */}
          <path
            d="M 20 5 L 33 13 L 20 20 L 7 13 Z"
            fill="url(#cubeTop)"
            filter="url(#cubeGlow)"
          />

          {/* Left Face */}
          <path
            d="M 7 13 L 20 20 L 20 35 L 7 27 Z"
            fill="url(#cubeLeft)"
          />

          {/* Right Face */}
          <path
            d="M 20 20 L 33 13 L 33 27 L 20 35 Z"
            fill="url(#cubeRight)"
          />

          {/* Internal Accent Geometry */}
          <path
            d="M 20 20 L 20 35 M 20 20 L 7 13 M 20 20 L 33 13"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!collapsed && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-900 dark:text-[#F2F4F8] text-lg font-sans">
              StockVista
            </span>
            <span className="text-[9.5px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30">
              IND
            </span>
          </div>
          {showTagline && (
            <span className="text-[10px] font-medium text-slate-500 dark:text-[#9AA0AE] tracking-tight mt-0.5">
              Smart Inventory. Strong Business.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
