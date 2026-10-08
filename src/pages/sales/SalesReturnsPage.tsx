import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { SalesReturn } from '../../types/purchases';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';

export const SalesReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    purchaseService.getReturns().then((data) => {
      if (isMounted) setReturns(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = returns.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.returnNumber.toLowerCase().includes(q) ||
      r.invoiceNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Returns & Credit Notes (GST Sec 34)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
              {returns.length} Credit Notes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
            Section 34 CGST Act compliant credit notes for goods returned, transit damage, or price adjustments.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Credit Note (CRN-...), Invoice No, customer, or reason..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181B25] text-slate-600 dark:text-[#9AA0AE] border-b border-slate-200/80 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Credit Note No & Date</th>
                <th className="py-3 px-3 font-semibold">Original Tax Invoice</th>
                <th className="py-3 px-3 font-semibold">Customer / Buyer</th>
                <th className="py-3 px-3 font-semibold">Return Justification</th>
                <th className="py-3 px-3 font-semibold text-center">Returned Qty</th>
                <th className="py-3 px-3 font-semibold text-right">Credit Value (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-[#F2F4F8]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-rose-500 block">
                      {r.returnNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Issued {formatDate(r.date)}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-brand-orange">
                    {r.invoiceNumber}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 dark:text-[#F2F4F8] block line-clamp-1 max-w-[220px]">
                      {r.customerName}
                    </span>
                  </td>

                  <td className="py-3 px-3 max-w-xs text-slate-600 dark:text-[#9AA0AE] truncate">
                    {r.reason}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-800 dark:text-[#F2F4F8]">
                    {r.itemsCount} units
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-rose-500 whitespace-nowrap">
                    {formatINR(r.amountINR)}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        r.status === 'processed'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      ● {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
