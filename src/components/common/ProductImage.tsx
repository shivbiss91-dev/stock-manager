import React, { useState, useEffect } from 'react';
import { Package, ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  containerClassName?: string;
  fallbackIconSize?: number;
}

/**
 * Normalizes relative URLs so they work across both root hosting and subpath hosting (e.g. GitHub Pages /stock-manager/).
 */
export function normalizeProductImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();

  // If already absolute or base64 data URI, return as-is
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Handle leading slash for GitHub Pages or relative base paths
  const base = import.meta.env.BASE_URL || './';
  if (trimmed.startsWith('/')) {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}${trimmed}`;
  }

  return trimmed;
}

/**
 * Returns a fallback default SVG based on product category.
 */
export function getCategoryFallbackSvg(category?: string | null): string {
  const norm = (category || '').toLowerCase().replace(/[\s-]/g, '_');
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;

  switch (norm) {
    case 'card_holder':
      return `${cleanBase}/products/card-holder.svg`;
    case 'lanyard':
      return `${cleanBase}/products/lanyard.svg`;
    case 'hook':
      return `${cleanBase}/products/hook.svg`;
    case 'button_bag':
      return `${cleanBase}/products/button-bag.svg`;
    default:
      return '';
  }
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  category,
  className = 'w-10 h-10 rounded-lg object-cover',
  containerClassName = '',
  fallbackIconSize = 18,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedSrc = normalizeProductImageUrl(src);

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // If no source image or image failed to load
  if (!normalizedSrc || hasError) {
    const categoryFallback = getCategoryFallbackSvg(category);

    // If we have a category fallback and hasn't errored on that
    if (categoryFallback && !hasError && !src) {
      return (
        <img
          src={categoryFallback}
          alt={alt}
          className={`${className} bg-slate-900/60 border border-slate-700/40`}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      );
    }

    // Professional SVG placeholder: Dark theme with subtle orange accent, zero broken icons
    return (
      <div
        className={`${className} ${containerClassName} bg-slate-900/80 border border-slate-700/50 flex flex-col items-center justify-center text-slate-400 select-none flex-shrink-0 overflow-hidden relative group`}
        title={alt ? `${alt} (No Image)` : 'No Product Image'}
      >
        <Package
          style={{ width: fallbackIconSize, height: fallbackIconSize }}
          className="text-accent-orange/70 flex-shrink-0"
        />
        <span className="text-[8px] font-bold tracking-wider text-slate-500 uppercase mt-0.5 leading-none">
          No Img
        </span>
      </div>
    );
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className={`${className} bg-slate-900/40 border border-slate-700/40 flex-shrink-0`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};
