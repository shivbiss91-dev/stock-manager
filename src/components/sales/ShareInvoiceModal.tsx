import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Mail, ExternalLink } from 'lucide-react';
import { Invoice } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import { formatDate } from '../../utils/dateUtils';
import { useNotificationStore } from '../../store/notificationStore';

interface ShareInvoiceModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareInvoiceModal: React.FC<ShareInvoiceModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { addNotification } = useNotificationStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const invoiceUrl = `${window.location.origin}${window.location.pathname}#/sales/invoices/${invoice.id}`;
  const messageText = `Dear ${invoice.customerName},\n\nPlease find your GST Tax Invoice *${invoice.invoiceNumber}* for *${formatINR(invoice.grandTotal)}* from StockVista Wholesale.\nDue Date: ${formatDate(invoice.dueDate)}.\n\nView and download invoice here: ${invoiceUrl}\n\nThank you for your business!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    addNotification({
      title: 'Copied to Clipboard',
      message: 'Invoice summary message copied to clipboard.',
      type: 'info',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const cleanPhone = invoice.customerGstin ? '919820012345' : '';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  const mailtoUrl = `mailto:accounts@customer.com?subject=${encodeURIComponent(
    `Tax Invoice ${invoice.invoiceNumber} from StockVista Wholesale`
  )}&body=${encodeURIComponent(messageText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060A]/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md template-card border border-slate-200 dark:border-white/[0.08] rounded-[24px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent-orange/10 text-accent-orange">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F2F4F8]">
                Share Tax Invoice
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#9AA0AE]">
                Dispatch invoice copy via WhatsApp Business or Email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center gap-2 font-semibold text-xs hover:bg-emerald-500/20 transition"
            >
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp</span>
              <ExternalLink className="w-3 h-3 text-emerald-500" />
            </a>

            <a
              href={mailtoUrl}
              className="p-3 rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue flex items-center justify-center gap-2 font-semibold text-xs hover:bg-accent-blue/20 transition"
            >
              <Mail className="w-4 h-4 text-accent-blue" />
              <span>Send Email</span>
              <ExternalLink className="w-3 h-3 text-accent-blue" />
            </a>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message Preview
            </label>
            <div className="p-3.5 template-input border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
              {messageText}
            </div>
          </div>

          {/* Copy link button */}
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl border border-accent-orange/30 bg-accent-orange/10 hover:bg-accent-orange/20 text-accent-orange font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary & Secure Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
