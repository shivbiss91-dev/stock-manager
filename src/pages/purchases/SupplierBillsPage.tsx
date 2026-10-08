import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  DollarSign,
  Download,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { SupplierBill } from '../../types/purchases';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { useNotificationStore } from '../../store/notificationStore';

export const SupplierBillsPage: React.FC = () => {
  const { addNotification } = useNotificationStore();

  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'partially_paid'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    purchaseService.getSupplierBills().then((data) => {
      if (isMounted) {
        setBills(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePayBill = async (billId: string, amount: number) => {
    const updated = await purchaseService.paySupplierBill(billId, amount);
    setBills(bills.map((b) => (b.id === updated.id ? updated : b)));
    addNotification({
      title: 'Payment Dispatched',
      message: `RTGS payment of ${formatINR(amount)} cleared for ${updated.billNumber}.`,
      type: 'success',
    });
  };

  const filteredBills = bills.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.billNumber.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q) ||
        b.poNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Supplier Bills & Payables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {bills.length} Inward Invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supplier invoice reconciliation, 3-way matching (PO vs GRN vs Bill), and vendor bank disbursements.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by supplier bill number, PO reference, or mill..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          {[
            { id: 'all', label: 'All Bills' },
            { id: 'unpaid', label: 'Unpaid / Pending' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'paid', label: 'Settled' },
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

      {/* Bills Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Bill No & Date</th>
                <th className="py-3 px-3 font-semibold">Vendor / Mill</th>
                <th className="py-3 px-3 font-semibold">Matched PO / GRN</th>
                <th className="py-3 px-3 font-semibold text-center">Due Date</th>
                <th className="py-3 px-3 font-semibold text-right">Bill Total (₹)</th>
                <th className="py-3 px-3 font-semibold text-right">Balance Due</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredBills.length > 0 ? (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {b.billNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(b.billDate)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1 max-w-[200px]">
                        {b.supplierName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        GSTIN: {b.supplierGstin}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      <span className="text-accent-blue block">{b.poNumber}</span>
                      <span className="text-slate-400">{b.grnNumber}</span>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(b.dueDate)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatINR(b.totalAmount)}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatINR(b.balanceDue)}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          b.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : b.status === 'partially_paid'
                            ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        ● {b.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {b.balanceDue > 0 ? (
                        <button
                          onClick={() => handlePayBill(b.id, b.balanceDue)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-accent-orange hover:bg-accent-orange/90 text-white transition flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Clear Bill</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Paid in Full</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No supplier bills found.
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
