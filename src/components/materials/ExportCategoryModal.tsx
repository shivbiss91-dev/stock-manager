import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ComputedInventoryItem } from '../../types/inventory';
import { formatINR } from '../../utils/formatINR';
import { formatPackagingBreakdown } from '../../utils/unitConversions';
import { FileSpreadsheet, FileText, Download, CheckCircle2 } from 'lucide-react';

interface ExportCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  items: ComputedInventoryItem[];
}

export const ExportCategoryModal: React.FC<ExportCategoryModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  items,
}) => {
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      if (format === 'csv' || format === 'excel') {
        const headers = [
          'SKU',
          'Product Name',
          'Category',
          'Sub-Type',
          'Current Stock',
          'Unit',
          'Packaging Breakdown',
          'Reorder Level',
          'Cost Price (INR)',
          'Selling Price (INR)',
          'GST %',
          'HSN Code',
          'Warehouse Location',
          'Stock Status',
          '30d Sales',
        ];

        const rows = items.map((i) => [
          `"${i.sku}"`,
          `"${i.name.replace(/"/g, '""')}"`,
          i.materialCategory,
          `"${i.materialSubtype}"`,
          i.currentStock,
          i.unit,
          `"${formatPackagingBreakdown(i.currentStock, i.packagingConversions)}"`,
          i.reorderLevel,
          i.costPrice,
          i.sellingPrice,
          i.gstRate,
          i.hsnCode,
          `"${i.warehouseName} (${i.rackLocation})"`,
          i.stockStatus,
          i.sales30Days,
        ]);

        const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const ext = format === 'excel' ? 'csv' : 'csv'; // clean spreadsheet format
        link.setAttribute(
          'download',
          `StockVista_${categoryName.replace(/\s+/g, '_')}_Filtered_${new Date().toISOString().slice(0, 10)}.${ext}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        // Generate print-friendly PDF view
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>StockVista - ${categoryName} Inventory Manifest</title>
                <style>
                  body { font-family: Inter, sans-serif; padding: 24px; color: #0F172A; }
                  h1 { color: #0B1F3A; font-size: 20px; margin-bottom: 4px; }
                  p { color: #64748B; font-size: 12px; margin-top: 0; }
                  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
                  th, td { border: 1px solid #CBD5E1; padding: 6px 8px; text-align: left; }
                  th { background: #F1F5F9; font-weight: bold; }
                  .text-right { text-align: right; }
                </style>
              </head>
              <body>
                <h1>StockVista Wholesale Inventory Manifest</h1>
                <p>Category: ${categoryName} | Total Filtered SKUs: ${items.length} | Generated: ${new Date().toLocaleString('en-IN')}</p>
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Sub-Type</th>
                      <th class="text-right">Stock</th>
                      <th class="text-right">Rate (₹)</th>
                      <th>HSN</th>
                      <th>Warehouse</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .slice(0, 150)
                      .map(
                        (i) => `
                      <tr>
                        <td>${i.sku}</td>
                        <td>${i.name}</td>
                        <td>${i.materialSubtype}</td>
                        <td class="text-right">${i.currentStock} ${i.unit}</td>
                        <td class="text-right">${i.sellingPrice}</td>
                        <td>${i.hsnCode}</td>
                        <td>${i.rackLocation}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }

      setIsExporting(false);
      setExportedSuccess(true);
      setTimeout(() => {
        setExportedSuccess(false);
        onClose();
      }, 1200);
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Category Dataset"
      subtitle={`Exporting current filtered view (${items.length} items from ${categoryName})`}
      size="sm"
    >
      <div className="space-y-4">
        {exportedSuccess ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Export Dispatched!</h3>
            <p className="text-xs text-slate-500">Your dataset download has commenced.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  format === 'csv'
                    ? 'border-accent-orange bg-accent-orange/10 ring-1 ring-accent-orange'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                <span className="text-xs font-bold block text-slate-900 dark:text-white">CSV File</span>
                <span className="text-[10px] text-slate-400">Comma separated</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  format === 'excel'
                    ? 'border-accent-orange bg-accent-orange/10 ring-1 ring-accent-orange'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 text-accent-blue" />
                <span className="text-xs font-bold block text-slate-900 dark:text-white">Excel Sheet</span>
                <span className="text-[10px] text-slate-400">Spreadsheet format</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  format === 'pdf'
                    ? 'border-accent-orange bg-accent-orange/10 ring-1 ring-accent-orange'
                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-1 text-rose-500" />
                <span className="text-xs font-bold block text-slate-900 dark:text-white">PDF Report</span>
                <span className="text-[10px] text-slate-400">Printable A4 table</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              Includes SKU, description, wholesale GST rate, storage bin, and current stock for all{' '}
              <strong className="text-slate-800 dark:text-slate-200">{items.length} visible items</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                isLoading={isExporting}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Now
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
