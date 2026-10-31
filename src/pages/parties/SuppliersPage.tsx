import React, { useState, useEffect } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  Building2,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Download,
  Plus,
} from 'lucide-react';
import { supplierService } from '../../services/supplierService';
import { Supplier } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import { AddSupplierModal } from '../../components/parties/AddSupplierModal';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    supplierService.getSuppliers().then(setSuppliers);
  }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.companyName.toLowerCase().includes(q) ||
        s.gstin.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
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
              Supplier Directory & Mills
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {suppliers.length} Certified Manufacturers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authorized raw material mills, packaging vendors, and industrial chemical suppliers.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by mill name, material category, GSTIN, or city..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 capitalize"
            >
              <option value="all" className="dark:bg-dark-card">All Material Categories</option>
              <option value="wood" className="dark:bg-dark-card">Wood & Timber</option>
              <option value="metal" className="dark:bg-dark-card">Metal & Steel</option>
              <option value="plastic" className="dark:bg-dark-card">Plastics & Polymers</option>
              <option value="glass" className="dark:bg-dark-card">Glass & Glazing</option>
              <option value="fabric" className="dark:bg-dark-card">Fabric & Textiles</option>
              <option value="rubber" className="dark:bg-dark-card">Rubber & Elastomers</option>
              <option value="paper" className="dark:bg-dark-card">Paper & Packaging</option>
              <option value="ceramic" className="dark:bg-dark-card">Ceramics & Minerals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Manufacturer / Mill</th>
                <th className="py-3 px-3 font-semibold">Material Domain</th>
                <th className="py-3 px-3 font-semibold">GSTIN & Location</th>
                <th className="py-3 px-3 font-semibold text-center">Avg Lead Time</th>
                <th className="py-3 px-3 font-semibold text-center">Quality Rating</th>
                <th className="py-3 px-4 font-semibold text-right">Contact Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Truck className="w-8 h-8 text-slate-400" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">No suppliers registered yet</p>
                      <p className="text-xs">Add your manufacturing mills, vendors, and raw material suppliers.</p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-accent-orange text-white text-xs font-semibold hover:bg-accent-orange/90 transition shadow-sm"
                      >
                        + Add First Supplier
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1">
                        {s.companyName}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">ID: {s.id}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-orange/15 text-accent-orange border border-accent-orange/30">
                        {s.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                        {s.gstin}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {s.city}, {s.state}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                      {s.leadTimeDays} Days
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{s.rating.toFixed(1)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap text-[11px] text-slate-500">
                      <p>{s.phone}</p>
                      <p className="text-[10px] text-slate-400">{s.contactPerson}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddSupplierModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSupplierCreated={(newS) => setSuppliers([newS, ...suppliers])}
        />
      )}
    </div>
  );
};
