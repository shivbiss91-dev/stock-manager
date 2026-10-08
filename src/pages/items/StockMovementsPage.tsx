import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  Search,
  Download,
  Filter,
  Package,
  Calendar,
  FileText,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';
import { stockMovementService } from '../../services/stockMovementService';
import { StockMovementRecord, MovementType } from '../../types/itemDetail';
import { formatDate } from '../../utils/dateUtils';
import { useNotificationStore } from '../../store/notificationStore';

export const StockMovementsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addNotification } = useNotificationStore();

  const itemIdParam = searchParams.get('itemId') || undefined;
  const typeParam = (searchParams.get('type') || 'all') as MovementType | 'all';
  const qParam = searchParams.get('q') || '';

  const [movements, setMovements] = useState<StockMovementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(qParam);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    stockMovementService
      .getMovements({
        itemId: itemIdParam,
        type: typeParam !== 'all' ? typeParam : undefined,
        search: qParam || undefined,
      })
      .then((data) => {
        if (isMounted) {
          setMovements(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load stock movements:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [itemIdParam, typeParam, qParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      next.set('q', searchQuery.trim());
    } else {
      next.delete('q');
    }
    setSearchParams(next);
  };

  const handleTypeChange = (type: string) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') {
      next.delete('type');
    } else {
      next.set('type', type);
    }
    setSearchParams(next);
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Movement Type',
      'Item ID',
      'Quantity Delta',
      'Stock After',
      'Unit',
      'Reference No',
      'User Name',
      'User Role',
      'Notes',
    ];
    const rows = movements.map((m) => [
      `"${m.date}"`,
      `"${m.type}"`,
      `"${m.itemId}"`,
      m.quantityDelta,
      m.stockAfter,
      `"${m.unit}"`,
      `"${m.referenceNumber}"`,
      `"${m.userName}"`,
      `"${m.userRole}"`,
      `"${m.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `StockVista_Movements_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification({
      title: 'Ledger Exported',
      message: `Exported ${movements.length} stock movement records to CSV.`,
      type: 'info',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Stock Movement Audit Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-accent-blue border border-blue-500/20">
              {movements.length} Transactions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete verifiable double-entry log of all goods receipts, sales orders, transfers, and physical audit adjustments.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] template-input text-slate-700 dark:text-slate-200 hover:text-white shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-accent-blue" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference number (PO, SO, TR), employee, or notes..."
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                const next = new URLSearchParams(searchParams);
                next.delete('q');
                setSearchParams(next);
              }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-accent-orange hover:bg-accent-orange/90 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>

        {/* Movement Type Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            { id: 'all', label: 'All Activities' },
            { id: 'in', label: 'Goods Receipts (PO)' },
            { id: 'out', label: 'Sales Dispatches (SO)' },
            { id: 'transfer', label: 'Inter-Hub Transfers' },
            { id: 'return', label: 'Credit Returns' },
            { id: 'damage', label: 'Transit / Breakage' },
            { id: 'adjustment', label: 'Physical Reconciliation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                typeParam === tab.id
                  ? 'bg-accent-orange text-white shadow-sm'
                  : 'template-input text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-3 font-semibold">Classification</th>
                <th className="py-3 px-3 font-semibold">Item / SKU</th>
                <th className="py-3 px-3 font-semibold text-right">Quantity Delta</th>
                <th className="py-3 px-3 font-semibold text-right">Stock Balance</th>
                <th className="py-3 px-3 font-semibold">Ref Number</th>
                <th className="py-3 px-3 font-semibold">Authorized By</th>
                <th className="py-3 px-4 font-semibold">Description / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/[0.05] rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-medium text-slate-400 whitespace-nowrap">
                      {formatDate(m.date)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.type === 'in'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : m.type === 'out'
                            ? 'bg-blue-500/10 text-accent-blue border border-blue-500/20'
                            : m.type === 'transfer'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : m.type === 'return'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : m.type === 'damage'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <Link
                        to={`/items/${m.itemId}`}
                        className="font-mono font-semibold text-accent-blue hover:underline"
                      >
                        {m.itemId}
                      </Link>
                    </td>

                    <td
                      className={`py-3 px-3 text-right font-bold whitespace-nowrap ${
                        m.quantityDelta > 0
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium whitespace-nowrap">
                      {m.stockAfter} {m.unit}
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {m.referenceNumber}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {m.userName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{m.userRole}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 max-w-sm truncate" title={m.notes}>
                      {m.notes}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No stock movement entries found
                    </p>
                    <p className="text-xs">Adjust your search parameters or classification filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
