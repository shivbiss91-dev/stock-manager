import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MaterialCategory, ComputedInventoryItem, SalesVelocity } from '../../types/inventory';
import { StockStatus } from '../../types/common';
import { MATERIAL_CATEGORIES } from '../../data/materialCategories';
import { inventoryService } from '../../services/inventoryService';
import { useUIStore } from '../../store/uiStore';
import { MaterialFilterPanel, FilterState } from '../../components/materials/MaterialFilterPanel';
import { ItemCard } from '../../components/materials/ItemCard';
import { ExportCategoryModal } from '../../components/materials/ExportCategoryModal';
import { BulkActionsBar } from '../../components/materials/BulkActionsBar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Zap,
} from 'lucide-react';

export const MaterialCategoryPage: React.FC = () => {
  const { materialId } = useParams<{ materialId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedWarehouseId } = useUIStore();

  const currentCategory = useMemo(() => {
    return (
      MATERIAL_CATEGORIES.find((c) => c.id === materialId) ||
      MATERIAL_CATEGORIES[0]
    );
  }, [materialId]);

  // View mode (Grid vs List) with localStorage persistence
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('stockvista_category_view');
    return saved === 'list' ? 'list' : 'grid';
  });

  // Virtualized Mode toggle (for testing 1000+ smooth scroll)
  const [isVirtualized, setIsVirtualized] = useState(false);

  // Left Filter Panel mobile/desktop toggle
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Multi-select for bulk actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  // Quick Tab state: 'all' | 'low_stock' | 'high_velocity' | 'out_of_stock' | 'dead_stock'
  const activeTab = searchParams.get('tab') || 'all';

  // Parse filters from URL search params
  const filters: FilterState = useMemo(() => {
    const subtypesParam = searchParams.get('subtypes');
    const statusParam = searchParams.get('status');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const supplierParam = searchParams.get('supplier');
    const whParam = searchParams.get('wh');
    const velParam = searchParams.get('vel');

    return {
      subtypes: subtypesParam ? subtypesParam.split(',') : [],
      stockStatuses: statusParam ? (statusParam.split(',') as StockStatus[]) : [],
      minPrice: minPriceParam ? parseInt(minPriceParam) : 400,
      maxPrice: maxPriceParam ? parseInt(maxPriceParam) : 25000,
      supplierId: supplierParam || 'all',
      warehouseId: whParam || selectedWarehouseId || 'all',
      velocity: (velParam as SalesVelocity | 'all') || 'all',
    };
  }, [searchParams, selectedWarehouseId]);

  // Pagination state
  const currentPage = parseInt(searchParams.get('page') || '1');
  const [pageSize, setPageSize] = useState(12);

  // Sorting
  const sortBy = searchParams.get('sortBy') || 'name';

  // Items dataset state
  const [items, setItems] = useState<ComputedInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Subtype live counts
  const [subtypeCounts, setSubtypeCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState({
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    deadStock: 0,
    total: 0,
  });

  // Debounce search input by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      updateUrlParam('q', searchInput.trim() || null);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Helper to update specific search params in URL
  const updateUrlParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Always reset to page 1 on filter changes unless changing page itself
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (tab: string) => {
    updateUrlParam('tab', tab === 'all' ? null : tab);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    const next = new URLSearchParams(searchParams);

    if (newFilters.subtypes.length > 0) {
      next.set('subtypes', newFilters.subtypes.join(','));
    } else {
      next.delete('subtypes');
    }

    if (newFilters.stockStatuses.length > 0) {
      next.set('status', newFilters.stockStatuses.join(','));
    } else {
      next.delete('status');
    }

    if (newFilters.minPrice > 400) {
      next.set('minPrice', String(newFilters.minPrice));
    } else {
      next.delete('minPrice');
    }

    if (newFilters.maxPrice < 25000) {
      next.set('maxPrice', String(newFilters.maxPrice));
    } else {
      next.delete('maxPrice');
    }

    if (newFilters.supplierId !== 'all') {
      next.set('supplier', newFilters.supplierId);
    } else {
      next.delete('supplier');
    }

    if (newFilters.warehouseId !== 'all') {
      next.set('wh', newFilters.warehouseId);
    } else {
      next.delete('wh');
    }

    if (newFilters.velocity !== 'all') {
      next.set('vel', newFilters.velocity);
    } else {
      next.delete('vel');
    }

    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    if (searchInput) next.set('q', searchInput);
    setSearchParams(next, { replace: true });
  };

  const handleViewModeToggle = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('stockvista_category_view', mode);
  };

  // Load items matching current filters
  const loadCategoryItems = async () => {
    setIsLoading(true);
    try {
      // Determine effective stock status from tab or filter panel
      let effectiveStatus: StockStatus | 'all' = 'all';
      if (activeTab === 'low_stock') effectiveStatus = 'low_stock';
      else if (activeTab === 'out_of_stock') effectiveStatus = 'out_of_stock';
      else if (activeTab === 'dead_stock') effectiveStatus = 'dead_stock';
      else if (filters.stockStatuses.length === 1) effectiveStatus = filters.stockStatuses[0];

      // Determine effective velocity
      const effectiveVelocity: SalesVelocity | 'all' =
        activeTab === 'high_velocity' ? 'High' : filters.velocity;

      const res = await inventoryService.getItems({
        category: currentCategory.id,
        warehouseId: filters.warehouseId !== 'all' ? filters.warehouseId : selectedWarehouseId,
        subtype: filters.subtypes.length === 1 ? filters.subtypes[0] : undefined,
        stockStatus: effectiveStatus,
        supplierId: filters.supplierId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        salesVelocity: effectiveVelocity,
        search: debouncedSearch,
        page: isVirtualized ? 1 : currentPage,
        pageSize: isVirtualized ? 500 : pageSize,
        sortBy: 'name',
      });

      // Compute live subtype counts
      const countsMap: Record<string, number> = {};
      currentCategory.subtypes.forEach((st) => {
        countsMap[st] = 0;
      });

      // Fetch global category counts for subtype badges
      const masterRes = await inventoryService.getItems({
        category: currentCategory.id,
        warehouseId: filters.warehouseId !== 'all' ? filters.warehouseId : selectedWarehouseId,
        pageSize: 5000,
      });

      masterRes.items.forEach((item) => {
        countsMap[item.materialSubtype] = (countsMap[item.materialSubtype] || 0) + 1;
      });

      setSubtypeCounts(countsMap);
      setStatusCounts(masterRes.statusCounts);
      setItems(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryItems();
  }, [
    currentCategory.id,
    selectedWarehouseId,
    searchParams.toString(),
    debouncedSearch,
    currentPage,
    pageSize,
    isVirtualized,
  ]);

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedItemIds(items.map((i) => i.id));
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  // Virtualized list container ref and virtualizer
  const virtualParentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => virtualParentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  return (
    <div className="space-y-6">
      {/* Category Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 template-card p-6 rounded-[20px] border border-slate-200 dark:border-white/[0.06] shadow-soft">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/materials"
              className="text-xs font-semibold text-accent-orange hover:underline uppercase tracking-wider"
            >
              ← Back to All Materials
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Badge variant="teal" size="sm">
              HSN {currentCategory.defaultHsn} ({currentCategory.defaultGstRate}% GST)
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentCategory.name} Catalog
            </h1>
            <span className="px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange font-mono font-extrabold text-sm border border-accent-orange/20">
              {totalCount.toLocaleString('en-IN')} Items
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {currentCategory.description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Category Data
          </Button>

          <Button
            variant={isVirtualized ? 'teal' : 'secondary'}
            size="sm"
            onClick={() => setIsVirtualized(!isVirtualized)}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
            title="Toggle high-performance virtualized scroll mode for 1,000+ items"
          >
            {isVirtualized ? 'Virtual Mode ON' : 'Virtual Mode'}
          </Button>
        </div>
      </div>

      {/* Search & Quick Tabs Header */}
      <div className="space-y-3 template-card p-4 rounded-[20px] border border-slate-200 dark:border-white/[0.06] shadow-soft">
        {/* Top Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by item name, SKU or description… (⌘K)"
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] template-input text-slate-900 dark:text-white placeholder-slate-400 text-sm pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/[0.08] text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Quick Tabs & View Toggles Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quick Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Items', count: statusCounts.total },
              { id: 'low_stock', label: 'Low Stock', count: statusCounts.lowStock },
              { id: 'high_velocity', label: 'High Velocity', count: null },
              { id: 'out_of_stock', label: 'Out of Stock', count: statusCounts.outOfStock },
              { id: 'dead_stock', label: 'Dead Stock (>90d)', count: statusCounts.deadStock },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-accent-orange text-white shadow-sm'
                      : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Toolbar Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showFilterPanel
                  ? 'border-accent-orange text-accent-orange bg-accent-orange/10'
                  : 'border-slate-200 dark:border-white/[0.08] template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showFilterPanel ? 'Hide Filters' : 'Filters'}</span>
            </button>

            {/* Grid vs List Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/[0.08] p-0.5 template-input">
              <button
                onClick={() => handleViewModeToggle('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent-orange text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeToggle('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-accent-orange text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Filter Panel + Catalog Items) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Panel (lg:col-span-3) */}
        {showFilterPanel && (
          <div className="lg:col-span-3 rounded-[20px] template-card border border-slate-200 dark:border-white/[0.06] p-4 shadow-soft sticky top-20">
            <MaterialFilterPanel
              availableSubtypes={currentCategory.subtypes}
              subtypeCounts={subtypeCounts}
              statusCounts={statusCounts}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              priceBounds={{ min: 400, max: 25000 }}
            />
          </div>
        )}

        {/* Right Catalog View (lg:col-span-9 or 12) */}
        <div className={showFilterPanel ? 'lg:col-span-9' : 'lg:col-span-12'}>
          {isLoading ? (
            <div
              className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              } gap-4`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-slate-100 dark:bg-white/[0.02] animate-pulse border border-slate-200/60 dark:border-white/[0.06]"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center rounded-[20px] border-2 border-dashed border-slate-200 dark:border-white/[0.08] template-card p-8">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                No items match your filter selection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Try loosening your price bounds, clearing sub-types or searching another keyword.
              </p>
              <Button variant="primary" size="sm" onClick={handleResetFilters}>
                Reset Category Filters
              </Button>
            </div>
          ) : isVirtualized ? (
            /* High-Performance Virtualized Container for 1,000+ Items */
            <div
              ref={virtualParentRef}
              className="h-[750px] overflow-y-auto border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-2 template-card"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = items[virtualRow.index];
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="p-1.5"
                    >
                      <ItemCard
                        item={item}
                        viewMode="list"
                        isSelected={selectedItemIds.includes(item.id)}
                        onToggleSelect={handleToggleSelect}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Standard Grid / List View with Pagination */
            <div className="space-y-6">
              <div
                className={`grid ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                    : 'grid-cols-1'
                } gap-4`}
              >
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    isSelected={selectedItemIds.includes(item.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 template-card rounded-[20px] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-400 shadow-soft">
                <div className="flex items-center gap-2">
                  <span>Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="rounded-xl border border-slate-200 dark:border-white/[0.08] template-input px-2.5 py-1 text-slate-900 dark:text-white"
                  >
                    <option value={12} className="dark:bg-dark-card">12</option>
                    <option value={24} className="dark:bg-dark-card">24</option>
                    <option value={48} className="dark:bg-dark-card">48</option>
                    <option value={96} className="dark:bg-dark-card">96</option>
                  </select>
                  <span>
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString('en-IN')} items
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span>
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => updateUrlParam('page', String(currentPage - 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] template-input hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers with Ellipsis */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => updateUrlParam('page', String(p))}
                          className={`w-7 h-7 rounded-xl font-bold text-xs transition-colors ${
                            currentPage === p
                              ? 'bg-accent-orange text-white shadow-sm'
                              : 'template-input hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => updateUrlParam('page', String(currentPage + 1))}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] template-input hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-40 transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedItemIds={selectedItemIds}
        totalCount={totalCount}
        onClearSelection={handleClearSelection}
        onSelectAllVisible={handleSelectAllVisible}
        onApplyPriceUpdate={(percent) => {
          alert(`Successfully applied +${percent}% wholesale price adjustment to ${selectedItemIds.length} items.`);
          handleClearSelection();
          loadCategoryItems();
        }}
        onMoveCategory={(newCat) => {
          alert(`Successfully moved ${selectedItemIds.length} items to category: ${newCat}.`);
          handleClearSelection();
          loadCategoryItems();
        }}
        onExportSelected={() => {
          const selectedItems = items.filter((i) => selectedItemIds.includes(i.id));
          const headers = ['SKU', 'Name', 'Stock', 'Rate', 'HSN'];
          const rows = selectedItems.map((i) => [i.sku, i.name, i.currentStock, i.sellingPrice, i.hsnCode]);
          const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `StockVista_BulkSelected_${Date.now()}.csv`);
          link.click();
        }}
        onPrintLabels={() => {
          window.print();
        }}
      />

      {/* Export Category Dataset Modal */}
      <ExportCategoryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        categoryName={currentCategory.name}
        items={items}
      />
    </div>
  );
};
