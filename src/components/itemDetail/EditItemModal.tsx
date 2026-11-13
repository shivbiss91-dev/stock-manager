import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ShieldAlert, FileText, Layers } from 'lucide-react';
import { ComputedInventoryItem } from '../../types/inventory';
import { useAuthStore } from '../../store/authStore';
import { inventoryService } from '../../services/inventoryService';
import { approvalsService } from '../../services/approvalsService';
import { useNotificationStore } from '../../store/notificationStore';
import { formatINR } from '../../utils/formatINR';
import {
  PREDEFINED_UNITS,
  PredefinedUnit,
  normalizeUnitCode,
  PackagingConversions,
  DEFAULT_PACKAGING_CONVERSIONS,
} from '../../utils/unitConversions';

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
  const [unit, setUnit] = useState<PredefinedUnit>(normalizeUnitCode(item.unit));
  const [materialSubtype, setMaterialSubtype] = useState(item.materialSubtype);
  const [rackLocation, setRackLocation] = useState(item.rackLocation);
  const [sellingPrice, setSellingPrice] = useState(item.sellingPrice.toString());
  const [costPrice, setCostPrice] = useState(item.costPrice.toString());
  const [reorderLevel, setReorderLevel] = useState(item.reorderLevel.toString());
  const [reorderQuantity, setReorderQuantity] = useState(
    (item.reorderQuantity || item.reorderLevel * 2).toString()
  );
  const [boxMultiplier, setBoxMultiplier] = useState(
    (item.packagingConversions?.boxMultiplier || 20).toString()
  );
  const [cartonMultiplier, setCartonMultiplier] = useState(
    (item.packagingConversions?.cartonMultiplier || 100).toString()
  );
  const [bundleMultiplier, setBundleMultiplier] = useState(
    (item.packagingConversions?.bundleMultiplier || 25).toString()
  );
  const [selectedPackagingCategory, setSelectedPackagingCategory] = useState<'BOX' | 'CTN' | 'BDL' | 'none'>('BOX');
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
    const parsedReorderQty = parseInt(reorderQuantity, 10) || parsedReorder * 2;
    const parsedBox = parseInt(boxMultiplier, 10) || 20;
    const parsedCarton = parseInt(cartonMultiplier, 10) || 100;
    const parsedBundle = parseInt(bundleMultiplier, 10) || 25;

    if (isNaN(parsedSelling) || parsedSelling <= 0) {
      setErrorMsg('Please specify a valid selling price greater than ₹0.');
      return;
    }
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      setErrorMsg('Please specify a valid reorder level (0 or greater).');
      return;
    }

    const updatedPackaging: PackagingConversions = {
      baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
      dozenMultiplier: 12,
      boxMultiplier: parsedBox,
      cartonMultiplier: parsedCarton,
      bundleMultiplier: parsedBundle,
    };

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Direct admin update
        const updated = await inventoryService.updateItem(item.id, {
          name: name.trim(),
          sku: sku.trim(),
          unit,
          materialSubtype: materialSubtype.trim(),
          rackLocation: rackLocation.trim(),
          sellingPrice: parsedSelling,
          costPrice: isNaN(parsedCost) ? item.costPrice : parsedCost,
          reorderLevel: parsedReorder,
          reorderQuantity: parsedReorderQty,
          packagingConversions: updatedPackaging,
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
        if (unit !== item.unit) {
          changes.push(`Unit: ${item.unit} ➔ ${unit}`);
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
                Unit of Measurement *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as PredefinedUnit)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              >
                {PREDEFINED_UNITS.map((u) => (
                  <option key={u.code} value={u.code} className="dark:bg-dark-card">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Minimum Stock Threshold ({unit}) *
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Suggested Reorder Quantity ({unit}) *
              </label>
              <input
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
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

          {/* Product-Specific Packaging Conversions Configuration by Category */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-orange" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Packaging Conversions (Base Unit: {unit === 'UNT' ? 'UNT' : 'PCS'})
                </h4>
              </div>
              {selectedPackagingCategory !== 'none' && (
                <button
                  type="button"
                  onClick={() => setSelectedPackagingCategory('none')}
                  className="text-[11px] text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 font-semibold"
                  title="Cancel packaging and use direct pieces"
                >
                  <span>✕ Cancel / Direct {unit === 'UNT' ? 'UNT' : 'PCS'}</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Packaging Category (Select One)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'None (Direct)', desc: 'Individual items' },
                  { id: 'BOX', label: 'Box (BOX)', desc: 'Packed in boxes' },
                  { id: 'CTN', label: 'Carton (CTN)', desc: 'Packed in cartons' },
                  { id: 'BDL', label: 'Bundle (BDL)', desc: 'Packed in bundles' },
                ].map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackagingCategory(pkg.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedPackagingCategory === pkg.id
                        ? 'bg-brand-orange/15 border-brand-orange text-brand-orange ring-1 ring-brand-orange'
                        : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="font-bold text-xs block text-slate-900 dark:text-white">
                      {pkg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {pkg.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedPackagingCategory === 'none' ? (
              <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-dashed border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>This item has no packaging multiplier. Handled directly as individual {unit === 'UNT' ? 'units' : 'pieces'}.</span>
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Direct Unit</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {selectedPackagingCategory === 'BOX' && `Box Conversion: How many ${unit === 'UNT' ? 'UNT' : 'PCS'} in 1 Box?`}
                    {selectedPackagingCategory === 'CTN' && `Carton Conversion: How many ${unit === 'UNT' ? 'UNT' : 'PCS'} in 1 Carton?`}
                    {selectedPackagingCategory === 'BDL' && `Bundle Conversion: How many ${unit === 'UNT' ? 'UNT' : 'PCS'} in 1 Bundle?`}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedPackagingCategory('none')}
                    className="text-[10.5px] text-rose-400 hover:text-rose-500 transition-colors font-medium"
                  >
                    ✕ Cancel & Remove
                  </button>
                </div>

                <div className="flex items-center gap-2 max-w-sm">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    1 {selectedPackagingCategory} =
                  </span>
                  {selectedPackagingCategory === 'BOX' && (
                    <input
                      type="number"
                      min="1"
                      value={boxMultiplier}
                      onChange={(e) => setBoxMultiplier(e.target.value)}
                      className="w-28 px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  )}
                  {selectedPackagingCategory === 'CTN' && (
                    <input
                      type="number"
                      min="1"
                      value={cartonMultiplier}
                      onChange={(e) => setCartonMultiplier(e.target.value)}
                      className="w-28 px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  )}
                  {selectedPackagingCategory === 'BDL' && (
                    <input
                      type="number"
                      min="1"
                      value={bundleMultiplier}
                      onChange={(e) => setBundleMultiplier(e.target.value)}
                      className="w-28 px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                    />
                  )}
                  <span className="text-xs text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Only this single selected packaging type is applied. All other packaging sections are cancelled and ignored.
                </p>
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
