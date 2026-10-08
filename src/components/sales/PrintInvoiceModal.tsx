import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import { numberToWordsINR } from '../../utils/numberToWords';
import { formatDate } from '../../utils/dateUtils';
import { COMPANY_NAME, COMPANY_GSTIN, COMPANY_ADDRESS, COMPANY_BANK } from '../../services/invoiceService';

interface PrintInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#05060A]/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:static">
      <div className="w-full max-w-4xl bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Modal Controls Bar (hidden during printing) */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">
              Tax Invoice Preview: {invoice.invoiceNumber}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
              GST Compliant (A4)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-accent-orange text-white hover:bg-accent-orange/90 transition flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-[11px] leading-tight print:p-6 print:text-[10px]">
          {/* Header & Seller Information */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  SV
                </div>
                <h1 className="text-base font-black tracking-tight text-slate-950 uppercase">
                  {COMPANY_NAME}
                </h1>
              </div>
              <p className="text-slate-600">{COMPANY_ADDRESS}</p>
              <p className="font-semibold text-slate-800">
                GSTIN: <span className="font-mono text-slate-950">{COMPANY_GSTIN}</span> | State: 27 - Maharashtra
              </p>
              <p className="text-slate-600">Email: accounts@stockvista.in | Tel: +91 22 2789 4400</p>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded">
                TAX INVOICE
              </div>
              <p className="text-slate-500 font-medium">Original for Recipient</p>
              <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                {invoice.invoiceNumber}
              </p>
              <p className="text-slate-600">Date: {formatDate(invoice.date)}</p>
              <p className="text-slate-600">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* IRN & E-Way Bill Bar (if present) */}
          {(invoice.irnNumber || invoice.ewayBillNumber) && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[10px]">
              {invoice.irnNumber && (
                <div className="space-y-0.5 truncate max-w-lg">
                  <span className="font-bold text-slate-700">IRN: </span>
                  <span className="font-mono text-slate-900 truncate block">{invoice.irnNumber}</span>
                </div>
              )}
              {invoice.ewayBillNumber && (
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-slate-700">E-Way Bill: </span>
                  <span className="font-mono font-bold text-slate-900">{invoice.ewayBillNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Buyer & Consignee Details */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
            {/* Bill To */}
            <div className="space-y-1">
              <p className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Billed To (Buyer)
              </p>
              <p className="font-bold text-slate-950">{invoice.customerName}</p>
              <p className="text-slate-600">{invoice.billingAddress}</p>
              <p className="font-semibold text-slate-800">
                GSTIN: <span className="font-mono text-slate-950">{invoice.customerGstin}</span>
              </p>
              <p className="text-slate-600">
                Place of Supply: {invoice.placeOfSupplyStateCode} - {invoice.placeOfSupplyStateName}
              </p>
            </div>

            {/* Ship To */}
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <p className="font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Shipped To (Consignee)
              </p>
              <p className="font-bold text-slate-950">{invoice.customerName}</p>
              <p className="text-slate-600">{invoice.shippingAddress}</p>
              <p className="text-slate-600">
                Dispatched From: {invoice.warehouseName}
              </p>
              <p className="font-semibold text-slate-800">
                Payment Terms: <span className="font-normal">{invoice.paymentMode || 'Net 30 Days'}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[10px]">
                <tr>
                  <th className="py-2 px-2.5 w-8">#</th>
                  <th className="py-2 px-2.5">Item Description</th>
                  <th className="py-2 px-2 text-center w-16">HSN</th>
                  <th className="py-2 px-2 text-right w-14">Qty</th>
                  <th className="py-2 px-2 text-right w-20">Rate (₹)</th>
                  <th className="py-2 px-2 text-right w-16">Disc (%)</th>
                  <th className="py-2 px-2 text-right w-24">Taxable (₹)</th>
                  <th className="py-2 px-2 text-center w-14">GST</th>
                  <th className="py-2 px-2.5 text-right w-24">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {invoice.items.map((line, idx) => (
                  <tr key={line.id} className="align-top">
                    <td className="py-2 px-2.5 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="py-2 px-2.5">
                      <p className="font-semibold text-slate-950">{line.name}</p>
                      <p className="text-[9px] font-mono text-slate-500">SKU: {line.sku}</p>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{line.hsnCode}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      {line.quantity} <span className="text-[9px] text-slate-500">{line.unit}</span>
                    </td>
                    <td className="py-2 px-2 text-right">{formatINR(line.rate)}</td>
                    <td className="py-2 px-2 text-right text-slate-500">{line.discountPercent}%</td>
                    <td className="py-2 px-2 text-right font-medium">{formatINR(line.lineTaxableAmount)}</td>
                    <td className="py-2 px-2 text-center">{line.gstRate}%</td>
                    <td className="py-2 px-2.5 text-right font-bold text-slate-950">
                      {formatINR(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Bank Details + Invoice Summary */}
          <div className="grid grid-cols-12 gap-4 pt-1">
            {/* Left Column: Bank Details & Amount in Words */}
            <div className="col-span-7 space-y-3">
              {/* Amount in words */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase">Total Amount in Words:</p>
                <p className="font-semibold text-slate-900 leading-snug">
                  {numberToWordsINR(invoice.grandTotal)}
                </p>
              </div>

              {/* Bank Details */}
              <div className="p-3 border border-slate-200 rounded-lg space-y-1 text-[10px]">
                <p className="font-bold text-slate-800 uppercase border-b border-slate-200 pb-0.5">
                  Bank Settlement Details (RTGS / NEFT / IMPS)
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700 pt-1">
                  <div>Bank: <strong className="text-slate-900">{COMPANY_BANK.bankName}</strong></div>
                  <div>Account: <strong className="font-mono text-slate-900">{COMPANY_BANK.accountNumber}</strong></div>
                  <div>IFSC: <strong className="font-mono text-slate-900">{COMPANY_BANK.ifscCode}</strong></div>
                  <div>Branch: <strong className="text-slate-900">{COMPANY_BANK.branch}</strong></div>
                </div>
                <p className="text-slate-500 text-[9px] pt-0.5">UPI Virtual Payment Address: <strong>{COMPANY_BANK.upiId}</strong></p>
              </div>

              {/* Declarations */}
              <p className="text-[9px] text-slate-500 italic leading-tight">
                Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold will be subject to Bhiwandi/Mumbai Jurisdiction only.
              </p>
            </div>

            {/* Right Column: Tax Breakdown & Grand Total */}
            <div className="col-span-5 space-y-1 border border-slate-300 rounded-lg p-3 bg-slate-50/40">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal (Taxable):</span>
                <span className="font-semibold text-slate-900">{formatINR(invoice.subtotalTaxable)}</span>
              </div>

              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Trade Discount:</span>
                  <span className="text-emerald-700">-{formatINR(invoice.totalDiscount)}</span>
                </div>
              )}

              {invoice.isInterState ? (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span className="font-semibold text-slate-900">{formatINR(invoice.igstTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span className="font-semibold text-slate-900">{formatINR(invoice.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>State GST (SGST):</span>
                    <span className="font-semibold text-slate-900">{formatINR(invoice.sgstTotal)}</span>
                  </div>
                </>
              )}

              {invoice.roundOff !== 0 && (
                <div className="flex justify-between py-0.5 text-slate-500 text-[10px]">
                  <span>Round Off:</span>
                  <span>{invoice.roundOff > 0 ? `+₹${invoice.roundOff}` : `-₹${Math.abs(invoice.roundOff)}`}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-950 mt-1">
                <span>Grand Total:</span>
                <span>{formatINR(invoice.grandTotal)}</span>
              </div>

              {invoice.amountPaid > 0 && (
                <div className="pt-2 border-t border-slate-200 text-[10px] space-y-0.5">
                  <div className="flex justify-between text-emerald-700">
                    <span>Advance / Paid:</span>
                    <span>{formatINR(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Balance Due:</span>
                    <span>{formatINR(invoice.balanceDue)}</span>
                  </div>
                </div>
              )}

              {/* Signature Box */}
              <div className="pt-6 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-800">
                  For {COMPANY_NAME}
                </p>
                <div className="h-10"></div>
                <p className="text-[9px] text-slate-500 border-t border-slate-300 pt-1">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
