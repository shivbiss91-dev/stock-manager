import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ComputedInventoryItem } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickStockAdjustmentModalProps {
  item: ComputedInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickStockAdjustmentModal: React.FC<QuickStockAdjustmentModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState('Stock Receipt (GRN)');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const resultingStock =
    adjustmentType === 'add'
      ? item.currentStock + quantity
      : item.currentStock - quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (adjustmentType === 'deduct' && quantity > item.currentStock) {
      setError(
        `Cannot deduct ${quantity} ${item.unit}. Only ${item.currentStock} ${item.unit} available in stock.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const delta = adjustmentType === 'add' ? quantity : -quantity;
      await inventoryService.updateStock(
        item.id,
        delta,
        `${reason}: ${notes || 'No extra notes'}`,
        user?.name || 'Authorized Staff'
      );
      setIsLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Adjustment failed.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Quantity Adjustment"
      subtitle={`SKU: ${item.sku} • Current Stock: ${item.currentStock} ${item.unit}`}
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
          <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
          <p className="text-slate-500">
            Storage: <strong className="text-slate-700 dark:text-slate-300">{item.warehouseName} ({item.rackLocation})</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAdjustmentType('add')}
            className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
              adjustmentType === 'add'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            + Add Stock (Inward)
          </button>
          <button
            type="button"
            onClick={() => setAdjustmentType('deduct')}
            className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
              adjustmentType === 'deduct'
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            - Deduct Stock (Outward)
          </button>
        </div>

        <Input
          label={`Quantity (${item.unit})`}
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          required
        />

        <Select
          label="Adjustment Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={
            adjustmentType === 'add'
              ? [
                  { value: 'Stock Receipt (GRN)', label: 'Stock Receipt (GRN)' },
                  { value: 'Customer Return', label: 'Customer Return' },
                  { value: 'Audit Cycle Count (+)', label: 'Audit Cycle Count (+)' },
                  { value: 'Transfer Inward', label: 'Transfer Inward' },
                ]
              : [
                  { value: 'Damaged / Broken in Warehouse', label: 'Damaged / Broken in Warehouse' },
                  { value: 'Discrepancy Write-off (-)', label: 'Discrepancy Write-off (-)' },
                  { value: 'Sample Demonstration', label: 'Sample Demonstration' },
                  { value: 'Direct Dispatch Adjustment', label: 'Direct Dispatch Adjustment' },
                ]
          }
        />

        <Input
          label="Audit Notes / Reference Number"
          placeholder="e.g. Verified by Suresh Patil - Physical verification sheet"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Live Calculation Preview */}
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-between text-xs border border-transparent dark:border-white/[0.06]">
          <span className="text-slate-500 dark:text-slate-400">Resulting Stock:</span>
          <span className="font-extrabold text-base text-slate-900 dark:text-accent-orange">
            {resultingStock} {item.unit}
          </span>
        </div>

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
            Apply Stock Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
