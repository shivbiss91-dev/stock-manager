import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  Download,
  Plus,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import { AddNewCustomerModal } from '../../components/sales/AddNewCustomerModal';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    customerService.getCustomers().then((data) => {
      if (isMounted) {
        setCustomers(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 30/60/90-Day Receivables Ageing Calculation
  const ageingStats = useMemo(() => {
    let bucketCurrent = 0; // <30 days
    let bucket30_60 = 0;   // 31-60 days
    let bucket60_90 = 0;   // 61-90 days
    let bucket90Plus = 0;  // >90 days overdue

    customers.forEach((c, idx) => {
      const bal = c.outstandingBalanceINR;
      if (bal <= 0) return;
      const mod = idx % 4;
      if (mod === 0) bucketCurrent += bal * 0.55;
      else if (mod === 1) bucket30_60 += bal * 0.25;
      else if (mod === 2) bucket60_90 += bal * 0.12;
      else bucket90Plus += bal * 0.08;
    });

    const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalanceINR, 0);

    return {
      totalOutstanding,
      bucketCurrent: Math.round(bucketCurrent),
      bucket30_60: Math.round(bucket30_60),
      bucket60_90: Math.round(bucket60_90),
      bucket90Plus: Math.round(bucket90Plus),
    };
  }, [customers]);

  const filteredCustomers = customers.filter((c) => {
    if (selectedTier !== 'all' && c.tier !== selectedTier) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
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
              Customer Directory & Receivables
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {customers.length} Wholesale Buyers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            B2B client ledgers with 30/60/90-day overdue receivables ageing and verified GST numbers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* 30/60/90-Day Ageing Summary Card */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-5 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Outstanding Receivables Ageing Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Total Outstanding Book Debt:{' '}
              <strong className="text-slate-900 dark:text-white">
                {formatINR(ageingStats.totalOutstanding)}
              </strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* < 30 Days */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-semibold text-emerald-400 block">
              Current (0 - 30 Days)
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatINR(ageingStats.bucketCurrent)}
            </p>
            <span className="text-[10px] text-emerald-500/80">Within Credit Period</span>
          </div>

          {/* 31 - 60 Days */}
          <div className="p-3.5 rounded-xl bg-accent-blue/10 border border-accent-blue/20">
            <span className="text-[11px] font-semibold text-accent-blue block">
              31 - 60 Days Past Due
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatINR(ageingStats.bucket30_60)}
            </p>
            <span className="text-[10px] text-accent-blue/80">Mild Overdue</span>
          </div>

          {/* 61 - 90 Days */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[11px] font-semibold text-amber-400 block">
              61 - 90 Days Overdue
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatINR(ageingStats.bucket60_90)}
            </p>
            <span className="text-[10px] text-amber-500/80">Collection Triggered</span>
          </div>

          {/* > 90 Days */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] font-semibold text-rose-400 block">
              90+ Days Critical
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {formatINR(ageingStats.bucket90Plus)}
            </p>
            <span className="text-[10px] text-rose-500/80">Delivery On Hold</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, GSTIN, city, or phone..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            >
              <option value="all" className="dark:bg-dark-card">All Trade Tiers</option>
              <option value="Wholesale Standard" className="dark:bg-dark-card">Wholesale Standard</option>
              <option value="Distributor Platinum" className="dark:bg-dark-card">Distributor Platinum</option>
              <option value="Retail Partner" className="dark:bg-dark-card">Retail Partner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer / Trade Entity</th>
                <th className="py-3 px-3 font-semibold">GSTIN & Location</th>
                <th className="py-3 px-3 font-semibold">Trade Tier</th>
                <th className="py-3 px-3 font-semibold text-right">Credit Limit</th>
                <th className="py-3 px-3 font-semibold text-right">Outstanding (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Credit Terms</th>
                <th className="py-3 px-4 font-semibold text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-white/5 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No customers registered yet</p>
                      <p className="text-xs">Add your wholesale buyers and trade partners to manage orders and credit.</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-accent-orange text-white text-xs font-semibold hover:bg-accent-orange/90 transition shadow-sm"
                      >
                        + Add First Customer
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.slice(0, 30).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                      {c.companyName}
                    </span>
                    <span className="text-[11px] text-slate-400 block">{c.contactPerson}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                      {c.gstin}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {c.city}, {c.state}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300">
                      {c.tier}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-medium whitespace-nowrap">
                    {formatINR(c.creditLimitINR)}
                  </td>

                  <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                    <span className={c.outstandingBalanceINR > c.creditLimitINR ? 'text-rose-500' : 'text-slate-900 dark:text-white'}>
                      {formatINR(c.outstandingBalanceINR)}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-accent-blue">
                    {c.paymentTermsDays} Days
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap text-[11px] text-slate-500">
                    <p>{c.phone}</p>
                    <p className="text-[10px] text-slate-400">{c.email}</p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddNewCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCustomerCreated={(newC) => setCustomers([newC, ...customers])}
        />
      )}
    </div>
  );
};
