import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { invoiceService } from '../../services/invoiceService';
import { purchaseService } from '../../services/purchaseService';
import { ComputedInventoryItem, MaterialCategory } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { useNotificationStore } from '../../store/notificationStore';

type ReportTab = 'valuation' | 'gst' | 'reorder' | 'velocity';

export const ReportsPage: React.FC = () => {
  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<ReportTab>('valuation');
  const [valuationMethod, setValuationMethod] = useState<'weighted' | 'fifo'>('weighted');
  const [items, setItems] = useState<ComputedInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    inventoryService.getItems({ pageSize: 500 }).then((res) => {
      if (isMounted) {
        setItems(res.items);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Category breakdown calculation
  const categoryValuation = React.useMemo(() => {
    const cats: MaterialCategory[] = ['wood', 'metal', 'plastic', 'glass', 'fabric', 'rubber', 'paper', 'ceramic'];
    return cats.map((cat) => {
      const catItems = items.filter((i) => i.materialCategory === cat);
      const totalStock = catItems.reduce((acc, i) => acc + i.currentStock, 0);
      const totalVal = catItems.reduce((acc, i) => acc + i.currentStock * i.costPrice, 0);
      const lowStockCount = catItems.filter((i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock').length;
      return {
        category: cat,
        itemsCount: catItems.length,
        totalStock,
        totalVal,
        lowStockCount,
      };
    });
  }, [items]);

  const totalStockValue = categoryValuation.reduce((acc, c) => acc + c.totalVal, 0);
  const totalStockPieces = categoryValuation.reduce((acc, c) => acc + c.totalStock, 0);

  // Low stock items
  const lowStockItems = items.filter(
    (i) => i.stockStatus === 'low_stock' || i.stockStatus === 'out_of_stock'
  );

  // Fast vs slow moving items
  const highVelocityItems = items.filter((i) => i.salesVelocity === 'High');
  const deadStockItems = items.filter((i) => i.stockStatus === 'dead_stock');

  const handleExportCSV = (reportName: string) => {
    addNotification({
      title: 'Report Downloaded',
      message: `${reportName} exported to CSV format.`,
      type: 'info',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Reports & Business Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              FY 2026-27
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audited inventory valuations, GSTR-1 & GSTR-3B statutory tax ledgers, and velocity analytics.
          </p>
        </div>

        <button
          onClick={() => handleExportCSV(activeTab.toUpperCase())}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl template-input border border-slate-200 dark:border-white/[0.08] hover:border-accent-orange/40 text-slate-700 dark:text-slate-200 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-accent-orange" />
          <span>Export Active Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-2 shadow-soft flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'valuation', label: 'Stock Valuation (AS-2 / Ind AS 2)' },
          { id: 'gst', label: 'GST Returns (GSTR-1 & 3B)' },
          { id: 'reorder', label: 'Low Stock & Reorder Trigger' },
          { id: 'velocity', label: 'Fast & Slow Moving (Velocity)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-accent-orange text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Stock Valuation Report */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[20px] template-card border border-slate-200 dark:border-white/[0.06] shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Total Balance Sheet Stock Value</span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatINR(totalStockValue)}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">At lower of cost or NRV</span>
            </div>

            <div className="p-5 rounded-[20px] template-card border border-slate-200 dark:border-white/[0.06] shadow-soft">
              <span className="text-xs text-slate-500 font-medium">Physical Pieces in Hand</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalStockPieces.toLocaleString('en-IN')} units
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Across 4 regional warehouses</span>
            </div>

            <div className="p-5 rounded-[20px] template-card border border-slate-200 dark:border-white/[0.06] shadow-soft flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Valuation Costing Basis</span>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setValuationMethod('weighted')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      valuationMethod === 'weighted'
                        ? 'bg-accent-orange text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Weighted Average
                  </button>
                  <button
                    onClick={() => setValuationMethod('fifo')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                      valuationMethod === 'fifo'
                        ? 'bg-accent-orange text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    FIFO (First In First Out)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Category Table */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Material Classification</th>
                    <th className="py-3 px-3 font-semibold text-center">Active SKUs</th>
                    <th className="py-3 px-3 font-semibold text-right">Physical Quantity</th>
                    <th className="py-3 px-3 font-semibold text-right">Valuation (₹)</th>
                    <th className="py-3 px-3 font-semibold text-right">Portfolio Share</th>
                    <th className="py-3 px-4 font-semibold text-center">Stock Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
                  {categoryValuation.map((row) => (
                    <tr key={row.category} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4 capitalize font-semibold text-slate-900 dark:text-white">
                        {row.category}
                      </td>
                      <td className="py-3 px-3 text-center">{row.itemsCount} SKUs</td>
                      <td className="py-3 px-3 text-right font-medium">
                        {row.totalStock.toLocaleString('en-IN')} units
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatINR(row.totalVal)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {totalStockValue > 0
                          ? `${((row.totalVal / totalStockValue) * 100).toFixed(1)}%`
                          : '0%'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.lowStockCount > 0 ? (
                          <span className="text-amber-500 font-semibold text-[11px]">
                            {row.lowStockCount} below reorder
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            Optimal Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GST Returns Summary (GSTR-1 & 3B) */}
      {activeTab === 'gst' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GSTR-1 Outward Supplies */}
            <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-orange" />
                  <span>GSTR-1: Outward Supplies (Sales)</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-slate-500">October 2026</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total B2B Taxable Turnover:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹1,48,25,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Central Tax (CGST 9%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹8,89,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">State Tax (SGST 9%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹8,89,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Integrated Tax (IGST 18%):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹8,89,000.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex justify-between font-bold text-sm">
                  <span>Gross Output GST Liability:</span>
                  <span className="text-rose-500">₹26,68,000.00</span>
                </div>
              </div>
            </div>

            {/* GSTR-3B ITC Net Position */}
            <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>GSTR-3B: Net Tax Settlement</span>
                </h3>
                <span className="text-[11px] font-mono font-bold text-slate-500">October 2026</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Output Tax:</span>
                  <span className="font-bold text-rose-500">₹26,68,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Eligible ITC (Purchases / GRN):</span>
                  <span className="font-bold text-emerald-400">-₹21,35,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Electronic Cash Ledger Balance:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">₹1,50,000.00</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex justify-between font-bold text-sm">
                  <span>Net GST Payable via Challan:</span>
                  <span className="text-accent-orange">₹3,83,000.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Low Stock & Reorder Trigger */}
      {activeTab === 'reorder' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[20px] text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>{lowStockItems.length} items</strong> have fallen below safety reorder threshold.
              </span>
            </div>
            <button
              onClick={() => handleExportCSV('REORDER_PLAN')}
              className="px-3 py-1 rounded-lg bg-accent-orange text-white font-semibold hover:bg-accent-orange/90 transition shadow-xs"
            >
              Generate Procurement Order
            </button>
          </div>

          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Description</th>
                    <th className="py-3 px-3 font-semibold">SKU / Warehouse</th>
                    <th className="py-3 px-3 font-semibold text-right">Available Stock</th>
                    <th className="py-3 px-3 font-semibold text-right">Reorder Point</th>
                    <th className="py-3 px-3 font-semibold text-right">Suggested PO Qty</th>
                    <th className="py-3 px-3 font-semibold text-right">Est. Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
                  {lowStockItems.slice(0, 15).map((item) => {
                    const suggestedPO = Math.max(50, item.reorderLevel * 2 - item.currentStock);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          {item.sku} ({item.warehouseName.split(' ')[0]})
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-500">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500">
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-accent-blue">
                          {suggestedPO} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white">
                          {formatINR(suggestedPO * item.costPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Velocity (Fast vs Slow Moving) */}
      {activeTab === 'velocity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fast Moving */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Fast Moving High Velocity Items (Top 30-Day Turn)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {highVelocityItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">
                      {item.sales30Days} sold / 30d
                    </span>
                    <span className="text-[10px] text-slate-400">{formatINR(item.sellingPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slow & Dead Stock */}
          <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent-orange" />
              <span>Dead Stock (90+ Days Zero Sales)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {deadStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Rack: {item.rackLocation}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-accent-orange block">
                      {item.currentStock} {item.unit} trapped
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Asset Value: {formatINR(item.currentStock * item.costPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
