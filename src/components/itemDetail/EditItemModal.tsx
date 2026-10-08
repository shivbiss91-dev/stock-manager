import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ShieldAlert, FileText } from 'lucide-react';
import { ComputedInventoryItem } from '../../types/inventory';
import { useAuthStore } from '../../store/authStore';
import { inventoryService } from '../../services/inventoryService';
import { approvalsService } from '../../services/approvalsService';
import { useNotificationStore } from '../../store/notificationStore';
import { formatINR } from '../../utils/formatINR';

interface EditItemModalProps {
  item: ComputedInventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updated: ComputedInventoryItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}) => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku);
  const [materialSubtype, setMaterialSubtype] = useState(item.materialSubtype);
  const [rackLocation, setRackLocation] = useState(item.rackLocation);
  const [sellingPrice, setSellingPrice] = useState(item.sellingPrice.toString());
  const [costPrice, setCostPrice] = useState(item.costPrice.toString());
  const [reorderLevel, setReorderLevel] = useState(item.reorderLevel.toString());
  const [description, setDescription] = useState(item.description);

  // Approval request specific fields
  const [approvalReason, setApprovalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedSelling = parseFloat(sellingPrice);
    const parsedCost = parseFloat(costPrice);
    const parsedReorder = parseInt(reorderLevel, 10);

    if (isNaN(parsedSelling) || parsedSelling <= 0) {
      setErrorMsg('Please specify a valid selling price greater than ₹0.');
      return;
    }
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      setErrorMsg('Please specify a valid reorder level (0 or greater).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Direct admin update
        const updated = await inventoryService.updateItem(item.id, {
          name: name.trim(),
          sku: sku.trim(),
          materialSubtype: materialSubtype.trim(),
          rackLocation: rackLocation.trim(),
          sellingPrice: parsedSelling,
          costPrice: isNaN(parsedCost) ? item.costPrice : parsedCost,
          reorderLevel: parsedReorder,
          description: description.trim(),
        });

        addNotification({
          title: 'Item Updated Successfully',
          message: `${item.name} (${item.sku}) master record was updated.`,
          type: 'success',
        });

        onItemUpdated(updated);
        onClose();
      } else {
        // Non-admin approval request
        if (!approvalReason.trim()) {
          setErrorMsg('Please provide a justification reason for your edit request.');
          setIsSubmitting(false);
          return;
        }

        const changes: string[] = [];
        if (parsedSelling !== item.sellingPrice) {
          changes.push(`Price: ${formatINR(item.sellingPrice)} ➔ ${formatINR(parsedSelling)}`);
        }
        if (name.trim() !== item.name) {
          changes.push(`Name change to "${name.trim()}"`);
        }
        if (parsedReorder !== item.reorderLevel) {
          changes.push(`Reorder level: ${item.reorderLevel} ➔ ${parsedReorder}`);
        }
        if (rackLocation.trim() !== item.rackLocation) {
          changes.push(`Location: ${item.rackLocation} ➔ ${rackLocation.trim()}`);
        }

        const changeSummary = changes.length > 0 ? changes.join('; ') : 'General item metadata adjustments';

        await approvalsService.createApproval({
          type: 'item_edit',
          targetId: item.id,
          targetTitle: `${item.name} (${item.sku})`,
          requestedBy: user?.name || 'Staff User',
          requestedByRole: user?.role || 'staff',
          oldValue: `Current Price: ${formatINR(item.sellingPrice)}, Reorder: ${item.reorderLevel}`,
          newValue: changeSummary,
          reason: approvalReason.trim(),
        });

        addNotification({
          title: 'Approval Request Submitted',
          message: `Your changes to ${item.name} have been queued for administrator approval.`,
          type: 'info',
        });

        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060A]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAdmin ? 'bg-accent-orange/10 text-accent-orange' : 'bg-amber-500/10 text-amber-500'}`}>
              {isAdmin ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F2F4F8]">
                {isAdmin ? 'Edit Master Record' : 'Request Item Modification'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                {isAdmin ? 'Direct administrator master update' : 'Non-admin changes require Admin approval'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {!isAdmin && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 dark:text-amber-400 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold">Approval Workflow Active</p>
                <p className="mt-0.5 text-amber-600 dark:text-amber-400/90">
                  You are logged in as <strong className="capitalize">{user?.role}</strong>. Your submitted edits will generate an Approval Request and will take effect once reviewed by an Admin or Owner.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SKU Identifier *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 text-sm font-mono template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sub-Type Classification
              </label>
              <input
                type="text"
                value={materialSubtype}
                onChange={(e) => setMaterialSubtype(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Warehouse Rack / Bin Location
              </label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price (₹ excl GST) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reorder Threshold ({item.unit}) *
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cost Price (₹ excl GST) <span className="text-accent-orange text-[10px]">ADMIN ONLY</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Specification & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
            />
          </div>

          {!isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Change (Sent with Approval Request) *
              </label>
              <textarea
                rows={2}
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="e.g. Supplier notified 3% price adjustment; moving from Bay A to Bay B"
                required
                className="w-full px-3 py-2 text-sm template-input border border-amber-500/30 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
                isAdmin
                  ? 'bg-accent-orange hover:bg-accent-orange/90'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  {isAdmin ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  <span>{isAdmin ? 'Save Master Record' : 'Submit for Admin Approval'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
