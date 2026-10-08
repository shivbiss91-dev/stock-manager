import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { SalesQuotation } from '../../types/purchases';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { useNotificationStore } from '../../store/notificationStore';

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    purchaseService.getQuotations().then((data) => {
      if (isMounted) {
        setQuotations(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConvertToInvoice = (qt: SalesQuotation) => {
    addNotification({
      title: 'Quotation Accepted',
      message: `Converting quotation ${qt.quotationNumber} into a GST Tax Invoice.`,
      type: 'info',
    });
    navigate('/sales/invoices/new');
  };

  const filtered = quotations.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(query) ||
      q.customerName.toLowerCase().includes(query) ||
      q.customerGstin.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              B2B Sales Quotations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B5BFF]/15 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/30">
              {quotations.length} Quotations
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
            Commercial estimates, trade discount tiers, and one-click conversion to GST Tax Invoices.
          </p>
        </div>

        <Link
          to="/sales/invoices/new"
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation</span>
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
            placeholder="Search by quotation number (QT-...), buyer name, or GSTIN..."
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
                <th className="py-3 px-4 font-semibold">Quotation No & Date</th>
                <th className="py-3 px-3 font-semibold">Prospective Buyer</th>
                <th className="py-3 px-3 font-semibold text-center">Valid Until</th>
                <th className="py-3 px-3 font-semibold text-right">Taxable Subtotal</th>
                <th className="py-3 px-3 font-semibold text-right">Estimated Total (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-[#F2F4F8]">
              {filtered.map((qt) => (
                <tr key={qt.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-brand-orange block">
                      {qt.quotationNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Issued {formatDate(qt.date)}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900 dark:text-[#F2F4F8] block line-clamp-1 max-w-[220px]">
                      {qt.customerName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block">
                      GSTIN: {qt.customerGstin}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-700 dark:text-[#F2F4F8]">
                    {formatDate(qt.validUntil)}
                  </td>

                  <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                    {formatINR(qt.subtotal)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-950 dark:text-white whitespace-nowrap">
                    {formatINR(qt.grandTotal)}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        qt.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : qt.status === 'sent'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      ● {qt.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleConvertToInvoice(qt)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white transition flex items-center gap-1.5 ml-auto"
                    >
                      <span>Convert to Invoice</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
