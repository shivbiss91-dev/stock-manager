import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  FileText,
  Layers,
  Image as ImageIcon,
  Upload,
  Trash2,
  Building2,
  Percent,
  Hash,
} from 'lucide-react';
import { ComputedInventoryItem, MaterialCategory } from '../../types/inventory';
import { Warehouse } from '../../types/warehouse';
import { PRODUCT_CATEGORIES } from '../../data/materialCategories';
import { useAuthStore } from '../../store/authStore';
import { inventoryService } from '../../services/inventoryService';
import { warehouseService } from '../../services/warehouseService';
import { approvalsService } from '../../services/approvalsService';
import { useNotificationStore } from '../../store/notificationStore';
import { formatINR } from '../../utils/formatINR';
import {
  PREDEFINED_UNITS,
  PredefinedUnit,
  normalizeUnitCode,
  PackagingConversions,
} from '../../utils/unitConversions';

interface EditItemModalProps {
  item: ComputedInventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updated: ComputedInventoryItem) => void;
  onItemDeleted?: () => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onItemUpdated,
  onItemDeleted,
}) => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku);
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>(item.materialCategory);
  const [imageUrl, setImageUrl] = useState(item.images[0] || '');
  const [hsnCode, setHsnCode] = useState(item.hsnCode || '');
  const [gstRate, setGstRate] = useState((item.gstRate ?? 0).toString());
  const [warehouseId, setWarehouseId] = useState(item.warehouseId || '');
  const [unit, setUnit] = useState<PredefinedUnit>(normalizeUnitCode(item.unit));
  const [materialSubtype, setMaterialSubtype] = useState(item.materialSubtype);
  const [rackLocation, setRackLocation] = useState(item.rackLocation);
  const [sellingPrice, setSellingPrice] = useState(item.sellingPrice.toString());
  const [costPrice, setCostPrice] = useState(item.costPrice.toString());
  const [reorderLevel, setReorderLevel] = useState(item.reorderLevel.toString());
  const [reorderQuantity, setReorderQuantity] = useState(
    (item.reorderQuantity || (item.reorderLevel > 0 ? item.reorderLevel * 2 : 10)).toString()
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
  const [description, setDescription] = useState(item.description);

  // Available warehouses loaded from service
  const [availableWarehouses, setAvailableWarehouses] = useState<Warehouse[]>([]);

  // Approval request specific fields
  const [approvalReason, setApprovalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    warehouseService.getWarehouses().then(setAvailableWarehouses);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(item.name);
      setSku(item.sku);
      setMaterialCategory(item.materialCategory);
      setImageUrl(item.images[0] || '');
      setHsnCode(item.hsnCode || '');
      setGstRate((item.gstRate ?? 0).toString());
      setWarehouseId(item.warehouseId || '');
      setUnit(normalizeUnitCode(item.unit));
      setMaterialSubtype(item.materialSubtype);
      setRackLocation(item.rackLocation);
      setSellingPrice(item.sellingPrice.toString());
      setCostPrice(item.costPrice.toString());
      setReorderLevel(item.reorderLevel.toString());
      setReorderQuantity(
        (item.reorderQuantity || (item.reorderLevel > 0 ? item.reorderLevel * 2 : 10)).toString()
      );
      setBoxMultiplier((item.packagingConversions?.boxMultiplier || 20).toString());
      setCartonMultiplier((item.packagingConversions?.cartonMultiplier || 100).toString());
      setBundleMultiplier((item.packagingConversions?.bundleMultiplier || 25).toString());
      setDescription(item.description);
      setErrorMsg(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  // Handle image file selection
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    try {
      await inventoryService.deleteItem(item.id);
      addNotification({
        title: 'Item Deleted',
        message: `${item.name} (${item.sku}) was deleted from the catalogue.`,
        type: 'info',
      });
      if (onItemDeleted) {
        onItemDeleted();
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item';
      setErrorMsg(msg);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedSelling = parseFloat(sellingPrice);
    const parsedCost = parseFloat(costPrice);
    const parsedGst = parseFloat(gstRate);
    const parsedReorder = parseInt(reorderLevel, 10);
    const parsedReorderQty = parseInt(reorderQuantity, 10) || (parsedReorder > 0 ? parsedReorder * 2 : 10);
    const parsedBox = parseInt(boxMultiplier, 10) || 20;
    const parsedCarton = parseInt(cartonMultiplier, 10) || 100;
    const parsedBundle = parseInt(bundleMultiplier, 10) || 25;

    if (isNaN(parsedSelling) || parsedSelling < 0) {
      setErrorMsg('Please specify a valid non-negative selling price (e.g. 0 or higher).');
      return;
    }
    if (isNaN(parsedCost) || parsedCost < 0) {
      setErrorMsg('Please specify a valid non-negative purchase/cost price (e.g. 0 or higher).');
      return;
    }
    if (isNaN(parsedReorder) || parsedReorder < 0) {
      setErrorMsg('Please specify a valid minimum stock threshold (0 or greater).');
      return;
    }

    const selectedWh = availableWarehouses.find((w) => w.id === warehouseId);
    const warehouseName = selectedWh ? selectedWh.name : (warehouseId ? 'Assigned Facility' : 'Unassigned');

    const updatedPackaging: PackagingConversions = {
      baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
      dozenMultiplier: 12,
      boxMultiplier: parsedBox,
      cartonMultiplier: parsedCarton,
      bundleMultiplier: parsedBundle,
    };

    const finalImages = imageUrl.trim() ? [imageUrl.trim()] : item.images;

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Direct admin update
        const updated = await inventoryService.updateItem(item.id, {
          name: name.trim(),
          sku: sku.trim(),
          materialCategory,
          images: finalImages,
          hsnCode: hsnCode.trim(),
          gstRate: isNaN(parsedGst) ? 0 : parsedGst,
          warehouseId: warehouseId.trim(),
          warehouseName,
          unit,
          materialSubtype: materialSubtype.trim(),
          rackLocation: rackLocation.trim(),
          sellingPrice: parsedSelling,
          costPrice: parsedCost,
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
        if (parsedCost !== item.costPrice) {
          changes.push(`Cost: ${formatINR(item.costPrice)} ➔ ${formatINR(parsedCost)}`);
        }
        if (name.trim() !== item.name) {
          changes.push(`Name change to "${name.trim()}"`);
        }
        if (sku.trim() !== item.sku) {
          changes.push(`SKU: ${item.sku} ➔ ${sku.trim()}`);
        }
        if (hsnCode.trim() !== item.hsnCode) {
          changes.push(`HSN: "${item.hsnCode}" ➔ "${hsnCode.trim()}"`);
        }
        if (unit !== item.unit) {
          changes.push(`Unit: ${item.unit} ➔ ${unit}`);
        }
        if (parsedReorder !== item.reorderLevel) {
          changes.push(`Threshold: ${item.reorderLevel} ➔ ${parsedReorder}`);
        }
        if (warehouseId !== item.warehouseId) {
          changes.push(`Warehouse: ${item.warehouseName} ➔ ${warehouseName}`);
        }

        const changeSummary = changes.length > 0 ? changes.join('; ') : 'General item metadata adjustments';

        await approvalsService.createApproval({
          type: 'item_edit',
          targetId: item.id,
          targetTitle: `${item.name} (${item.sku})`,
          requestedBy: user?.name || 'Staff User',
          requestedByRole: user?.role || 'staff',
          oldValue: `Current Price: ${formatINR(item.sellingPrice)}, Threshold: ${item.reorderLevel}`,
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
            <div
              className={`p-2 rounded-xl ${
                isAdmin
                  ? 'bg-accent-orange/10 text-accent-orange'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              {isAdmin ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F2F4F8]">
                {isAdmin ? 'Edit Master Record' : 'Request Item Modification'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                Configure product identity, image, pricing, threshold, and packaging
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

          {/* Product Image Section (Replaceable) */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent-orange" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Product Image (Relevant & Replaceable)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">URL or File Upload</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.1] bg-slate-900 flex-shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/products/card-holder.svg';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g. /products/card-holder.svg or https://...)"
                  className="w-full px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Local Image File</span>
                  </button>
                  {imageUrl !== (item.images[0] || '') && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(item.images[0] || '')}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                    >
                      Reset to Starter Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Product Identity Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Product Name *
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
                Product Category *
              </label>
              <select
                value={materialCategory}
                onChange={(e) => setMaterialCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30 capitalize"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#12151D]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purchase Price (₹ excl GST) * (Entered Manually)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Selling Price (₹ excl GST) * (Entered Manually)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit of Measurement * (Approved Units)
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
                Minimum Stock Threshold ({unit}) * (Manually Configurable)
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
                Suggested Reorder Quantity ({unit})
              </label>
              <input
                type="number"
                min="0"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>
          </div>

          {/* Product-Specific Packaging Conversions Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-orange" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Packaging Multipliers & Conversions (Base: {unit === 'UNT' ? 'UNT' : 'PCS'})
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                <span className="text-slate-500 block mb-1">1 Dozen (DOZ)</span>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  12 {unit === 'UNT' ? 'UNT' : 'PCS'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Fixed standard</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1 Box (BOX) =
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={boxMultiplier}
                    onChange={(e) => setBoxMultiplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1 Carton (CTN) =
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={cartonMultiplier}
                    onChange={(e) => setCartonMultiplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1 Bundle (BDL) =
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={bundleMultiplier}
                    onChange={(e) => setBundleMultiplier(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
                </div>
              </div>
            </div>
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
                placeholder="e.g. Setting up SKU, HSN, price, or warehouse location"
                required
                className="w-full px-3 py-2 text-sm template-input border border-amber-500/30 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>
          )}

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Are you sure you want to permanently delete <strong>{item.name}</strong> ({item.sku})? This record will be removed from your catalog.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Product'}
                </button>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              {!showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-1.5 border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
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
          </div>
        </form>
      </div>
    </div>
  );
};
