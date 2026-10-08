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
import { PackagePlus, CheckCircle2 } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('wood');
  const [subtype, setSubtype] = useState('Plywood');
  const [currentStock, setCurrentStock] = useState<number>(50);
  const [unit, setUnit] = useState<UnitOfMeasurement>('sheets');
  const [reorderLevel, setReorderLevel] = useState<number>(20);
  const [costPrice, setCostPrice] = useState<number>(1200);
  const [sellingPrice, setSellingPrice] = useState<number>(1450);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnCode, setHsnCode] = useState('441233');
  const [warehouseId, setWarehouseId] = useState('wh-001');
  const [rackLocation, setRackLocation] = useState('BHW-A02-S1');
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

      await inventoryService.createItem({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        materialCategory: category,
        materialSubtype: subtype,
        description: `Industrial wholesale item: ${name}.`,
        currentStock: Number(currentStock),
        unit,
        reorderLevel: Number(reorderLevel),
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
            label="Initial Stock Quantity"
            type="number"
            min={0}
            value={currentStock}
            onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
            required
          />

          <Select
            label="Unit of Measurement"
            value={unit}
            onChange={(e) => setUnit(e.target.value as UnitOfMeasurement)}
            options={[
              { value: 'sheets', label: 'Sheets' },
              { value: 'pieces', label: 'Pieces' },
              { value: 'boxes', label: 'Boxes' },
              { value: 'rolls', label: 'Rolls' },
              { value: 'bundles', label: 'Bundles' },
              { value: 'kg', label: 'Kilograms (kg)' },
              { value: 'meters', label: 'Meters' },
            ]}
          />

          <Input
            label="Reorder Threshold"
            type="number"
            min={1}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(Math.max(1, parseInt(e.target.value) || 1))}
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
