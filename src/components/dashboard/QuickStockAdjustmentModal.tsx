import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ComputedInventoryItem } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { useAuthStore } from '../../store/authStore';
import {
  PREDEFINED_UNITS,
  PredefinedUnit,
  convertToBaseQuantity,
  DEFAULT_PACKAGING_CONVERSIONS,
  normalizeUnitCode,
} from '../../utils/unitConversions';
import {
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
} from 'lucide-react';

interface QuickStockAdjustmentModalProps {
  item: ComputedInventoryItem | null;
  isOpen: boolean;
  initialMode?: 'add' | 'deduct' | 'direct';
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickStockAdjustmentModal: React.FC<QuickStockAdjustmentModalProps> = ({
  item,
  isOpen,
  initialMode = 'add',
  onClose,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const isViewer = user?.role === 'viewer';

  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct' | 'direct'>(initialMode);
  const [selectedUnit, setSelectedUnit] = useState<PredefinedUnit>('PCS');
  const [quantity, setQuantity] = useState<number>(10);
  const [directTargetStock, setDirectTargetStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('Stock Receipt (GRN)');
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or item changes
  useEffect(() => {
    if (item && isOpen) {
      setAdjustmentType(initialMode);
      const itemUnit = normalizeUnitCode(item.unit);
      setSelectedUnit(itemUnit);
      setQuantity(10);
      setDirectTargetStock(item.currentStock);
      setReason(
        initialMode === 'add'
          ? 'Stock Receipt (GRN)'
          : initialMode === 'deduct'
          ? 'Damaged / Broken in Warehouse'
          : 'Annual Physical Inventory Audit'
      );
      setCustomReason('');
      setNotes('');
      setIsConfirmed(false);
      setError(null);
    }
  }, [item, isOpen, initialMode]);

  // Update default reason when adjustmentType changes
  useEffect(() => {
    if (adjustmentType === 'add') {
      setReason('Stock Receipt (GRN)');
    } else if (adjustmentType === 'deduct') {
      setReason('Damaged / Broken in Warehouse');
    } else {
      setReason('Annual Physical Inventory Audit');
    }
  }, [adjustmentType]);

  if (!item) return null;

  const conversions = item.packagingConversions || DEFAULT_PACKAGING_CONVERSIONS;

  // Base quantity conversion calculations
  let deltaInBase = 0;
  let resultingStock = item.currentStock;
  let enteredQuantityInBase = 0;

  if (adjustmentType === 'direct') {
    enteredQuantityInBase = convertToBaseQuantity(directTargetStock, selectedUnit, conversions);
    deltaInBase = enteredQuantityInBase - item.currentStock;
    resultingStock = enteredQuantityInBase;
  } else {
    enteredQuantityInBase = convertToBaseQuantity(quantity, selectedUnit, conversions);
    deltaInBase = adjustmentType === 'add' ? enteredQuantityInBase : -enteredQuantityInBase;
    resultingStock = item.currentStock + deltaInBase;
  }

  const isNegative = resultingStock < 0;
  const isZeroOrNegativeDelta =
    adjustmentType !== 'direct' && quantity <= 0;
  const isDirectNegative = adjustmentType === 'direct' && directTargetStock < 0;

  const finalReason = reason === 'Other' ? (customReason.trim() || 'Manual stock calibration') : reason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewer) {
      setError('Viewers have read-only access. Only Admin, Manager, and Staff can make stock adjustments.');
      return;
    }

    if (isZeroOrNegativeDelta) {
      setError('Please specify an adjustment quantity greater than 0.');
      return;
    }

    if (isDirectNegative) {
      setError('Stock count cannot be negative.');
      return;
    }

    if (isNegative) {
      setError(
        `Negative stock is strictly forbidden. Resulting stock would be ${resultingStock} ${item.unit}. Available: ${item.currentStock} ${item.unit}.`
      );
      return;
    }

    if (!isConfirmed) {
      setError('Please check the confirmation box to authorize this stock change.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await inventoryService.updateStock(item.id, {
        mode: adjustmentType,
        adjustmentQuantity: adjustmentType === 'direct' ? directTargetStock : quantity,
        delta: deltaInBase,
        targetStock: adjustmentType === 'direct' ? resultingStock : undefined,
        unit: selectedUnit,
        reason: finalReason,
        notes: notes.trim(),
        userName: user?.name || 'Authorized Staff',
        userRole: user?.role || 'Staff',
      });

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
      title="Inventory Stock Adjustment & Calibration"
      subtitle={`SKU: ${item.sku} • On-Hand Balance: ${item.currentStock} ${item.unit}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Notice */}
        {isViewer && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>Read-Only Access:</strong> Your role (Viewer) does not have permission to adjust physical stock.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Overview Pill */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
            <p className="text-slate-500 mt-0.5">
              Storage: <strong className="text-slate-700 dark:text-slate-300">{item.warehouseName} ({item.rackLocation})</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Current Balance</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {item.currentStock.toLocaleString('en-IN')} {item.unit}
            </span>
          </div>
        </div>

        {/* 3-Mode Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Adjustment Operation Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType('add')}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Add Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('deduct')}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'deduct'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>- Deduct Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('direct')}
              className={`p-2.5 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adjustmentType === 'direct'
                  ? 'bg-accent-blue text-white border-blue-700 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Direct Quantity Edit</span>
            </button>
          </div>
        </div>

        {/* Quantity & Unit of Measurement Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {adjustmentType === 'direct' ? (
            <Input
              label="New Exact Stock Count"
              type="number"
              min={0}
              value={directTargetStock}
              onChange={(e) => setDirectTargetStock(Math.max(0, parseInt(e.target.value) || 0))}
              required
            />
          ) : (
            <Input
              label={adjustmentType === 'add' ? 'Quantity to Inward (+)' : 'Quantity to Deduct (-)'}
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              required
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Unit of Measurement *
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value as PredefinedUnit)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#1A1D26] px-3.5 py-2.5 text-slate-800 dark:text-[#F2F4F8] focus:outline-none focus:ring-2 focus:ring-accent-orange cursor-pointer"
            >
              {PREDEFINED_UNITS.map((u) => (
                <option key={u.code} value={u.code} className="bg-white dark:bg-[#12151D]">
                  {u.label} {u.isPackUnit ? `(${u.description})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Packaging Conversion Hint */}
        {selectedUnit !== 'PCS' && selectedUnit !== 'UNT' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>
              Packaging conversion:{' '}
              <strong>
                1 {selectedUnit} ={' '}
                {selectedUnit === 'DOZ'
                  ? conversions.dozenMultiplier
                  : selectedUnit === 'CTN'
                  ? conversions.cartonMultiplier
                  : selectedUnit === 'BOX'
                  ? conversions.boxMultiplier
                  : conversions.bundleMultiplier}{' '}
                {conversions.baseUnit || 'PCS'}
              </strong>
              {adjustmentType !== 'direct' && (
                <> (Total: {enteredQuantityInBase.toLocaleString('en-IN')} {conversions.baseUnit || 'PCS'})</>
              )}
            </span>
          </div>
        )}

        {/* Adjustment Reason Select */}
        <div>
          <Select
            label="Mandatory Adjustment Reason *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={
              adjustmentType === 'add'
                ? [
                    { value: 'Stock Receipt (GRN)', label: 'Stock Receipt (GRN)' },
                    { value: 'Customer Return', label: 'Customer Return' },
                    { value: 'Audit Cycle Count (+)', label: 'Audit Cycle Count (+)' },
                    { value: 'Production Inward', label: 'Production Inward' },
                    { value: 'Packaging Unpack', label: 'Packaging Unpack' },
                    { value: 'Other', label: 'Other (Enter custom reason)' },
                  ]
                : adjustmentType === 'deduct'
                ? [
                    { value: 'Damaged / Broken in Warehouse', label: 'Damaged / Broken in Warehouse' },
                    { value: 'Discrepancy Write-off (-)', label: 'Discrepancy Write-off (-)' },
                    { value: 'Sample Demonstration', label: 'Sample Demonstration' },
                    { value: 'Direct Dispatch Adjustment', label: 'Direct Dispatch Adjustment' },
                    { value: 'Expired / Quality Rejection', label: 'Expired / Quality Rejection' },
                    { value: 'Other', label: 'Other (Enter custom reason)' },
                  ]
                : [
                    { value: 'Annual Physical Inventory Audit', label: 'Annual Physical Inventory Audit' },
                    { value: 'Cycle Count Reconciliation', label: 'Cycle Count Reconciliation' },
                    { value: 'Initial System Calibration', label: 'Initial System Calibration' },
                    { value: 'Other', label: 'Other (Enter custom reason)' },
                  ]
            }
          />
        </div>

        {/* Custom Reason Field */}
        {reason === 'Other' && (
          <Input
            label="Custom Reason Description *"
            placeholder="Specify reason for adjustment..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            required
          />
        )}

        {/* Audit Notes */}
        <Input
          label="Audit Notes / Verification Reference"
          placeholder="e.g. Physical count sheet #441 signed by Suresh Patil"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Calculation Preview & Impact Card */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Previous Stock Balance:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {item.currentStock.toLocaleString('en-IN')} {item.unit}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Adjustment Delta:</span>
            <span
              className={`font-bold ${
                deltaInBase > 0
                  ? 'text-emerald-500'
                  : deltaInBase < 0
                  ? 'text-rose-500'
                  : 'text-slate-400'
              }`}
            >
              {deltaInBase > 0 ? `+${deltaInBase.toLocaleString('en-IN')}` : deltaInBase.toLocaleString('en-IN')}{' '}
              {item.unit}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-slate-200">New Resulting Stock:</span>
            <span
              className={`text-base font-extrabold ${
                isNegative
                  ? 'text-rose-500'
                  : resultingStock === 0
                  ? 'text-rose-500'
                  : resultingStock <= item.reorderLevel
                  ? 'text-amber-500'
                  : 'text-emerald-500 dark:text-accent-orange'
              }`}
            >
              {resultingStock.toLocaleString('en-IN')} {item.unit}
            </span>
          </div>

          {/* Threshold Alert Indicator */}
          {resultingStock === 0 ? (
            <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              This adjustment will trigger an Out-of-Stock Alert.
            </p>
          ) : resultingStock <= item.reorderLevel ? (
            <p className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Resulting stock is below minimum reorder threshold ({item.reorderLevel} {item.unit}).
            </p>
          ) : null}

          {/* Negative Stock Warning */}
          {isNegative && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Negative stock is strictly forbidden. Please reduce deduction amount.</span>
            </div>
          )}
        </div>

        {/* Confirmation Step Checkbox */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-start gap-2.5">
          <input
            type="checkbox"
            id="confirm-adjustment"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            disabled={isViewer || isNegative}
            className="mt-0.5 rounded border-slate-300 text-brand-orange focus:ring-brand-orange accent-[#FF6B35] cursor-pointer"
          />
          <label
            htmlFor="confirm-adjustment"
            className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            I confirm that this adjustment accurately reflects verified physical stock count, and authorize this change to be recorded in the audit ledger.
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
          <Button variant="outline" size="md" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isLoading}
            disabled={isViewer || !isConfirmed || isNegative}
            leftIcon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Apply Confirmed Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
