import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ComputedInventoryItem } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { stockMovementService } from '../../services/stockMovementService';
import { MOCK_WAREHOUSES } from '../../data/warehouses';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeftRight, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TransferStockModalProps {
  item: ComputedInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [targetWarehouseId, setTargetWarehouseId] = useState('wh-002');
  const [quantity, setQuantity] = useState<number>(20);
  const [vehicleNumber, setVehicleNumber] = useState('MH-04-GP-8842');
  const [notes, setNotes] = useState('Consolidated transit dispatch');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const targetWh = MOCK_WAREHOUSES.find((w) => w.id === targetWarehouseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Please specify a transfer quantity greater than 0.');
      return;
    }
    if (quantity > item.currentStock) {
      setError(
        `Cannot transfer ${quantity} ${item.unit}. Only ${item.currentStock} ${item.unit} available in current warehouse.`
      );
      return;
    }
    if (targetWarehouseId === item.warehouseId) {
      setError('Destination facility must be different from current warehouse.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Deduct from origin warehouse
      await inventoryService.updateStock(
        item.id,
        -quantity,
        `Inter-warehouse transfer to ${targetWh?.name}`,
        user?.name || 'Authorized Staff'
      );

      // 2. Log transfer movement
      await stockMovementService.addMovement({
        itemId: item.id,
        date: new Date().toISOString(),
        type: 'transfer',
        quantityDelta: -quantity,
        stockAfter: item.currentStock - quantity,
        unit: item.unit,
        userName: user?.name || 'Priya Patel',
        userRole: user?.role || 'Manager',
        referenceNumber: `TR-2026-${Math.floor(100 + Math.random() * 900)}`,
        referenceType: 'Transfer',
        notes: `Transfer to ${targetWh?.name} via Truck ${vehicleNumber}. Notes: ${notes}`,
      });

      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Transfer failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inter-Warehouse Stock Transfer"
      subtitle={`Move inventory from ${item.warehouseName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Item:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Current Facility Stock:</span>
            <span className="font-extrabold text-slate-900 dark:text-accent-orange">
              {item.currentStock} {item.unit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Origin Warehouse"
            value={item.warehouseName.split(' ')[0]}
            disabled
            className="opacity-70 cursor-not-allowed"
          />

          <Select
            label="Destination Warehouse"
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            options={MOCK_WAREHOUSES.filter((w) => w.id !== 'all' && w.id !== item.warehouseId).map(
              (w) => ({
                value: w.id,
                label: w.name,
              })
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label={`Transfer Quantity (${item.unit})`}
            type="number"
            min={1}
            max={item.currentStock}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            required
          />

          <Input
            label="Fleet Vehicle Number"
            placeholder="e.g. MH-04-GP-8842"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            required
          />
        </div>

        <Input
          label="Transfer Manifest Notes"
          placeholder="e.g. Replenishment shipment for pending sales orders"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isLoading}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Dispatch Transfer Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
