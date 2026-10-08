import React, { useState, useEffect, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Printer,
  ArrowRightLeft,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { ComputedInventoryItem, MaterialCategory } from '../../types/inventory';
import { StockStatus } from '../../types/common';
import { formatINR } from '../../utils/formatINR';
import { AddItemModal } from '../../components/dashboard/AddItemModal';
import { BarcodeLabelModal } from '../../components/itemDetail/BarcodeLabelModal';
import { TransferStockModal } from '../../components/itemDetail/TransferStockModal';
import { useAuthStore } from '../../store/authStore';

export const AllItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  // Read URL parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('q') || '';
  const categoryParam = (searchParams.get('category') || 'all') as MaterialCategory | 'all';
  const statusParam = (searchParams.get('status') || 'all') as StockStatus | 'all';

  // Local state
  const [items, setItems] = useState<ComputedInventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    deadStock: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [, startTransition] = useTransition();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<ComputedInventoryItem | null>(null);
  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<ComputedInventoryItem | null>(null);

  // Load items
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    inventoryService
      .getItems({
        page,
        pageSize: 20,
        search: searchParam || undefined,
        category: categoryParam !== 'all' ? categoryParam : undefined,
        stockStatus: statusParam !== 'all' ? statusParam : undefined,
      })
      .then((res) => {
        if (isMounted) {
          setItems(res.items);
          setTotalCount(res.totalCount);
          setTotalPages(res.totalPages);
          setStatusCounts(res.statusCounts);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load items:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, searchParam, categoryParam, statusParam]);

  // Handle Search input
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      next.set('q', searchInput.trim());
    } else {
      next.delete('q');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  // Handle Category change
  const handleCategoryChange = (cat: string) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'all') {
      next.delete('category');
    } else {
      next.set('category', cat);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  // Handle Status change
  const handleStatusChange = (status: string) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'all') {
      next.delete('status');
    } else {
      next.set('status', status);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  // Handle page change
  const goToPage = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Inventory Master Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B5BFF]/15 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/30">
              {totalCount.toLocaleString('en-IN')} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
            Complete multi-warehouse inventory registry with live stock valuation and HSN classification.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by SKU, product name, HSN code or barcode..."
              className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F2F4F8] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  const next = new URLSearchParams(searchParams);
                  next.delete('q');
                  setSearchParams(next);
                }}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-brand-orange text-white rounded-lg text-xs font-medium hover:bg-brand-orange-light transition"
            >
              Search
            </button>
          </form>

          {/* Category Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={categoryParam}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange capitalize"
            >
              <option value="all">All Material Categories</option>
              <option value="wood">Wood</option>
              <option value="metal">Metal</option>
              <option value="plastic">Plastic</option>
              <option value="glass">Glass</option>
              <option value="fabric">Fabric</option>
              <option value="rubber">Rubber</option>
              <option value="paper">Paper</option>
              <option value="ceramic">Ceramic</option>
            </select>
          </div>
        </div>

        {/* Stock Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.04]">
          {[
            { id: 'all', label: 'All Items', count: statusCounts.total },
            { id: 'in_stock', label: 'In Stock', count: statusCounts.inStock },
            { id: 'low_stock', label: 'Low Stock', count: statusCounts.lowStock },
            { id: 'out_of_stock', label: 'Out of Stock', count: statusCounts.outOfStock },
            { id: 'dead_stock', label: 'Dead Stock (90d+)', count: statusCounts.deadStock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusParam === tab.id
                  ? 'bg-brand-orange text-white dark:bg-brand-orange dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-[#1A1D26] text-slate-600 dark:text-[#9AA0AE] hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusParam === tab.id
                  ? 'bg-white/20 text-white dark:text-slate-950'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Items Table */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181B25] text-slate-600 dark:text-[#9AA0AE] border-b border-slate-200/80 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Product Description</th>
                <th className="py-3 px-3 font-semibold">SKU / HSN</th>
                <th className="py-3 px-3 font-semibold">Location</th>
                <th className="py-3 px-3 font-semibold text-right">Price (₹)</th>
                <th className="py-3 px-3 font-semibold text-right">Available Stock</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-[#F2F4F8]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/[0.05] rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    {/* Product Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 flex-shrink-0 border border-slate-200 dark:border-white/[0.06]"
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/items/${item.id}`}
                            className="font-semibold text-slate-900 dark:text-[#F2F4F8] hover:text-brand-orange transition line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 capitalize">
                            <span>{item.materialCategory}</span>
                            <span>•</span>
                            <span>{item.materialSubtype}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU & HSN */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-medium text-brand-orange block">
                        {item.sku}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        HSN {item.hsnCode}
                      </span>
                    </td>

                    {/* Storage Location */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 dark:text-[#F2F4F8] block truncate max-w-[140px]">
                        {item.warehouseName.split(' ')[0]} Hub
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.rackLocation}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {formatINR(item.sellingPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        +{item.gstRate}% GST
                      </span>
                    </td>

                    {/* Available Stock */}
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`font-bold block ${
                          item.currentStock <= item.reorderLevel
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }`}
                      >
                        {item.currentStock.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Min: {item.reorderLevel}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.stockStatus === 'in_stock'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : item.stockStatus === 'low_stock'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : item.stockStatus === 'dead_stock'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        {item.stockStatus.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/items/${item.id}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setSelectedItemForTransfer(item)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="Transfer Stock"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedItemForLabel(item)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="Print Barcode Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No items match your criteria</p>
                    <p className="text-xs">Try resetting the filters or modifying your search terms.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-[#181B25] border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
            <span className="text-slate-400">
              Showing page <strong className="text-slate-800 dark:text-white">{page}</strong> of{' '}
              <strong className="text-slate-800 dark:text-white">{totalPages}</strong> ({totalCount} total items)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onItemAdded={() => {
            inventoryService.getItems({ page: 1, pageSize: 20 }).then((res) => {
              setItems(res.items);
              setTotalCount(res.totalCount);
            });
          }}
        />
      )}

      {selectedItemForLabel && (
        <BarcodeLabelModal
          item={selectedItemForLabel}
          isOpen={!!selectedItemForLabel}
          onClose={() => setSelectedItemForLabel(null)}
        />
      )}

      {selectedItemForTransfer && (
        <TransferStockModal
          item={selectedItemForTransfer}
          isOpen={!!selectedItemForTransfer}
          onClose={() => setSelectedItemForTransfer(null)}
          onTransferComplete={() => {
            inventoryService.getItems({ page, pageSize: 20 }).then((res) => setItems(res.items));
          }}
        />
      )}
    </div>
  );
};
