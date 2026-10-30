import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Building2,
  Calendar,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types/purchases';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { MOCK_SUPPLIERS } from '../../data/suppliers';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { PREDEFINED_UNITS, PredefinedUnit } from '../../utils/unitConversions';

export const PurchaseOrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(MOCK_SUPPLIERS[0]?.id || '');
  const [poUnit, setPoUnit] = useState<PredefinedUnit>('PCS');
  const [poQuantity, setPoQuantity] = useState<number>(150);
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net');
  const [poNotes, setPoNotes] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    purchaseService.getPurchaseOrders().then((data) => {
      if (isMounted) {
        setOrders(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = orders.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.supplierName.toLowerCase().includes(q) ||
        po.supplierGstin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = MOCK_SUPPLIERS.find((s) => s.id === selectedSupplierId) || MOCK_SUPPLIERS[0];
    const created = await purchaseService.createPurchaseOrder({
      date: new Date().toISOString(),
      expectedDate: new Date(expectedDate).toISOString(),
      supplierId: sup.id,
      supplierName: sup.companyName,
      supplierGstin: sup.gstin,
      warehouseId: 'wh-001',
      warehouseName: 'Bhiwandi Central Hub (MH)',
      status: 'approved',
      paymentTerms,
      notes: poNotes.trim() || 'Standard wholesale lot procurement',
      createdBy: user?.name || 'Procurement Master',
      subtotalTaxable: 350000,
      totalTax: 63000,
      grandTotal: 413000,
      items: [
        {
          id: `line-${Date.now()}`,
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          hsnCode: '440711',
          quantityOrdered: poQuantity,
          quantityReceived: 0,
          unit: poUnit,
          rate: 2100,
          gstRate: 18,
          lineTaxable: 315000,
          taxAmount: 56700,
          lineTotal: 371700,
        },
      ],
    });

    setOrders([created, ...orders]);
    setIsCreateModalOpen(false);
    addNotification({
      title: 'Purchase Order Created',
      message: `${created.poNumber} issued to ${created.supplierName}.`,
      type: 'success',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Purchase Orders Register
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {orders.length} Procurement Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mill direct procurements, supplier delivery tracking, and GRN fulfillment receipts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Purchase Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PO number, mill supplier, or GSTIN..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'approved', label: 'Awaiting Delivery' },
            { id: 'received', label: 'Completed (GRN)' },
            { id: 'partially_received', label: 'Partial Receipt' },
            { id: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-accent-orange text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PO Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">PO Number & Date</th>
                <th className="py-3 px-3 font-semibold">Supplier / Mill</th>
                <th className="py-3 px-3 font-semibold">Destination Hub</th>
                <th className="py-3 px-3 font-semibold text-center">Expected Date</th>
                <th className="py-3 px-3 font-semibold text-right">Taxable Total</th>
                <th className="py-3 px-3 font-semibold text-right">Grand Total (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {po.poNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Raised {formatDate(po.date)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1 max-w-[200px]">
                        {po.supplierName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        GSTIN: {po.supplierGstin}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {po.warehouseName}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(po.expectedDate)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                      {formatINR(po.subtotalTaxable)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-950 dark:text-white whitespace-nowrap">
                      {formatINR(po.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : po.status === 'approved'
                            ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                            : 'bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-slate-300'
                        }`}
                      >
                        ● {po.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Raise Wholesale Purchase Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Initiate raw material / finished goods procurement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Manufacturer / Supplier *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                >
                  {MOCK_SUPPLIERS.map((s) => (
                    <option key={s.id} value={s.id} className="dark:bg-dark-card">
                      {s.companyName} ({s.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Procurement Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={poUnit}
                    onChange={(e) => setPoUnit(e.target.value as PredefinedUnit)}
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    {PREDEFINED_UNITS.map((u) => (
                      <option key={u.code} value={u.code} className="dark:bg-dark-card">
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="30 Days Net" className="dark:bg-dark-card">30 Days Net</option>
                    <option value="45 Days Net" className="dark:bg-dark-card">45 Days Net</option>
                    <option value="Advance 100%" className="dark:bg-dark-card">100% Advance Against PI</option>
                    <option value="CAD" className="dark:bg-dark-card">Cash Against Delivery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Procurement Notes
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Gurjan BWP lot inspection report required before dispatch"
                  className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition"
                >
                  Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
