import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  Calendar,
  X,
  FileText,
} from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { InterHubTransfer } from '../../types/purchases';
import { formatDate } from '../../utils/dateUtils';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { PREDEFINED_UNITS, PredefinedUnit } from '../../utils/unitConversions';

export const TransfersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [transfers, setTransfers] = useState<InterHubTransfer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromWarehouse, setFromWarehouse] = useState('Bhiwandi Central Hub (MH)');
  const [toWarehouse, setToWarehouse] = useState('Peenya Hub (KA)');
  const [vehicleNo, setVehicleNo] = useState('MH-04-GP-8842');
  const [driverName, setDriverName] = useState('Ramesh Yadav');
  const [driverPhone, setDriverPhone] = useState('+91 98200 44912');
  const [quantity, setQuantity] = useState('30');
  const [transferUnit, setTransferUnit] = useState<PredefinedUnit>('PCS');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    purchaseService.getTransfers().then((data) => {
      if (isMounted) {
        setTransfers(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10) || 20;

    const created = await purchaseService.createTransfer({
      date: new Date().toISOString(),
      fromWarehouseId: 'wh-001',
      fromWarehouseName: fromWarehouse,
      toWarehouseId: 'wh-004',
      toWarehouseName: toWarehouse,
      vehicleNumber: vehicleNo.trim().toUpperCase(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      status: 'in_transit',
      dispatchedAt: new Date().toISOString(),
      createdBy: user?.name || 'Logistics Coordinator',
      notes: 'Highway corridor inter-hub redistribution',
      items: [
        {
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          quantity: qty,
          unit: transferUnit,
        },
      ],
    });

    setTransfers([created, ...transfers]);
    setIsModalOpen(false);
    addNotification({
      title: 'Inter-Hub Transfer Dispatched',
      message: `${created.transferNumber} in transit from ${fromWarehouse} to ${toWarehouse}.`,
      type: 'success',
    });
  };

  const handleReceiveTransfer = (transferId: string) => {
    setTransfers(
      transfers.map((t) =>
        t.id === transferId ? { ...t, status: 'received', receivedAt: new Date().toISOString() } : t
      )
    );
    addNotification({
      title: 'Transfer Received',
      message: 'Consignment verified and merged into local warehouse stock.',
      type: 'success',
    });
  };

  const filteredTransfers = transfers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.transferNumber.toLowerCase().includes(q) ||
      t.fromWarehouseName.toLowerCase().includes(q) ||
      t.toWarehouseName.toLowerCase().includes(q) ||
      t.vehicleNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Inter-Hub Stock Transfers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
              {transfers.length} Transfers
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inter-state inventory rebalancing across Maharashtra, Delhi, and Karnataka logistics corridors.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Initiate Inter-Hub Transfer</span>
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
            placeholder="Search by transfer number (TR-...), source, destination, or vehicle..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
          />
        </div>
      </div>

      {/* Transfers Table */}
      <div className="template-card border border-slate-200 dark:border-white/[0.06] rounded-[20px] shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4 font-semibold">Transfer No & Date</th>
                <th className="py-3 px-3 font-semibold">Source Hub</th>
                <th className="py-3 px-3 font-semibold">Destination Hub</th>
                <th className="py-3 px-3 font-semibold">Transit Vehicle & Driver</th>
                <th className="py-3 px-3 font-semibold text-center">Volume Units</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
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
              ) : filteredTransfers.length > 0 ? (
                filteredTransfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {tr.transferNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(tr.date)}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {tr.fromWarehouseName}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-accent-blue">
                        ➔ {tr.toWarehouseName}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                        {tr.vehicleNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tr.driverName} ({tr.driverPhone})
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold whitespace-nowrap">
                      {tr.items.reduce((acc, i) => acc + i.quantity, 0)} {tr.items[0]?.unit}
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tr.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                        }`}
                      >
                        ● {tr.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {tr.status === 'in_transit' ? (
                        <button
                          onClick={() => handleReceiveTransfer(tr.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-accent-orange hover:bg-accent-orange/90 text-white transition flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Inward</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Received & Merged</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inter-hub transfers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Dispatch Inter-Hub Consignment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Transport goods between company warehouse facilities
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

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Origin Warehouse
                  </label>
                  <select
                    value={fromWarehouse}
                    onChange={(e) => setFromWarehouse(e.target.value)}
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="Bhiwandi Central Hub (MH)" className="dark:bg-dark-card">Bhiwandi Central Hub (MH)</option>
                    <option value="Panvel Logistics Depot (MH)" className="dark:bg-dark-card">Panvel Logistics Depot (MH)</option>
                    <option value="Okhla Industrial Depot (DL)" className="dark:bg-dark-card">Okhla Industrial Depot (DL)</option>
                    <option value="Peenya Hub (KA)" className="dark:bg-dark-card">Peenya Hub (KA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Hub
                  </label>
                  <select
                    value={toWarehouse}
                    onChange={(e) => setToWarehouse(e.target.value)}
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    <option value="Peenya Hub (KA)" className="dark:bg-dark-card">Peenya Hub (KA)</option>
                    <option value="Panvel Logistics Depot (MH)" className="dark:bg-dark-card">Panvel Logistics Depot (MH)</option>
                    <option value="Okhla Industrial Depot (DL)" className="dark:bg-dark-card">Okhla Industrial Depot (DL)</option>
                    <option value="Bhiwandi Central Hub (MH)" className="dark:bg-dark-card">Bhiwandi Central Hub (MH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Truck Reg No *
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    required
                    className="w-full px-3 py-2 text-xs font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Transfer Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    value={transferUnit}
                    onChange={(e) => setTransferUnit(e.target.value as PredefinedUnit)}
                    className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                  >
                    {PREDEFINED_UNITS.map((u) => (
                      <option key={u.code} value={u.code} className="dark:bg-dark-card">
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  Dispatch Consignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
