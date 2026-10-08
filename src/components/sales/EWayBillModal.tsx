import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Invoice } from '../../types/sales';
import { invoiceService } from '../../services/invoiceService';
import { useNotificationStore } from '../../store/notificationStore';

interface EWayBillModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onEWayBillGenerated: (updated: Invoice) => void;
}

export const EWayBillModal: React.FC<EWayBillModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onEWayBillGenerated,
}) => {
  const { addNotification } = useNotificationStore();

  const [vehicleNo, setVehicleNo] = useState('MH-04-GP-8842');
  const [transporterName, setTransporterName] = useState('V-Trans India Logistics');
  const [distanceKm, setDistanceKm] = useState('180');
  const [mode, setMode] = useState('Road');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const dist = parseInt(distanceKm, 10);
    if (isNaN(dist) || dist <= 0) {
      setErrorMsg('Please specify a valid transit distance in KM.');
      return;
    }

    if (!vehicleNo.trim()) {
      setErrorMsg('Vehicle Registration Number is mandatory for Part-B E-Way Bill generation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await invoiceService.generateEWayBill(invoice.id, vehicleNo.trim(), dist);
      addNotification({
        title: 'E-Way Bill Generated',
        message: `E-Way Bill #${updated.ewayBillNumber} assigned to ${invoice.invoiceNumber}.`,
        type: 'success',
      });
      onEWayBillGenerated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate E-Way bill';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060A]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F2F4F8]">
                Generate E-Way Bill
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                Part-A & Part-B NIC transport transit permit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Commercial Vehicle Number *
            </label>
            <input
              type="text"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              placeholder="e.g. MH04GP8842"
              required
              className="w-full px-3 py-2 text-sm font-mono uppercase template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transporter Agency
            </label>
            <input
              type="text"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
              className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Distance (KM) *
              </label>
              <input
                type="number"
                min="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transit Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 dark:bg-dark-card"
              >
                <option value="Road" className="dark:bg-dark-card">1 - Road</option>
                <option value="Rail" className="dark:bg-dark-card">2 - Rail</option>
                <option value="Air" className="dark:bg-dark-card">3 - Air</option>
                <option value="Ship" className="dark:bg-dark-card">4 - Ship</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Submitting to Portal...' : 'Issue E-Way Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
