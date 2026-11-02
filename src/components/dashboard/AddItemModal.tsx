import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { inventoryService } from '../../services/inventoryService';
import { MaterialCategory } from '../../types/inventory';
import { MATERIAL_CATEGORIES } from '../../data/materialCategories';
import { PackagePlus, Layers, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import {
  PREDEFINED_UNITS,
  PredefinedUnit,
  PackagingConversions,
} from '../../utils/unitConversions';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('card_holder');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [unit, setUnit] = useState<PredefinedUnit>('PCS');
  const [reorderLevel, setReorderLevel] = useState<number>(0);
  const [reorderQuantity, setReorderQuantity] = useState<number>(0);
  const [boxMultiplier, setBoxMultiplier] = useState<number>(20);
  const [cartonMultiplier, setCartonMultiplier] = useState<number>(100);
  const [bundleMultiplier, setBundleMultiplier] = useState<number>(25);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('/products/card-holder.svg');
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory('card_holder');
      setCurrentStock(0);
      setUnit('PCS');
      setReorderLevel(0);
      setReorderQuantity(0);
      setBoxMultiplier(20);
      setCartonMultiplier(100);
      setBundleMultiplier(25);
      setCostPrice(0);
      setSellingPrice(0);
      setImageUrl('/products/card-holder.svg');
      setIsCustomImage(false);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const selectedCategoryMeta = MATERIAL_CATEGORIES.find((c) => c.id === category);

  const handleCategoryChange = (cat: MaterialCategory) => {
    setCategory(cat);
    const meta = MATERIAL_CATEGORIES.find((c) => c.id === cat);
    if (!isCustomImage && meta) {
      setImageUrl(meta.imageUrl);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        setIsCustomImage(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageUrl('');
    setIsCustomImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateSku = (cat: MaterialCategory, prodName: string): string => {
    const catPrefixMap: Record<string, string> = {
      card_holder: 'CH',
      lanyard: 'LAN',
      hook: 'HK',
      button_bag: 'BB',
    };
    const prefix = catPrefixMap[cat] || 'PRD';
    const cleanName = prodName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'ITM';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${cleanName}-${randomSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a product title.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const packagingConversions: PackagingConversions = {
        baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
        dozenMultiplier: 12,
        boxMultiplier: Number(boxMultiplier) || 20,
        cartonMultiplier: Number(cartonMultiplier) || 100,
        bundleMultiplier: Number(bundleMultiplier) || 25,
      };

      const finalImages = imageUrl.trim()
        ? [imageUrl.trim()]
        : selectedCategoryMeta
        ? [selectedCategoryMeta.imageUrl]
        : ['/products/card-holder.svg'];

      const autoSku = generateSku(category, name.trim());

      await inventoryService.createItem({
        name: name.trim(),
        sku: autoSku,
        materialCategory: category,
        materialSubtype: 'Standard',
        description: `Industrial catalog item: ${name.trim()}.`,
        currentStock: Number(currentStock) || 0,
        unit,
        baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
        reorderLevel: Number(reorderLevel) || 0,
        reorderQuantity: Number(reorderQuantity) || (Number(reorderLevel) > 0 ? Number(reorderLevel) * 2 : 10),
        packagingConversions,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        gstRate: 0,
        hsnCode: '',
        warehouseId: '',
        warehouseName: 'Unassigned',
        rackLocation: '',
        supplierId: '',
        supplierName: 'Unassigned',
        barcode: '',
        images: finalImages,
        isArchived: false,
      });

      setIsLoading(false);
      onItemAdded();
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Failed to add item.';
      setError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Master Product Record"
      subtitle="Add a new catalog item with image, pricing, and packaging"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Product Image Inserting Section */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent-orange" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Product Image (Upload File or Enter URL)
              </span>
            </div>
            <span className="text-[10px] text-slate-400">JPG, PNG, WebP or SVG</span>
          </div>

          <div className="flex items-start sm:items-center gap-4">
            {/* Interactive Image Preview Box */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#0E1118] flex-shrink-0 flex items-center justify-center group shadow-inner">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || 'Product preview'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      selectedCategoryMeta?.imageUrl || '/products/card-holder.svg';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6 stroke-1" />
                  <span className="text-[9px] mt-1 font-medium">No Image</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              {/* URL Input */}
              <div className="relative">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setIsCustomImage(true);
                  }}
                  placeholder="Paste image URL (e.g. /products/card-holder.svg or https://...)"
                  className="w-full px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-orange/30"
                />
              </div>

              {/* Action Buttons: Choose File & Clear */}
              <div className="flex flex-wrap items-center gap-2">
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
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-accent-orange" />
                  <span>Choose Image File</span>
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-2.5 py-1.5 text-xs rounded-xl text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}

                {isCustomImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl(selectedCategoryMeta?.imageUrl || '/products/card-holder.svg');
                      setIsCustomImage(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                  >
                    Reset to Category Default
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Product Title *"
            placeholder="e.g. Card Holder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Product Category *"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
            options={MATERIAL_CATEGORIES.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <Select
            label="Unit of Measurement *"
            value={unit}
            onChange={(e) => setUnit(e.target.value as PredefinedUnit)}
            options={PREDEFINED_UNITS.map((u) => ({
              value: u.code,
              label: u.label,
            }))}
          />

          <Input
            label="Opening Stock"
            type="number"
            min={0}
            value={currentStock}
            onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
            helperText="Defaults to 0 for starter catalog items."
          />

          <Input
            label="Min Stock Threshold (Reorder Level)"
            type="number"
            min={0}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(Math.max(0, parseInt(e.target.value) || 0))}
          />

          <Input
            label="Purchase / Cost Price (₹ excl. GST) *"
            type="number"
            step="0.01"
            min={0}
            value={costPrice}
            onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0.00"
          />

          <Input
            label="Selling Rate (₹ excl. GST) *"
            type="number"
            step="0.01"
            min={0}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0.00"
          />
        </div>

        {/* Product-Specific Packaging Conversions */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-orange" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Packaging Multipliers & Conversions (Base: {unit === 'UNT' ? 'UNT' : 'PCS'})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <span className="text-slate-400 block text-[11px]">1 Dozen (DOZ)</span>
              <span className="font-extrabold text-slate-800 dark:text-white">12 {unit === 'UNT' ? 'UNT' : 'PCS'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Standard fixed</span>
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
                  onChange={(e) => setBoxMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
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
                  onChange={(e) => setCartonMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
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
                  onChange={(e) => setBundleMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isLoading}
            leftIcon={<PackagePlus className="w-4 h-4" />}
          >
            Create Item Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
