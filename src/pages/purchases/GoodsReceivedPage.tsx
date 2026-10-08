import React, { useState, useEffect } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  X,
  FileText,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { GoodsReceivedNote } from '../../types/purchases';
import { formatDate } from '../../utils/dateUtils';
import { MOCK_SUPPLIERS } from '../../data/suppliers';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export const GoodsReceivedPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [grnList, setGrnList] = useState<GoodsReceivedNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('GP-INV-2026-912');
  const [vehicleNo, setVehicleNo] = useState('MH-04-AB-1928');
  const [transporter, setTransporter] = useState('V-Trans Express');
  const [receivedQty, setReceivedQty] = useState('100');
  const [inspectionNotes, setInspectionNotes] = useState('Inspected against IS 710 specification; zero delamination');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    purchaseService.getGRNs().then((data) => {
      if (isMounted) {
        setGrnList(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(receivedQty, 10) || 50;

    const created = await purchaseService.createGRN({
      poId: 'po-001',
      poNumber: 'PO-2026-0422',
      supplierId: 'sup-001',
      supplierName: 'Greenply Industries Ltd',
      warehouseId: 'wh-001',
      warehouseName: 'Bhiwandi Central Hub (MH)',
      receivedDate: new Date().toISOString(),
      supplierInvoiceNumber: supplierInvoiceNo.trim(),
      supplierInvoiceDate: new Date().toISOString().split('T')[0],
      vehicleNumber: vehicleNo.trim().toUpperCase(),
      transporterName: transporter.trim(),
      ewayBillNumber: '281940291048',
      status: 'accepted',
      receivedBy: user?.name || 'Warehouse Master',
      remarks: inspectionNotes.trim(),
      items: [
        {
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          quantityReceived: qty,
          acceptedQty: qty,
          rejectedQty: 0,
          unit: 'sheets',
          inspectionNotes: inspectionNotes.trim(),
        },
      ],
    });

    setGrnList([created, ...grnList]);
    setIsModalOpen(false);
    addNotification({
      title: 'Inward Consignment Received',
      message: `${created.grnNumber} generated. Stock updated for ${created.items[0].name}.`,
      type: 'success',
    });
  };

  const filteredGRNs = grnList.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.grnNumber.toLowerCase().includes(q) ||
      g.supplierName.toLowerCase().includes(q) ||
      g.supplierInvoiceNumber.toLowerCase().includes(q) ||
      g.vehicleNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Goods Received Notes (GRN)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {grnList.length} Inward Consignments
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Physical receipt verification, QA inspection, and automated warehouse inventory additions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Inward New Consignment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] p-4 shadow-soft">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by GRN number, supplier invoice, trailer number, or mill..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
        </div>
      </div>

      {/* GRN Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">GRN Number & Date</th>
                <th className="py-3 px-3 font-semibold">Supplier / Mill</th>
                <th className="py-3 px-3 font-semibold">Supplier Invoice & Transit</th>
                <th className="py-3 px-3 font-semibold">Destination Hub</th>
                <th className="py-3 px-3 font-semibold text-right">Accepted Qty</th>
                <th className="py-3 px-3 font-semibold">Inspected By</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredGRNs.length > 0 ? (
                filteredGRNs.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {grn.grnNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Inward {formatDate(grn.receivedDate)}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900 dark:text-white block line-clamp-1 max-w-[200px]">
                        {grn.supplierName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        PO: {grn.poNumber}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-800 dark:text-slate-200 block">
                        Inv #{grn.supplierInvoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {grn.vehicleNumber} ({grn.transporterName})
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {grn.warehouseName}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{grn.items.reduce((acc, i) => acc + i.acceptedQty, 0)} {grn.items[0]?.unit}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {grn.receivedBy}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ● {grn.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inward goods receipts found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Inward Goods Receipt (GRN)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verify trailer consignment against mill tax invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGRN} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier Invoice No *
                  </label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trailer / Truck Number *
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transporter Agency
                  </label>
                  <input
                    type="text"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accepted Quantity (Sheets) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quality Inspection Findings & Batch Certification
                </label>
                <textarea
                  rows={2}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition"
                >
                  Accept & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
