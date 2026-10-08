import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { MATERIAL_CATEGORIES } from '../../data/materialCategories';
import { MaterialCategory } from '../../types/inventory';
import {
  CheckSquare,
  DollarSign,
  FolderInput,
  Download,
  Printer,
  X,
  CheckCircle2,
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedItemIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAllVisible: () => void;
  onApplyPriceUpdate: (percentDelta: number) => void;
  onMoveCategory: (newCategory: MaterialCategory) => void;
  onExportSelected: () => void;
  onPrintLabels: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedItemIds,
  totalCount,
  onClearSelection,
  onSelectAllVisible,
  onApplyPriceUpdate,
  onMoveCategory,
  onExportSelected,
  onPrintLabels,
}) => {
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(5);
  const [selectedTargetCat, setSelectedTargetCat] = useState<MaterialCategory>('wood');

  const selectedCount = selectedItemIds.length;
  if (selectedCount === 0) return null;

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyPriceUpdate(priceChangePercent);
    setIsPriceModalOpen(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onMoveCategory(selectedTargetCat);
    setIsCategoryModalOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl rounded-2xl bg-[#0B0D14] text-white border border-white/[0.08] shadow-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md"
        >
          {/* Selected Count & Quick Select All */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-accent-orange/20 text-accent-orange flex items-center justify-center font-bold text-sm">
              {selectedCount}
            </span>
            <div>
              <p className="text-xs font-bold leading-tight">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
              </p>
              <button
                onClick={onSelectAllVisible}
                className="text-[10.5px] text-accent-orange hover:underline"
              >
                Select all visible on page
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPriceModalOpen(true)}
              leftIcon={<DollarSign className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Bulk Price
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCategoryModalOpen(true)}
              leftIcon={<FolderInput className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Move Category
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onPrintLabels}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Print Labels
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onExportSelected}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Export
            </Button>

            <button
              onClick={onClearSelection}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bulk Price Update Modal */}
      <Modal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        title="Bulk Wholesale Price Revision"
        subtitle={`Adjust wholesale prices for ${selectedCount} selected items`}
        size="sm"
      >
        <form onSubmit={handlePriceSubmit} className="space-y-4">
          <Input
            label="Percentage Adjustment (+% or -%)"
            type="number"
            step="0.5"
            value={priceChangePercent}
            onChange={(e) => setPriceChangePercent(parseFloat(e.target.value) || 0)}
            helperText="e.g. Enter +5 to increase selling prices by 5%, or -3 to discount by 3%."
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPriceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Apply Price Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Move Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Reassign Material Category"
        subtitle={`Move ${selectedCount} selected items to a new classification`}
        size="sm"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Select
            label="Target Material Category"
            value={selectedTargetCat}
            onChange={(e) => setSelectedTargetCat(e.target.value as MaterialCategory)}
            options={MATERIAL_CATEGORIES.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Reassign Items
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
