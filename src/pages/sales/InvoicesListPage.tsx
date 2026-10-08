import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Share2,
} from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { Invoice, InvoiceStatus } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { PrintInvoiceModal } from '../../components/sales/PrintInvoiceModal';
import { ShareInvoiceModal } from '../../components/sales/ShareInvoiceModal';

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [selectedInvoiceForShare, setSelectedInvoiceForShare] = useState<Invoice | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    invoiceService
      .getInvoices({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((data) => {
        if (isMounted) {
          setInvoices(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load invoices:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              GST Tax Invoices Register
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3B5BFF]/15 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/30">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-1">
            Section 31 CGST Act tax invoices ledger with automated IRN generation, E-Way bills, and payment reconciliation.
          </p>
        </div>

        {/* Create Invoice button */}
        <Link
          to="/sales/invoices/new"
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-orange hover:bg-brand-orange-light text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 shadow-sm space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (INV-...), customer name, or GSTIN..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-brand-orange"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-white/[0.04]">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'sent', label: 'Sent / Pending' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'paid', label: 'Settled / Paid' },
            { id: 'draft', label: 'Drafts' },
            { id: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-brand-orange text-white dark:bg-brand-orange dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-[#1A1D26] text-slate-600 dark:text-[#9AA0AE] hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#12151D] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#181B25] text-slate-600 dark:text-[#9AA0AE] border-b border-slate-200/80 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Invoice No & Date</th>
                <th className="py-3 px-3 font-semibold">Customer / Buyer</th>
                <th className="py-3 px-3 font-semibold">Place of Supply</th>
                <th className="py-3 px-3 font-semibold text-right">Taxable Subtotal</th>
                <th className="py-3 px-3 font-semibold text-right">Grand Total (₹)</th>
                <th className="py-3 px-3 font-semibold text-right">Balance Due</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-[#F2F4F8]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/[0.05] rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    {/* Invoice Number & Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-brand-orange block">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(inv.date)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-[#F2F4F8] block line-clamp-1 max-w-[200px]">
                        {inv.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        GSTIN: {inv.customerGstin}
                      </span>
                    </td>

                    {/* Place of Supply & Tax Mode */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-[#F2F4F8] block">
                        {inv.placeOfSupplyStateName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {inv.isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra-State)'}
                      </span>
                    </td>

                    {/* Taxable Subtotal */}
                    <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                      {formatINR(inv.subtotalTaxable)}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-3 text-right font-bold text-slate-950 dark:text-white whitespace-nowrap">
                      {formatINR(inv.grandTotal)}
                    </td>

                    {/* Balance Due */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-medium">
                      {inv.balanceDue > 0 ? (
                        <span className="text-rose-500 font-semibold">
                          {formatINR(inv.balanceDue)}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-semibold">
                          ₹0.00 (Nil)
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : inv.status === 'partially_paid'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : inv.status === 'draft'
                            ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        ● {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="Print A4 Tax Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedInvoiceForShare(inv)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-white/10 rounded-lg transition"
                          title="Share on WhatsApp / Email"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No invoices found
                    </p>
                    <p className="text-xs">Create your first GST invoice using the button above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedInvoiceForPrint && (
        <PrintInvoiceModal
          invoice={selectedInvoiceForPrint}
          isOpen={!!selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {selectedInvoiceForShare && (
        <ShareInvoiceModal
          invoice={selectedInvoiceForShare}
          isOpen={!!selectedInvoiceForShare}
          onClose={() => setSelectedInvoiceForShare(null)}
        />
      )}
    </div>
  );
};
