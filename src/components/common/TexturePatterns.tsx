import React from 'react';

/**
 * Global SVG Definitions for Chart & Bar Texture Patterns
 * Conforms to template specifications:
 * - Overdue / Out of Stock: solid black (#0A0C12)
 * - Returns / Low Stock: geometric zig-zag chevrons
 * - In Progress / Dead Stock: speckle noise / stippling
 * - Completed / In Stock: high-contrast linear gradient
 */
export const TexturePatternsDefs: React.FC = () => {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none -z-10" aria-hidden="true">
      <defs>
        {/* Pattern 1: Zig-zag Chevrons (Returns / Low Stock) */}
        <pattern
          id="texture-zigzag"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path
            d="M 0 0 L 8 8 L 16 0 M 0 16 L 8 8 L 16 16"
            fill="none"
            stroke="rgba(0, 0, 0, 0.45)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>

        {/* Pattern 1-Light/White: Zig-zag on Dark Background */}
        <pattern
          id="texture-zigzag-light"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path
            d="M 0 0 L 8 8 L 16 0 M 0 16 L 8 8 L 16 16"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>

        {/* Pattern 2: Speckle Noise / Stipple (In Progress / Dead Stock) */}
        <pattern
          id="texture-speckle"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.2" fill="rgba(0, 0, 0, 0.6)" />
          <circle cx="8" cy="4" r="1.5" fill="rgba(0, 0, 0, 0.5)" />
          <circle cx="4" cy="9" r="1.2" fill="rgba(0, 0, 0, 0.55)" />
          <circle cx="10" cy="10" r="1.4" fill="rgba(0, 0, 0, 0.6)" />
        </pattern>

        <pattern
          id="texture-speckle-light"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.2" fill="rgba(255, 255, 255, 0.6)" />
          <circle cx="8" cy="4" r="1.5" fill="rgba(255, 255, 255, 0.5)" />
          <circle cx="4" cy="9" r="1.2" fill="rgba(255, 255, 255, 0.55)" />
          <circle cx="10" cy="10" r="1.4" fill="rgba(255, 255, 255, 0.6)" />
        </pattern>

        {/* Pattern 3: Diagonal Hatching (Alternative Stipple) */}
        <pattern
          id="texture-diagonal"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(30)"
        >
          <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="3" />
        </pattern>

        {/* Pattern 4: Linear Gradient Bar (Completed / In Stock) */}
        <linearGradient id="texture-blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2A40B5" />
          <stop offset="60%" stopColor="#121838" />
          <stop offset="100%" stopColor="#0A0C14" />
        </linearGradient>

        <linearGradient id="texture-orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7C4B" />
          <stop offset="100%" stopColor="#CC4B1A" />
        </linearGradient>

        {/* Donut Chart Textures */}
        <pattern id="donut-in-stock" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#FFFFFF" />
          <circle cx="5" cy="5" r="2" fill="#E2E8F0" />
        </pattern>

        <pattern id="donut-low-stock" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill="#FFE5D9" />
          <line x1="0" y1="0" x2="12" y2="12" stroke="#FF6B35" strokeWidth="2.5" />
        </pattern>

        <pattern id="donut-dead-stock" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#3D1D12" />
          <circle cx="2" cy="2" r="1" fill="#FF885A" />
          <circle cx="7" cy="7" r="1.2" fill="#FF6B35" />
        </pattern>
      </defs>
    </svg>
  );
};
