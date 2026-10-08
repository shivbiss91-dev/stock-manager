import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { SalesOrder } from '../../types/purchases';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    purchaseService.getSalesOrders().then((data) => {
      if (isMounted) setOrders(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = orders.filter((so) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      so.orderNumber.toLowerCase().includes(query) ||
      so.customerName.toLowerCase().includes(query) ||
      so.warehouseName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Sales Orders Fulfillment Register
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B5BFF]/15 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/30">
              {orders.length} Active Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
            Track confirmed wholesale purchase commitments awaiting warehouse dispatch and transport picking.
          </p>
        </div>

        <Link
          to="/sales/invoices/new"
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Order</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number (SO-...), buyer, or warehouse hub..."
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
                <th className="py-3 px-4 font-semibold">SO Number & Date</th>
                <th className="py-3 px-3 font-semibold">Client Firm</th>
                <th className="py-3 px-3 font-semibold">Fulfillment Hub</th>
                <th className="py-3 px-3 font-semibold text-center">Items Count</th>
                <th className="py-3 px-3 font-semibold text-right">Order Value (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Dispatch Status</th>
                <th className="py-3 px-3 font-semibold text-center">Payment Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-[#F2F4F8]">
              {filtered.map((so) => (
                <tr key={so.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-brand-orange block">
                      {so.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(so.date)}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 dark:text-[#F2F4F8] block line-clamp-1 max-w-[220px]">
                      {so.customerName}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-800 dark:text-[#F2F4F8]">
                    {so.warehouseName}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-800 dark:text-[#F2F4F8]">
                    {so.itemsCount} SKUs
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-950 dark:text-white whitespace-nowrap">
                    {formatINR(so.totalAmountINR)}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        so.status === 'delivered'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : so.status === 'in_transit'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      }`}
                    >
                      ● {so.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-600 dark:text-[#9AA0AE]">
                    {so.paymentTerms}
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
