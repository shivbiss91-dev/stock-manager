import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AddItemModal } from './AddItemModal';
import { QuickStockAdjustmentModal } from './QuickStockAdjustmentModal';
import { inventoryService } from '../../services/inventoryService';
import { ComputedInventoryItem, MaterialCategory } from '../../types/inventory';
import { StockStatus } from '../../types/common';
import { formatINR } from '../../utils/formatINR';
import { formatPackagingBreakdown } from '../../utils/unitConversions';
import { MATERIAL_CATEGORIES } from '../../data/materialCategories';
import { supplierService } from '../../services/supplierService';
import { warehouseService } from '../../services/warehouseService';
import { Supplier } from '../../types/sales';
import { Warehouse } from '../../types/warehouse';
import {
  Search,
  Plus,
  Minus,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  ShoppingCart,
  Zap,
  RotateCcw,
  Box,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductListTableCardProps {
  warehouseId: string;
  statusFilter: StockStatus | 'all';
  onStatusFilterChange: (status: StockStatus | 'all') => void;
}

export const ProductListTableCard: React.FC<ProductListTableCardProps> = ({
  warehouseId,
  statusFilter,
  onStatusFilterChange,
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ComputedInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStorageWh, setSelectedStorageWh] = useState<string>('all');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    supplierService.getSuppliers().then(setSuppliers);
    warehouseService.getWarehouses().then(setWarehouses);
  }, []);

  // Selection & Row Click Fade
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [activeFadedRowId, setActiveFadedRowId] = useState<string | null>(null);

  // Modals & Popovers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustmentItem, setAdjustmentItem] = useState<ComputedInventoryItem | null>(null);
  const [adjustmentMode, setAdjustmentMode] = useState<'add' | 'deduct' | 'direct'>('add');
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    product: true,
    supplier: true,
    category: true,
    cost: true,
    onHand: true,
    onHandValue: true,
    demand: true,
    status: true,
    actions: true,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeWarehouse = selectedStorageWh !== 'all' ? selectedStorageWh : warehouseId;
      const res = await inventoryService.getItems({
        warehouseId: activeWarehouse,
        category: selectedCategory,
        supplierId: selectedSupplier,
        stockStatus: statusFilter,
        search: searchQuery,
        page,
        pageSize,
        sortBy: 'name',
      });
      setItems(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [warehouseId, statusFilter, selectedCategory, selectedSupplier, selectedStorageWh, searchQuery]);

  useEffect(() => {
    loadData();
  }, [warehouseId, statusFilter, selectedCategory, selectedSupplier, selectedStorageWh, searchQuery, page, pageSize]);

  // Select all checkbox toggle
  const allSelected = items.length > 0 && items.every((i) => selectedRowIds[i.id]);
  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedRowIds({});
    } else {
      const next: Record<string, boolean> = {};
      items.forEach((i) => {
        next[i.id] = true;
      });
      setSelectedRowIds(next);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRowClick = (item: ComputedInventoryItem) => {
    setActiveFadedRowId(item.id);
    setTimeout(() => {
      setActiveFadedRowId(null);
    }, 600);
  };

  // Export handlers
  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    setExportMenuOpen(false);
    const headers = [
      'SKU',
      'Product Name',
      'Supplier',
      'Category',
      'Cost (INR)',
      'On Hand',
      'Unit',
      'Packaging Breakdown',
      'On-Hand Value (INR)',
      'Demand Velocity',
      'Status',
    ];

    const rows = items.map((i) => [
      `"${i.sku}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.supplierName}"`,
      i.materialCategory,
      i.costPrice,
      i.currentStock,
      i.unit,
      `"${formatPackagingBreakdown(i.currentStock, i.packagingConversions)}"`,
      i.costPrice * i.currentStock,
      i.salesVelocity,
      i.stockStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockVista_Catalog_${format.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            In Stock
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            Low Stock
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
            Out of Stock
          </span>
        );
      case 'dead_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            Dead Stock
          </span>
        );
    }
  };

  const getDemandBadge = (velocity: 'High' | 'Medium' | 'Low') => {
    if (velocity === 'High') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#3B5BFF]/15 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/30">
          <Zap className="w-3 h-3 flex-shrink-0" fill="currentColor" />
          <span>High</span>
        </span>
      );
    }
    if (velocity === 'Medium') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-brand-orange/15 text-brand-orange border border-brand-orange/30">
        Low
      </span>
    );
  };

  return (
    <Card
      variant="glass"
      noPadding
      className="p-5 overflow-hidden flex flex-col justify-between"
    >
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
            Product List
          </h3>
          <p className="text-xs text-slate-400 dark:text-[#9AA0AE]">
            Wholesale inventory catalog with automated live on-hand valuation
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Column Settings Button */}
          <button
            onClick={() => setColumnSettingsOpen(!columnSettingsOpen)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all"
            title="Configure columns"
            aria-label="Column settings"
          >
            <SlidersHorizontal className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-[#F2F4F8] text-xs font-semibold flex items-center gap-2 transition-all"
              title="Export filtered records"
            >
              <Download className="w-4 h-4 text-brand-orange" strokeWidth={1.5} />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white dark:bg-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-1.5 z-40">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-brand-orange" />
                  <span>Export to CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Export to Excel</span>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 text-slate-700 dark:text-[#F2F4F8] hover:bg-slate-100 dark:hover:bg-white/5 transition-colors font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>Export to PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Item Primary Orange Button */}
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" strokeWidth={2} />}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Toolbar Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mb-4">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU or description..."
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-[#F2F4F8] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory | 'all')}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-[#12151D]">All Material Categories</option>
            {MATERIAL_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-[#12151D]">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Supplier Filter */}
        <div>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-[#12151D]">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id} className="bg-white dark:bg-[#12151D]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Storage / Rack Filter */}
        <div>
          <select
            value={selectedStorageWh}
            onChange={(e) => setSelectedStorageWh(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-[#12151D]">All Storage Hubs</option>
            {warehouses.filter((w) => w.id !== 'all').map((w) => (
              <option key={w.id} value={w.id} className="bg-white dark:bg-[#12151D]">
                {w.code} - {w.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="text-slate-400">Filtering by Stock:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-orange/15 text-brand-orange font-bold border border-brand-orange/30">
            <span>{statusFilter.replace(/_/g, ' ').toUpperCase()}</span>
            <button
              onClick={() => onStatusFilterChange('all')}
              className="hover:scale-125 transition-transform"
              title="Clear filter"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Column Visibility Settings Panel */}
      {columnSettingsOpen && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] text-xs mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-bold text-slate-900 dark:text-[#F2F4F8]">
              Visible Table Columns
            </span>
            <button
              onClick={() => setColumnSettingsOpen(false)}
              className="text-xs text-brand-orange font-semibold hover:underline"
            >
              Done
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {Object.entries(visibleColumns).map(([key, isVis]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer capitalize">
                <input
                  type="checkbox"
                  checked={isVis}
                  onChange={(e) =>
                    setVisibleColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35]"
                />
                <span className="text-slate-700 dark:text-[#9AA0AE]">{key}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table Container with Sticky Header */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/[0.08] max-h-[580px] relative">
        <table className="w-full text-left text-xs divide-y divide-slate-200/80 dark:divide-white/[0.06]">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#12151D] text-slate-500 dark:text-[#9AA0AE] uppercase tracking-wider font-semibold select-none shadow-sm backdrop-blur-md">
            <tr>
              {visibleColumns.select && (
                <th className="px-3.5 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35] cursor-pointer"
                    aria-label="Select all items"
                  />
                </th>
              )}
              {visibleColumns.product && <th className="px-4 py-3">Product Name & SKU</th>}
              {visibleColumns.supplier && <th className="px-4 py-3">Supplier</th>}
              {visibleColumns.category && <th className="px-4 py-3">Category</th>}
              {visibleColumns.cost && <th className="px-4 py-3 text-right">Cost (₹)</th>}
              {visibleColumns.onHand && <th className="px-4 py-3 text-right">On Hand</th>}
              {visibleColumns.onHandValue && (
                <th className="px-4 py-3 text-right">On-Hand Value (₹)</th>
              )}
              {visibleColumns.demand && <th className="px-4 py-3 text-center">Demand</th>}
              {visibleColumns.status && <th className="px-4 py-3 text-center">Status</th>}
              {visibleColumns.actions && <th className="px-4 py-3 text-right">Action</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] bg-white dark:bg-[#0B0D14]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-4 py-4">
                    <div className="h-4 bg-slate-200 dark:bg-white/[0.05] rounded-xl animate-pulse" />
                  </td>
                </tr>
              ))
            ) : totalCount === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-3">
                      <Box className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-[#F2F4F8]">
                      No products added yet.
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-[#9AA0AE] mt-1 mb-4">
                      Start building your inventory by adding your first product.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setIsAddModalOpen(true)}
                      leftIcon={<Plus className="w-4 h-4" strokeWidth={2} />}
                    >
                      Add New Item
                    </Button>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                  No items match the selected filter criteria.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = !!selectedRowIds[item.id];
                const isFading = activeFadedRowId === item.id;
                // Strict rule: On-hand value = costPrice * currentStock
                const onHandValueINR = item.costPrice * item.currentStock;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isFading
                        ? 'opacity-40 bg-brand-orange/10'
                        : isSelected
                        ? 'bg-brand-orange/5 dark:bg-brand-orange/10'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Checkbox */}
                    {visibleColumns.select && (
                      <td
                        className="px-3.5 py-3 text-center"
                        onClick={(e) => handleToggleRow(item.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35] cursor-pointer"
                          aria-label={`Select item ${item.name}`}
                        />
                      </td>
                    )}

                    {/* Thumbnail + Name + SKU */}
                    {visibleColumns.product && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0 text-brand-orange">
                            <Box className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <p
                              className="font-bold text-slate-900 dark:text-[#F2F4F8] truncate"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <span className="font-mono text-[10.5px] text-brand-orange font-semibold block">
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Supplier */}
                    {visibleColumns.supplier && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-[#9AA0AE]">
                        <span className="truncate max-w-[140px] block" title={item.supplierName}>
                          {item.supplierName}
                        </span>
                      </td>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="capitalize font-semibold text-slate-800 dark:text-[#F2F4F8]">
                          {item.materialCategory}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.materialSubtype}
                        </span>
                      </td>
                    )}

                    {/* Cost (₹) */}
                    {visibleColumns.cost && (
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-[#F2F4F8] whitespace-nowrap">
                        {formatINR(item.costPrice)}
                      </td>
                    )}

                    {/* On Hand with Manual +/- Controls and Direct Edit */}
                    {visibleColumns.onHand && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {/* Manual Minus (-) Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentItem(item);
                              setAdjustmentMode('deduct');
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors border border-rose-500/20"
                            title="Deduct Stock (-)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          {/* Stock Number (Clickable for Direct Edit) */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentItem(item);
                              setAdjustmentMode('direct');
                            }}
                            className="text-right font-extrabold text-slate-900 dark:text-white hover:text-accent-orange transition-colors px-1"
                            title="Click to directly calibrate stock count"
                          >
                            {item.currentStock.toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal text-slate-400">
                              {item.unit}
                            </span>
                          </button>

                          {/* Manual Plus (+) Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustmentItem(item);
                              setAdjustmentMode('add');
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                            title="Add Stock (+)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* On-hand Value (₹ = Cost × On Hand) */}
                    {visibleColumns.onHandValue && (
                      <td className="px-4 py-3 text-right font-extrabold text-brand-orange whitespace-nowrap">
                        {formatINR(onHandValueINR)}
                      </td>
                    )}

                    {/* Demand Status */}
                    {visibleColumns.demand && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getDemandBadge(item.salesVelocity)}
                      </td>
                    )}

                    {/* Stock Status Pill */}
                    {visibleColumns.status && (
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.stockStatus)}
                      </td>
                    )}

                    {/* Actions: View, Edit, Reorder */}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* View */}
                          <button
                            onClick={() => navigate(`/items/${item.id}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                            title="View item details & analytics"
                          >
                            <Eye className="w-4 h-4" strokeWidth={1.5} />
                          </button>

                          {/* Edit / Quick Adjust */}
                          <button
                            onClick={() => {
                              setAdjustmentItem(item);
                              setAdjustmentMode('direct');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-orange hover:bg-white/10 transition-colors"
                            title="Quick Stock Adjustment & Calibration"
                          >
                            <Edit className="w-4 h-4" strokeWidth={1.5} />
                          </button>

                          {/* Reorder Quick Action */}
                          <button
                            onClick={() => navigate('/purchases/orders')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#3B5BFF] hover:bg-white/10 transition-colors"
                            title="Create Purchase Reorder"
                          >
                            <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-2.5 py-1 text-slate-800 dark:text-[#F2F4F8] focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-colors text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={loadData}
      />

      {/* Quick Stock Adjustment Modal */}
      <QuickStockAdjustmentModal
        item={adjustmentItem}
        isOpen={!!adjustmentItem}
        initialMode={adjustmentMode}
        onClose={() => setAdjustmentItem(null)}
        onSuccess={loadData}
      />
    </Card>
  );
};
