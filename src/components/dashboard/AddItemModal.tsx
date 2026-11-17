import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { inventoryService } from '../../services/inventoryService';
import { MaterialCategory } from '../../types/inventory';
import {
  PRODUCT_CATEGORIES,
  MATERIAL_CATEGORIES,
  getAllCategories,
  saveCustomCategory,
} from '../../data/materialCategories';
import { MaterialCategoryInfo } from '../../types/inventory';
import { useAuthStore } from '../../store/authStore';
import { PackagePlus, Layers, Image as ImageIcon, Upload, Trash2, Plus, X } from 'lucide-react';
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
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'owner' || user?.role === 'admin';

  const [categoriesList, setCategoriesList] = useState<MaterialCategoryInfo[]>(() => getAllCategories());
  const [showAddCustomCategory, setShowAddCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [subcategory, setSubcategory] = useState('');
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('card_holder');
  const [subtype, setSubtype] = useState('Rigid ID Badge Sleeve');
  const [currentStock, setCurrentStock] = useState<number>(450);
  const [unit, setUnit] = useState<PredefinedUnit>('PCS');
  const [reorderLevel, setReorderLevel] = useState<number>(100);
  const [reorderQuantity, setReorderQuantity] = useState<number>(250);
  const [selectedPackagingCategory, setSelectedPackagingCategory] = useState<'BOX' | 'CTN' | 'BDL' | 'none'>('BOX');
  const [boxMultiplier, setBoxMultiplier] = useState<number>(20);
  const [cartonMultiplier, setCartonMultiplier] = useState<number>(100);
  const [bundleMultiplier, setBundleMultiplier] = useState<number>(25);
  const [costPrice, setCostPrice] = useState<number>(22);
  const [sellingPrice, setSellingPrice] = useState<number>(36);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState('392690');
  const [warehouseId, setWarehouseId] = useState('wh-001');
  const [rackLocation, setRackLocation] = useState('Rack B2-01');
  const [supplierId, setSupplierId] = useState('sup-001');
  const [imageUrl, setImageUrl] = useState('/products/card-holder.svg');
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCategory('card_holder');
      setSubcategory('');
      setIsCustomSubcategory(false);
      setCustomSubcategoryInput('');
      setCategoriesList(getAllCategories());
      setShowAddCustomCategory(false);
      setNewCategoryName('');
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

  const selectedCategoryMeta = categoriesList.find((c) => c.id === category) || MATERIAL_CATEGORIES.find((c) => c.id === category);

  const handleCategoryChange = (cat: MaterialCategory) => {
    setCategory(cat);
    const meta = categoriesList.find((c) => c.id === cat) || MATERIAL_CATEGORIES.find((c) => c.id === cat);
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

  const handleSaveCustomCategory = () => {
    if (!isAdmin) {
      setError('Only Admin has permission to add custom categories.');
      return;
    }
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const catId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCat: MaterialCategoryInfo = {
      id: catId as any,
      name: trimmed,
      description: `Custom category: ${trimmed}`,
      subtypes: [],
      defaultHsn: '',
      defaultGstRate: 0,
      iconName: 'Boxes',
      imageUrl: '/products/card-holder.svg',
    };
    saveCustomCategory(newCat);
    const updated = getAllCategories();
    setCategoriesList(updated);
    setCategory(catId as any);
    setNewCategoryName('');
    setShowAddCustomCategory(false);
  };

  const handleRemoveSubcategory = () => {
    setSubcategory('');
    setCustomSubcategoryInput('');
    setIsCustomSubcategory(false);
  };

  const generateSku = (cat: string, prodName: string): string => {
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

      const finalSubtype = isCustomSubcategory
        ? customSubcategoryInput.trim()
        : subcategory.trim();

      await inventoryService.createItem({
        name: name.trim(),
        sku: autoSku,
        materialCategory: category,
        materialSubtype: finalSubtype || 'Standard',
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

          {/* Product Category Section with Admin-only Custom Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Product Category *
              </label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddCustomCategory(!showAddCustomCategory)}
                  className="text-[11px] font-semibold text-accent-orange hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddCustomCategory ? 'Cancel' : 'Custom Category'}</span>
                </button>
              )}
            </div>

            {showAddCustomCategory && isAdmin ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter new category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-accent-orange bg-slate-50 dark:bg-[#1A1D26] px-3 py-2 text-slate-800 dark:text-[#F2F4F8] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomCategory}
                  className="px-3 py-2 bg-accent-orange text-white text-xs font-bold rounded-xl shrink-0"
                >
                  Save
                </button>
              </div>
            ) : null}

            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-accent-orange cursor-pointer"
            >
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#12151D]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Category Section (With Admin-only Custom option and Remove option) */}
          <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Sub Category (Optional)</span>
                {isAdmin && (
                  <span className="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.2 rounded font-bold">
                    Admin
                  </span>
                )}
              </label>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCustomSubcategory(!isCustomSubcategory)}
                    className="text-[11px] font-semibold text-accent-blue hover:underline"
                  >
                    {isCustomSubcategory ? 'Choose from list' : '+ Custom Subcategory'}
                  </button>
                )}

                {/* Remove Subcategory Option */}
                {(subcategory || customSubcategoryInput) && (
                  <button
                    type="button"
                    onClick={handleRemoveSubcategory}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
                    title="Remove subcategory"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove Subcategory</span>
                  </button>
                )}
              </div>
            </div>

            {isCustomSubcategory ? (
              <div>
                <input
                  type="text"
                  placeholder={isAdmin ? 'Type your custom subcategory...' : 'Only Admin can define custom subcategories'}
                  value={customSubcategoryInput}
                  onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                  disabled={!isAdmin}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-accent-orange disabled:opacity-60"
                />
                {!isAdmin && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    Only administrators have permission to type custom subcategories.
                  </p>
                )}
              </div>
            ) : (
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-accent-orange cursor-pointer"
              >
                <option value="">None / Unassigned Subcategory</option>
                {(categoriesList.find((c) => c.id === category)?.subtypes || []).map((sub) => (
                  <option key={sub} value={sub} className="bg-white dark:bg-[#12151D]">
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>

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
        </div>

        {/* Product-Specific Packaging Conversions by Category */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Packaging Conversions (Base Unit: {unit === 'UNT' ? 'UNT' : 'PCS'})
              </span>
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
                    onChange={(e) => setBoxMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                  />
                )}
                {selectedPackagingCategory === 'CTN' && (
                  <input
                    type="number"
                    min="1"
                    value={cartonMultiplier}
                    onChange={(e) => setCartonMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-28 px-3 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                  />
                )}
                {selectedPackagingCategory === 'BDL' && (
                  <input
                    type="number"
                    min="1"
                    value={bundleMultiplier}
                    onChange={(e) => setBundleMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
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
