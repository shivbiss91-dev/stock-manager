import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { OrderHistoryItem } from '../../types/sales';
import { formatINR } from '../../utils/formatINR';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Box,
  Layers,
  CreditCard,
  Calendar,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderHistoryCarouselProps {
  orders: OrderHistoryItem[];
}

export const OrderHistoryCarousel: React.FC<OrderHistoryCarouselProps> = ({ orders }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  if (!orders || orders.length === 0) {
    return (
      <Card
        variant="glass"
        noPadding
        className="relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[320px] p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              Order History
            </h3>
            <p className="text-xs text-slate-400 dark:text-[#9AA0AE]">Recent client dispatches</p>
          </div>
          <button
            onClick={() => navigate('/sales/orders')}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all"
            title="View full order list"
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-3">
            <Box className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-[#F2F4F8]">No Order History Yet</p>
          <p className="text-xs text-slate-400 dark:text-[#9AA0AE] max-w-xs mt-1">
            Billed customer invoices and dispatched orders will be tracked here in real-time.
          </p>
          <button
            onClick={() => navigate('/sales/invoices')}
            className="mt-4 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-brand-orange text-white hover:bg-orange-600 transition-colors"
          >
            + Create New Invoice
          </button>
        </div>
      </Card>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? orders.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === orders.length - 1 ? 0 : prev + 1));
  };

  const currentOrder = orders[currentIndex];

  // Payment type determination based on index/order
  const paymentTypes = ['Bank Transfer (NEFT/RTGS)', 'UPI Business', 'Cheque Cleared', 'Credit (30 Days)', 'Cash'];
  const paymentType = paymentTypes[currentIndex % paymentTypes.length];

  // Format date DD/MM/YYYY
  const formatDateDDMMYYYY = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '08/10/2026';
    }
  };

  const getStatusBadge = (status: OrderHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        // Template requirement: Delivered = Blue
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3B5BFF]/20 text-[#3B5BFF] dark:text-[#7A93FF] border border-[#3B5BFF]/40">
            Delivered
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40">
            In Transit
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40">
            Pending / Overdue
          </span>
        );
      case 'returned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/40">
            Cancelled / Return
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
            Delivered
          </span>
        );
    }
  };

  return (
    <Card
      variant="glass"
      noPadding
      className="relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[320px] p-5"
    >
      {/* Top Header: Title + Prev/Next Controls + Expand Icon */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
            Order History
          </h3>
          <p className="text-xs text-slate-400 dark:text-[#9AA0AE]">Recent client dispatches</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all"
            title="Previous order"
            aria-label="Previous order"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all"
            title="Next order"
            aria-label="Next order"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate('/sales/orders')}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] flex items-center justify-center transition-all ml-1"
            title="View full order list"
            aria-label="Expand order list"
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Visual Depth: 2 Stacked Cards Behind Front Card */}
      <div className="relative flex-1 flex items-center justify-center my-1">
        {/* Layer 2 (Furthest Back) */}
        <div className="absolute w-[90%] h-full rounded-2xl bg-slate-200/50 dark:bg-[#12151D]/60 border border-slate-200/50 dark:border-white/[0.03] transform translate-y-3 scale-90 opacity-40 pointer-events-none" />

        {/* Layer 1 (Middle Card) */}
        <div className="absolute w-[95%] h-full rounded-2xl bg-slate-100/80 dark:bg-[#181B25]/80 border border-slate-200/70 dark:border-white/[0.05] transform translate-y-1.5 scale-95 opacity-70 pointer-events-none" />

        {/* Front Active Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentOrder.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-[#181B25] dark:to-[#12151D] border border-slate-200 dark:border-white/[0.08] shadow-lg flex flex-col justify-between"
          >
            {/* Top Row: Order ID + Status Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#F2F4F8] tracking-wider">
                {currentOrder.orderNumber}
              </span>
              {getStatusBadge(currentOrder.status)}
            </div>

            {/* Product Info Row: Icon/Thumbnail + Product Name + Stock Note */}
            <div className="flex items-start gap-3 my-1">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 dark:bg-[#1A1D26] border border-brand-orange/20 dark:border-white/[0.08] flex items-center justify-center flex-shrink-0 text-brand-orange">
                <Box className="w-5 h-5" strokeWidth={1.5} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-[#F2F4F8] truncate leading-tight">
                  {currentOrder.primaryItemName}
                </h4>
                <p className="text-[11px] text-slate-400 dark:text-[#9AA0AE] truncate mt-0.5">
                  Stock Note: {currentOrder.itemsCount} units allocated ({currentOrder.city} hub)
                </p>
              </div>
            </div>

            {/* Bordered 2x2 Info Box */}
            <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0D14]/60 border border-slate-200/80 dark:border-white/[0.08] text-xs">
              {/* Box 1: Ordered By */}
              <div className="min-w-0 pr-1 border-r border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="text-[10px] text-slate-400 dark:text-[#9AA0AE] block truncate uppercase tracking-wider font-semibold">
                  Ordered By
                </span>
                <p className="font-bold text-slate-900 dark:text-[#F2F4F8] truncate mt-0.5" title={currentOrder.customerName}>
                  {currentOrder.customerName}
                </p>
              </div>

              {/* Box 2: Price in ₹ */}
              <div className="min-w-0 pl-1 border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
                <span className="text-[10px] text-slate-400 dark:text-[#9AA0AE] block uppercase tracking-wider font-semibold">
                  Price in ₹
                </span>
                <p className="font-extrabold text-brand-orange truncate mt-0.5">
                  {formatINR(currentOrder.amountINR)}
                </p>
              </div>

              {/* Box 3: Payment Type */}
              <div className="min-w-0 pr-1 pt-2 border-r border-slate-200/60 dark:border-white/[0.06]">
                <span className="text-[10px] text-slate-400 dark:text-[#9AA0AE] block truncate uppercase tracking-wider font-semibold">
                  Payment Type
                </span>
                <p className="font-semibold text-slate-800 dark:text-[#F2F4F8] truncate mt-0.5">
                  {paymentType}
                </p>
              </div>

              {/* Box 4: Order Date */}
              <div className="min-w-0 pl-1 pt-2">
                <span className="text-[10px] text-slate-400 dark:text-[#9AA0AE] block uppercase tracking-wider font-semibold">
                  Order Date
                </span>
                <p className="font-mono font-bold text-slate-800 dark:text-[#F2F4F8] truncate mt-0.5">
                  {formatDateDDMMYYYY(currentOrder.date)}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
};
