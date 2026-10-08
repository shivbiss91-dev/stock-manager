import React, { useState } from 'react';
import { StockStatus } from '../../types/common';
import { SalesVelocity } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { MOCK_SUPPLIERS } from '../../data/suppliers';
import { MOCK_WAREHOUSES } from '../../data/warehouses';
import { ChevronDown, ChevronUp, RotateCcw, Filter } from 'lucide-react';

export interface FilterState {
  subtypes: string[];
  stockStatuses: StockStatus[];
  minPrice: number;
  maxPrice: number;
  supplierId: string;
  warehouseId: string;
  velocity: SalesVelocity | 'all';
}

interface MaterialFilterPanelProps {
  availableSubtypes: string[];
  subtypeCounts: Record<string, number>;
  statusCounts: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    deadStock: number;
    total: number;
  };
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  priceBounds: { min: number; max: number };
}

export const MaterialFilterPanel: React.FC<MaterialFilterPanelProps> = ({
  availableSubtypes,
  subtypeCounts,
  statusCounts,
  filters,
  onFilterChange,
  onReset,
  priceBounds,
}) => {
  // Collapsible section toggles
  const [openSections, setOpenSections] = useState({
    subtypes: true,
    price: true,
    stock: true,
    warehouse: true,
    supplier: false,
    velocity: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubtypeToggle = (subtype: string) => {
    const next = filters.subtypes.includes(subtype)
      ? filters.subtypes.filter((s) => s !== subtype)
      : [...filters.subtypes, subtype];
    onFilterChange({ ...filters, subtypes: next });
  };

  const handleStatusToggle = (status: StockStatus) => {
    const next = filters.stockStatuses.includes(status)
      ? filters.stockStatuses.filter((s) => s !== status)
      : [...filters.stockStatuses, status];
    onFilterChange({ ...filters, stockStatuses: next });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(priceBounds.min, parseInt(e.target.value) || priceBounds.min);
    onFilterChange({ ...filters, minPrice: Math.min(val, filters.maxPrice) });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(priceBounds.max, parseInt(e.target.value) || priceBounds.max);
    onFilterChange({ ...filters, maxPrice: Math.max(val, filters.minPrice) });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    onFilterChange({ ...filters, maxPrice: val });
  };

  return (
    <div className="w-full space-y-4 text-xs select-none">
      {/* Filter Header & Reset Trigger */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
          <Filter className="w-3.5 h-3.5 text-accent-orange" />
          <span>Catalog Filters</span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-semibold text-accent-orange hover:underline"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* 1. Material Sub-Types Section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <button
          onClick={() => toggleSection('subtypes')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Material Sub-Types</span>
          {openSections.subtypes ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.subtypes && (
          <div className="space-y-1.5 pt-1">
            {availableSubtypes.map((st) => {
              const isChecked = filters.subtypes.includes(st);
              const count = subtypeCounts[st] || 0;
              return (
                <label
                  key={st}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleSubtypeToggle(st)}
                      className="rounded border-slate-300 dark:border-white/20 text-accent-orange focus:ring-accent-orange w-3.5 h-3.5 bg-transparent"
                    />
                    <span className="truncate max-w-[130px]">{st}</span>
                  </div>
                  <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 font-mono">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Price Range (₹) Section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Price Range (₹)</span>
          {openSections.price ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.price && (
          <div className="space-y-3 pt-1">
            {/* Range Slider */}
            <div>
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={filters.maxPrice}
                onChange={handleSliderChange}
                className="w-full accent-accent-orange cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>{formatINR(priceBounds.min, { showDecimals: false })}</span>
                <span className="font-bold text-slate-900 dark:text-accent-orange">
                  Up to {formatINR(filters.maxPrice, { showDecimals: false })}
                </span>
                <span>{formatINR(priceBounds.max, { showDecimals: false })}</span>
              </div>
            </div>

            {/* Min / Max Inputs Synced */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Min ₹</span>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={handleMinPriceChange}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] template-input px-2.5 py-1.5 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Max ₹</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={handleMaxPriceChange}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] template-input px-2.5 py-1.5 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Stock Status Section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <button
          onClick={() => toggleSection('stock')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Stock Status</span>
          {openSections.stock ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.stock && (
          <div className="space-y-1.5 pt-1">
            {[
              { id: 'in_stock' as const, label: 'In Stock', count: statusCounts.inStock, dotColor: 'bg-emerald-500' },
              { id: 'low_stock' as const, label: 'Low Stock', count: statusCounts.lowStock, dotColor: 'bg-amber-500' },
              { id: 'out_of_stock' as const, label: 'Out of Stock', count: statusCounts.outOfStock, dotColor: 'bg-rose-500' },
              { id: 'dead_stock' as const, label: 'Dead Stock (>90d)', count: statusCounts.deadStock, dotColor: 'bg-violet-500' },
            ].map((item) => {
              const isChecked = filters.stockStatuses.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleStatusToggle(item.id)}
                      className="rounded border-slate-300 dark:border-white/20 text-accent-orange focus:ring-accent-orange w-3.5 h-3.5 bg-transparent"
                    />
                    <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10.5px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 font-mono">
                    {item.count}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Warehouse / Rack Section */}
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <button
          onClick={() => toggleSection('warehouse')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Warehouse Facility</span>
          {openSections.warehouse ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.warehouse && (
          <div className="pt-1">
            <select
              value={filters.warehouseId}
              onChange={(e) => onFilterChange({ ...filters, warehouseId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] template-input px-2.5 py-1.5 text-slate-900 dark:text-white dark:bg-dark-card"
            >
              <option value="all" className="dark:bg-dark-card">All Hubs (Consolidated)</option>
              {MOCK_WAREHOUSES.filter((w) => w.id !== 'all').map((w) => (
                <option key={w.id} value={w.id} className="dark:bg-dark-card">
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. Supplier Filter */}
      <div className="space-y-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
        <button
          onClick={() => toggleSection('supplier')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Primary Supplier</span>
          {openSections.supplier ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.supplier && (
          <div className="pt-1">
            <select
              value={filters.supplierId}
              onChange={(e) => onFilterChange({ ...filters, supplierId: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] template-input px-2.5 py-1.5 text-slate-900 dark:text-white dark:bg-dark-card"
            >
              <option value="all" className="dark:bg-dark-card">All Suppliers</option>
              {MOCK_SUPPLIERS.slice(0, 20).map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-dark-card">
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 6. Sales Velocity Filter */}
      <div className="space-y-2 pb-1">
        <button
          onClick={() => toggleSection('velocity')}
          className="w-full flex items-center justify-between font-bold text-slate-900 dark:text-white"
        >
          <span>Sales Velocity</span>
          {openSections.velocity ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {openSections.velocity && (
          <div className="space-y-1 pt-1">
            {['all', 'High', 'Medium', 'Low'].map((v) => (
              <label
                key={v}
                className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
              >
                <input
                  type="radio"
                  name="sales_velocity"
                  checked={filters.velocity === v}
                  onChange={() => onFilterChange({ ...filters, velocity: v as SalesVelocity | 'all' })}
                  className="rounded-full border-slate-300 dark:border-white/20 text-accent-orange focus:ring-accent-orange bg-transparent"
                />
                <span className="capitalize">{v === 'all' ? 'All Velocities' : `${v} Velocity`}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
