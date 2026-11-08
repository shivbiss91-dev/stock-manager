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
  Eye,
  Maximize2,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';
import { ComputedInventoryItem, MaterialCategory } from '../../types/inventory';
import { PRODUCT_CATEGORIES } from '../../data/materialCategories';
import { useAuthStore } from '../../store/authStore';
import { inventoryService } from '../../services/inventoryService';
import { approvalsService } from '../../services/approvalsService';
import { useNotificationStore } from '../../store/notificationStore';
import { formatINR } from '../../utils/formatINR';
import { PackagingConversions } from '../../utils/unitConversions';
import { ProductImage } from '../common/ProductImage';

interface EditItemModalProps {
  item: ComputedInventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updated: ComputedInventoryItem) => void;
  onItemDeleted?: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>(item.materialCategory);
  
  // Image editing state
  const [imageUrl, setImageUrl] = useState(item.images[0] || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [imageFileInfo, setImageFileInfo] = useState<{ name: string; size: string } | null>(null);

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

  // Approval request specific fields
  const [approvalReason, setApprovalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(item.name);
      setMaterialCategory(item.materialCategory);
      setImageUrl(item.images[0] || '');
      setImageFileInfo(null);
      setImageError(null);
      setImageSuccess(null);
      setShowRemoveConfirm(false);
      setIsFullPreviewOpen(false);
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

  // Handle image file selection with validation
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    setImageSuccess(null);
    setShowRemoveConfirm(false);

    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file format (JPG, JPEG, PNG, WEBP)
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const isExtValid = ALLOWED_EXTENSIONS.test(file.name);
    if (!isMimeValid && !isExtValid) {
      setImageError('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size (max 5 MB)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setImageError(`Image size (${sizeMb} MB) exceeds the 5 MB limit. Please upload an image under 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Read file as Base64 Data URL (permanent client storage, immune to URL.createObjectURL revocation)
    setIsUploading(true);
    setUploadProgress(25);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(95, Math.round((event.loaded / event.total) * 100));
        setUploadProgress(percent);
      }
    };

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setUploadProgress(100);
        const readableSize =
          file.size >= 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        setImageFileInfo({ name: file.name, size: readableSize });
        setImageSuccess(`New image "${file.name}" loaded for preview. Click "Save Master Record" to persist.`);
      }
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 350);
    };

    reader.onerror = () => {
      setIsUploading(false);
      setUploadProgress(null);
      setImageError('Failed to read image file. Please try another image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImageConfirmed = () => {
    setImageUrl('');
    setImageFileInfo(null);
    setShowRemoveConfirm(false);
    setImageError(null);
    setImageSuccess('Product image removed. The catalogue will display the default category placeholder upon saving.');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRevertImage = () => {
    setImageUrl(item.images[0] || '');
    setImageFileInfo(null);
    setImageError(null);
    setImageSuccess(null);
    setShowRemoveConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteItem = async () => {
    setIsDeleting(true);
    try {
      await inventoryService.deleteItem(item.id);
      addNotification({
        title: 'Product Deleted',
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

    const updatedPackaging: PackagingConversions = {
      baseUnit: item.unit === 'UNT' ? 'UNT' : 'PCS',
      dozenMultiplier: 12,
      boxMultiplier: parsedBox,
      cartonMultiplier: parsedCarton,
      bundleMultiplier: parsedBundle,
    };

    // Correctly reflect image removal: if imageUrl is empty, images array is empty
    const finalImages = imageUrl.trim() ? [imageUrl.trim()] : [];

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        // Direct admin update (preserves SKU, HSN, GST, warehouse, and rack location data)
        const updated = await inventoryService.updateItem(item.id, {
          name: name.trim(),
          sku: item.sku,
          materialCategory,
          images: finalImages,
          hsnCode: item.hsnCode,
          gstRate: item.gstRate,
          warehouseId: item.warehouseId || '',
          warehouseName: item.warehouseName || 'Unassigned',
          unit: item.unit,
          materialSubtype: item.materialSubtype || '',
          rackLocation: item.rackLocation || '',
          sellingPrice: parsedSelling,
          costPrice: parsedCost,
          reorderLevel: parsedReorder,
          reorderQuantity: parsedReorderQty,
          packagingConversions: updatedPackaging,
          description: description.trim(),
        });

        addNotification({
          title: 'Product Information Updated',
          message: `${item.name} (${item.sku}) master record and product image saved.`,
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
        if (imageUrl !== (item.images[0] || '')) {
          changes.push(imageUrl ? 'Updated product image' : 'Removed product image');
        }
        if (parsedSelling !== item.sellingPrice) {
          changes.push(`Price: ${formatINR(item.sellingPrice)} ➔ ${formatINR(parsedSelling)}`);
        }
        if (parsedCost !== item.costPrice) {
          changes.push(`Cost: ${formatINR(item.costPrice)} ➔ ${formatINR(parsedCost)}`);
        }
        if (name.trim() !== item.name) {
          changes.push(`Name change to "${name.trim()}"`);
        }
        if (materialCategory !== item.materialCategory) {
          changes.push(`Category: ${item.materialCategory} ➔ ${materialCategory}`);
        }
        if (parsedReorder !== item.reorderLevel) {
          changes.push(`Threshold: ${item.reorderLevel} ➔ ${parsedReorder}`);
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

  const hasImageChanged = imageUrl !== (item.images[0] || '');

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
                {isAdmin ? 'Edit Product Information' : 'Request Product Modification'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                Manage product image, identity, pricing, thresholds, and catalogue details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
            title="Close without saving"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
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

          {/* 1. PRODUCT IMAGE EDITING & MANAGEMENT SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.07] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent-orange/10 text-accent-orange">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Product Image Management
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Upload, replace, preview, or remove the product catalogue photo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasImageChanged && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange border border-accent-orange/30 animate-pulse">
                    Unsaved Image Changes
                  </span>
                )}
                {!imageUrl && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    Default Placeholder
                  </span>
                )}
              </div>
            </div>

            {/* Image Preview & Controls */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-1">
              {/* Thumbnail / Large Preview */}
              <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-white/15 bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-inner">
                <ProductImage
                  src={imageUrl}
                  alt={name}
                  category={materialCategory}
                  className="w-full h-full object-cover"
                  fallbackIconSize={26}
                />

                {/* Hover overlay with zoom button */}
                {imageUrl && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsFullPreviewOpen(true)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all"
                      title="Enlarge preview"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons & Status */}
              <div className="flex-1 space-y-2.5 w-full">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-accent-orange hover:bg-accent-orange/90 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Reading File...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{imageUrl ? 'Replace Image' : 'Upload New Image'}</span>
                      </>
                    )}
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setIsFullPreviewOpen(true)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-1.5 transition-colors"
                      title="Preview current image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  )}

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setShowRemoveConfirm(true)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-1.5 transition-colors"
                      title="Remove product image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}

                  {hasImageChanged && (
                    <button
                      type="button"
                      onClick={handleRevertImage}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04] flex items-center gap-1 transition-colors"
                      title="Discard image changes and restore original"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert</span>
                    </button>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {isUploading && uploadProgress !== null && (
                  <div className="space-y-1">
                    <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-accent-orange h-full rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Loading image... {uploadProgress}%</span>
                  </div>
                )}

                {/* Success message banner */}
                {imageSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{imageSuccess}</span>
                  </div>
                )}

                {/* Error message banner */}
                {imageError && (
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {/* Remove Confirmation Dialog */}
                {showRemoveConfirm && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Remove this product image? The product will display the default category placeholder upon saving.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRemoveImageConfirmed}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm"
                      >
                        Yes, Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(false)}
                        className="px-3 py-1 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium"
                      >
                        Keep Image
                      </button>
                    </div>
                  </div>
                )}

                {/* Image metadata or URL input */}
                <div className="pt-0.5 space-y-1">
                  {imageFileInfo ? (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>{imageFileInfo.name}</span>
                      <span>•</span>
                      <span>{imageFileInfo.size}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">
                      Formats allowed: <strong>JPG, JPEG, PNG, WEBP</strong> (Max: 5 MB)
                    </div>
                  )}

                  {/* Optional direct URL input */}
                  <input
                    type="text"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFileInfo(null);
                      setImageError(null);
                      setImageSuccess(null);
                    }}
                    placeholder={
                      imageUrl.startsWith('data:')
                        ? 'Using uploaded custom image file'
                        : 'Or paste external image URL (e.g. /products/card-holder.svg or https://...)'
                    }
                    disabled={imageUrl.startsWith('data:')}
                    className="w-full px-2.5 py-1 text-[11px] template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-orange/30 disabled:opacity-50"
                  />
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
                className="w-full px-3 py-2 text-sm template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
              />
            </div>
          </div>



          {/* Stock Thresholds */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Stock Thresholds & Reorder Rules
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Stock Threshold ({item.unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Recommended Reorder Quantity ({item.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderQuantity}
                  onChange={(e) => setReorderQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>
            </div>
          </div>

          {/* Packaging Multipliers */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-orange" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Packaging Conversions (Base Unit: {item.unit})
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Box (BOX)
                </label>
                <input
                  type="number"
                  min="1"
                  value={boxMultiplier}
                  onChange={(e) => setBoxMultiplier(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Carton (CTN)
                </label>
                <input
                  type="number"
                  min="1"
                  value={cartonMultiplier}
                  onChange={(e) => setCartonMultiplier(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bundle (BDL)
                </label>
                <input
                  type="number"
                  min="1"
                  value={bundleMultiplier}
                  onChange={(e) => setBundleMultiplier(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed product specifications, notes, or storage precautions..."
              className="w-full px-3 py-2 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
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
                placeholder="e.g. Updating product photo, price adjustment, or SKU setup"
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

      {/* Full Image Preview Modal Lightbox */}
      {isFullPreviewOpen && imageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsFullPreviewOpen(false)}
        >
          <div
            className="max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col items-center space-y-3 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white truncate max-w-sm">
                Image Preview: {name} ({sku})
              </span>
              <button
                type="button"
                onClick={() => setIsFullPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-black/60 flex items-center justify-center p-2">
              <ProductImage
                src={imageUrl}
                alt={name}
                category={materialCategory}
                className="max-w-full max-h-[55vh] object-contain rounded-lg"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {imageUrl.startsWith('data:') ? 'Uploaded custom photo (Base64 encoded)' : `Image source: ${imageUrl}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
