import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ComputedInventoryItem } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { useUIStore } from '../../store/uiStore';
import { Heart, TrendingUp, TrendingDown, Eye, MapPin } from 'lucide-react';

interface ItemCardProps {
  item: ComputedInventoryItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  viewMode,
  isSelected,
  onToggleSelect,
}) => {
  const navigate = useNavigate();
  const { isFavourite, toggleFavourite } = useUIStore();
  const isFav = isFavourite(item.id);

  const getStatusColor = (status: ComputedInventoryItem['stockStatus']) => {
    switch (status) {
      case 'in_stock':
        return { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'In Stock' };
      case 'low_stock':
        return { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Low Stock' };
      case 'out_of_stock':
        return { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', label: 'Out of Stock' };
      case 'dead_stock':
        return { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400', label: 'Dead Stock' };
    }
  };

  const statusConfig = getStatusColor(item.stockStatus);

  // Render mini 30-day velocity sparkline
  const renderSparkline = () => {
    const isHigh = item.salesVelocity === 'High';
    const isLow = item.salesVelocity === 'Low';
    const points = isHigh
      ? '0,18 15,14 30,12 45,8 60,4'
      : isLow
      ? '0,6 15,8 30,14 45,16 60,18'
      : '0,14 15,10 30,12 45,11 60,10';

    return (
      <div className="flex items-center gap-1.5">
        <svg width="48" height="20" className="overflow-visible">
          <polyline
            fill="none"
            stroke={isHigh ? '#10B981' : isLow ? '#EF4444' : '#3B82F6'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
        <span
          className={`text-[10.5px] font-bold ${
            isHigh
              ? 'text-emerald-600 dark:text-emerald-400'
              : isLow
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {item.salesVelocity}
        </span>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
          isSelected
            ? 'bg-accent-orange/10 border-accent-orange ring-1 ring-accent-orange'
            : 'template-card border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 shadow-soft'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="rounded border-slate-300 dark:border-white/20 text-accent-orange focus:ring-accent-orange w-4 h-4 bg-transparent cursor-pointer"
          />

          <img
            src={item.images[0]}
            alt={item.name}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-white/[0.05]"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-accent-blue dark:text-accent-orange">
                {item.sku}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-white/[0.06]">
                {item.materialSubtype}
              </span>
            </div>
            <h4
              onClick={() => navigate(`/items/${item.id}`)}
              className="text-xs font-bold text-slate-900 dark:text-white truncate hover:underline cursor-pointer max-w-md mt-0.5"
              title={item.name}
            >
              {item.name}
            </h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span>HSN: {item.hsnCode}</span>
              <span>•</span>
              <span>Rack: {item.rackLocation}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Stock */}
          <div className="text-right">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
              {item.currentStock.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-400">{item.unit}</span>
            </span>
            <div className="flex items-center justify-end gap-1.5 text-[10.5px]">
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              <span className={statusConfig.text}>{statusConfig.label}</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right w-24">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
              {formatINR(item.sellingPrice)}
            </span>
            <span className="text-[10px] text-slate-400">GST {item.gstRate}%</span>
          </div>

          {/* Velocity Sparkline */}
          <div className="hidden lg:block">{renderSparkline()}</div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavourite(item.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isFav
                  ? 'border-rose-500/20 text-rose-500 bg-rose-500/10'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
              title={isFav ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => navigate(`/items/${item.id}`)}
              className="px-3 py-1.5 rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white text-xs font-bold transition-all shadow-sm"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid Card Mode
  return (
    <div
      className={`group relative rounded-[20px] border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-soft hover:shadow-lg ${
        isSelected
          ? 'bg-accent-orange/10 border-accent-orange ring-1 ring-accent-orange'
          : 'template-card border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10'
      }`}
    >
      {/* Thumbnail Header with Overlays */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-900">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

        {/* Top Floating Controls */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="rounded border-white/60 text-brand-teal focus:ring-brand-teal w-4 h-4 cursor-pointer shadow"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavourite(item.id);
            }}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
              isFav
                ? 'bg-rose-500 text-white'
                : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'
            }`}
            title={isFav ? 'Remove from favourites' : 'Save to favourites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Bottom Thumbnail Overlays: SKU & Status */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
            {item.sku}
          </span>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            {item.materialSubtype}
          </span>
          <h4
            onClick={() => navigate(`/items/${item.id}`)}
            className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:underline cursor-pointer"
            title={item.name}
          >
            {item.name}
          </h4>
        </div>

        {/* Stock & Price Metric Row */}
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Current Stock</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {item.currentStock.toLocaleString('en-IN')}{' '}
              <span className="text-[10.5px] font-normal text-slate-400">{item.unit}</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Wholesale Rate</span>
            <span className="font-extrabold text-slate-900 dark:text-accent-orange text-sm">
              {formatINR(item.sellingPrice)}
            </span>
          </div>
        </div>

        {/* 30-day velocity sparkline & View Details CTA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-slate-400 block">30d Velocity</span>
            {renderSparkline()}
          </div>

          <button
            onClick={() => navigate(`/items/${item.id}`)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-accent-orange hover:text-white dark:hover:bg-accent-orange dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
