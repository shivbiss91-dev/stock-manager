import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { inventoryService } from '../../services/inventoryService';
import { MaterialCategory, UnitOfMeasurement } from '../../types/inventory';
import { MATERIAL_CATEGORIES } from '../../data/materialCategories';
import { MOCK_SUPPLIERS } from '../../data/suppliers';
import { MOCK_WAREHOUSES } from '../../data/warehouses';
import { PackagePlus, CheckCircle2, Layers } from 'lucide-react';
import {
  PREDEFINED_UNITS,
  PredefinedUnit,
  PackagingConversions,
  DEFAULT_PACKAGING_CONVERSIONS,
} from '../../utils/unitConversions';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategoryMeta = MATERIAL_CATEGORIES.find((c) => c.id === category);

  const handleCategoryChange = (cat: MaterialCategory) => {
    setCategory(cat);
    const meta = MATERIAL_CATEGORIES.find((c) => c.id === cat);
    if (meta) {
      setSubtype(meta.subtypes[0] || 'Standard');
      setHsnCode(meta.defaultHsn);
      setGstRate(meta.defaultGstRate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      setError('Please provide product name and unique SKU.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const wh = MOCK_WAREHOUSES.find((w) => w.id === warehouseId) || MOCK_WAREHOUSES[1];
      const sup = MOCK_SUPPLIERS.find((s) => s.id === supplierId) || MOCK_SUPPLIERS[0];

      const packagingConversions: PackagingConversions = {
        baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
        dozenMultiplier: 12,
        boxMultiplier: Number(boxMultiplier) || 20,
        cartonMultiplier: Number(cartonMultiplier) || 100,
        bundleMultiplier: Number(bundleMultiplier) || 25,
      };

      await inventoryService.createItem({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        materialCategory: category,
        materialSubtype: subtype,
        description: `Industrial wholesale item: ${name}.`,
        currentStock: Number(currentStock),
        unit,
        baseUnit: unit === 'UNT' ? 'UNT' : 'PCS',
        reorderLevel: Number(reorderLevel),
        reorderQuantity: Number(reorderQuantity) || Number(reorderLevel) * 2,
        packagingConversions,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        gstRate: Number(gstRate),
        hsnCode,
        warehouseId: wh.id,
        warehouseName: wh.name,
        rackLocation,
        supplierId: sup.id,
        supplierName: sup.companyName,
        barcode: `890${Math.floor(100000000 + Math.random() * 900000000)}`,
        images: selectedCategoryMeta ? [selectedCategoryMeta.imageUrl] : [],
        isArchived: false,
      });

      setIsLoading(false);
      onItemAdded();
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Failed to add item.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Warehouse Item"
      subtitle="Enter specifications, wholesale rates, HSN tax code, and storage location"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Product Name"
            placeholder="e.g. Gurjan BWP Marine Plywood 18mm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="SKU Identifier"
            placeholder="e.g. WD-PLY-GRJ-18MM"
            value={sku}
            onChange={(e) => setSku(e.target.value.toUpperCase())}
            required
          />

          <Select
            label="Material Category"
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
            options={MATERIAL_CATEGORIES.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <Select
            label="Sub-Type"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            options={
              selectedCategoryMeta?.subtypes.map((st) => ({
                value: st,
                label: st,
              })) || []
            }
          />

          <Input
            label={`Initial Stock Quantity (${unit})`}
            type="number"
            min={0}
            value={currentStock}
            onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
            required
          />

          <Select
            label="Unit of Measurement *"
            value={unit}
            onChange={(e) => setUnit(e.target.value as PredefinedUnit)}
            options={PREDEFINED_UNITS.map((u) => ({
              value: u.code,
              label: `${u.label}${u.isPackUnit ? ` - ${u.description}` : ''}`,
            }))}
          />

          <Input
            label={`Minimum Stock Threshold (${unit})`}
            type="number"
            min={1}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />

          <Input
            label={`Suggested Reorder Quantity (${unit})`}
            type="number"
            min={1}
            value={reorderQuantity}
            onChange={(e) => setReorderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />

          <Input
            label="HSN Code"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            required
          />

          <Input
            label="Wholesale Cost Price (₹ excl. GST)"
            type="number"
            min={1}
            value={costPrice}
            onChange={(e) => setCostPrice(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />

          <Input
            label="Selling Rate (₹ excl. GST)"
            type="number"
            min={1}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Math.max(1, parseInt(e.target.value) || 1))}
            required
          />

          <Select
            label="GST Rate (%)"
            value={String(gstRate)}
            onChange={(e) => setGstRate(parseInt(e.target.value) || 18)}
            options={[
              { value: '0', label: '0% (Exempt)' },
              { value: '5', label: '5%' },
              { value: '12', label: '12%' },
              { value: '18', label: '18% (Standard)' },
              { value: '28', label: '28%' },
            ]}
          />

          <Select
            label="Storage Warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            options={MOCK_WAREHOUSES.filter((w) => w.id !== 'all').map((w) => ({
              value: w.id,
              label: w.name,
            }))}
          />

          <Input
            label="Rack / Aisle Location"
            placeholder="e.g. BHW-A02-S1"
            value={rackLocation}
            onChange={(e) => setRackLocation(e.target.value)}
          />

          <Select
            label="Primary Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            options={MOCK_SUPPLIERS.slice(0, 15).map((s) => ({
              value: s.id,
              label: s.companyName,
            }))}
          />
        </div>

        {/* Product-Specific Packaging Conversions by Category */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Packaging Category & Conversion
              </span>
            </div>
            <span className="text-[10.5px] text-slate-400">
              Base Unit: <strong className="text-slate-700 dark:text-slate-200">{unit === 'UNT' ? 'UNT' : 'PCS'}</strong>
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Packaging Type for this Product
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'none', label: 'Direct Pieces', desc: 'Single piece unit' },
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

          {selectedPackagingCategory === 'none' && (
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-dashed border-slate-200 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400">
              This product is sold and managed directly as individual {unit === 'UNT' ? 'units (UNT)' : 'pieces (PCS)'}. No secondary packaging multiplier needed.
            </div>
          )}

          {selectedPackagingCategory === 'BOX' && (
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Box Multiplier: How many {unit === 'UNT' ? 'units' : 'pieces'} in 1 Box?
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-xs font-bold text-slate-500">1 Box (BOX) =</span>
                <input
                  type="number"
                  min="1"
                  value={boxMultiplier}
                  onChange={(e) => setBoxMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">
                Example: 20 card holders per box. Ordering 10 boxes = 200 {unit === 'UNT' ? 'UNT' : 'PCS'}.
              </span>
            </div>
          )}

          {selectedPackagingCategory === 'CTN' && (
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Carton Multiplier: How many {unit === 'UNT' ? 'units' : 'pieces'} in 1 Carton?
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-xs font-bold text-slate-500">1 Carton (CTN) =</span>
                <input
                  type="number"
                  min="1"
                  value={cartonMultiplier}
                  onChange={(e) => setCartonMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">
                Example: 100 card holders per shipping carton. Ordering 5 cartons = 500 {unit === 'UNT' ? 'UNT' : 'PCS'}.
              </span>
            </div>
          )}

          {selectedPackagingCategory === 'BDL' && (
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Bundle Multiplier: How many {unit === 'UNT' ? 'units' : 'pieces'} in 1 Bundle?
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-xs font-bold text-slate-500">1 Bundle (BDL) =</span>
                <input
                  type="number"
                  min="1"
                  value={bundleMultiplier}
                  onChange={(e) => setBundleMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-2.5 py-1.5 text-xs template-input border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white font-bold"
                />
                <span className="text-xs text-slate-400">{unit === 'UNT' ? 'UNT' : 'PCS'}</span>
              </div>
              <span className="text-[10.5px] text-slate-400 block">
                Example: 25 lanyards tied in a bundle. Ordering 4 bundles = 100 {unit === 'UNT' ? 'UNT' : 'PCS'}.
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isLoading}
            leftIcon={<PackagePlus className="w-4 h-4" />}
          >
            Add Item to Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
};
