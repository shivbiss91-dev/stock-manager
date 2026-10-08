import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ComputedInventoryItem } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { Printer, QrCode, Barcode as BarcodeIcon } from 'lucide-react';

interface BarcodeLabelModalProps {
  item: ComputedInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Warehouse Barcode & QR Label"
      subtitle="Standard 100mm × 60mm adhesive pallet and carton label layout"
      size="md"
    >
      <div className="space-y-4">
        {/* Printable Label Box */}
        <div
          id="printable-barcode-label"
          className="p-5 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 font-sans shadow-lg select-none space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                StockVista Wholesale
              </span>
              <p className="text-xs font-black">{item.warehouseName.split(' ')[0]} Facility</p>
            </div>
            <span className="font-mono text-sm font-black px-2 py-0.5 border border-slate-900 rounded">
              HSN: {item.hsnCode}
            </span>
          </div>

          {/* Product Title & Category */}
          <div>
            <h3 className="text-sm font-black leading-tight truncate">{item.name}</h3>
            <p className="text-[11px] font-bold text-slate-600 mt-0.5">
              Category: {item.materialCategory.toUpperCase()} • {item.materialSubtype}
            </p>
          </div>

          {/* Middle: Barcode & QR Code Row */}
          <div className="grid grid-cols-3 gap-3 items-center py-2 border-y border-dashed border-slate-400">
            {/* Barcode Lines Illustration */}
            <div className="col-span-2 space-y-1">
              <div className="h-14 flex items-center justify-between px-1">
                {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7, 9].map((w, idx) => (
                  <div
                    key={idx}
                    className="h-full bg-slate-950"
                    style={{ width: `${(w % 3) + 1.2}px` }}
                  />
                ))}
              </div>
              <p className="font-mono text-center text-xs font-bold tracking-widest">
                *{item.sku}*
              </p>
            </div>

            {/* QR Code Matrix Placeholder */}
            <div className="flex flex-col items-center justify-center border border-slate-400 rounded-lg p-2 bg-slate-50">
              <QrCode className="w-12 h-12 text-slate-900" />
              <span className="text-[9px] font-mono text-slate-500 mt-0.5">{item.barcode.slice(-6)}</span>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-500 block">Rate (excl. GST)</span>
              <strong className="text-sm font-black">{formatINR(item.sellingPrice)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block">Bin Location</span>
              <strong className="text-xs font-mono font-black">{item.rackLocation}</strong>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Packaging</span>
              <strong className="text-xs font-bold">1 {item.unit}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
          <span className="text-slate-400">
            Ready for standard thermal roll printers
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Barcode Label
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
