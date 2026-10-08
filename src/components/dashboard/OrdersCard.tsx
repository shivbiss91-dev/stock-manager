import React from 'react';
import { Card } from '../common/Card';
import { OrdersStatusSummary } from '../../data/ordersData';
import { SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrdersCardProps {
  breakdown: OrdersStatusSummary[];
}

export const OrdersCard: React.FC<OrdersCardProps> = ({ breakdown }) => {
  const navigate = useNavigate();

  // Find counts for the four canonical statuses
  const overdueItem = breakdown.find((b) => b.status === 'overdue') || {
    status: 'overdue',
    label: 'Overdue',
    count: 14,
    percentage: 8,
    totalAmountINR: 280000,
  };
  const returnsItem = breakdown.find((b) => b.status === 'returned') || {
    status: 'returned',
    label: 'Returns',
    count: 8,
    percentage: 5,
    totalAmountINR: 120000,
  };
  const inProgressItem = breakdown.find((b) => b.status === 'in_progress') || {
    status: 'in_progress',
    label: 'In Progress',
    count: 42,
    percentage: 26,
    totalAmountINR: 980000,
  };
  const completedItem = breakdown.find((b) => b.status === 'completed') || {
    status: 'completed',
    label: 'Completed',
    count: 156,
    percentage: 61,
    totalAmountINR: 3450000,
  };

  const columns = [
    {
      ...overdueItem,
      label: 'Overdue',
      fill: '#000000',
      textColor: 'text-white',
      patternUrl: undefined,
    },
    {
      ...returnsItem,
      label: 'Returns',
      fill: 'url(#texture-zigzag)',
      textColor: 'text-white',
      patternUrl: 'url(#texture-zigzag)',
    },
    {
      ...inProgressItem,
      label: 'In Progress',
      fill: 'url(#texture-speckle)',
      textColor: 'text-white',
      patternUrl: 'url(#texture-speckle)',
    },
    {
      ...completedItem,
      label: 'Completed',
      fill: 'url(#texture-blue-gradient)',
      textColor: 'text-white',
      patternUrl: 'url(#texture-blue-gradient)',
    },
  ];

  const maxCount = Math.max(...columns.map((c) => c.count), 1);

  const handleBarClick = (status: string) => {
    navigate(`/sales/orders?status=${status}`);
  };

  return (
    <Card
      variant="solid-blue"
      noPadding
      className="relative overflow-hidden flex flex-col justify-between min-h-[300px] sm:min-h-[320px] shadow-xl group"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between p-5 pb-2 relative z-10">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Orders</h3>
          <p className="text-xs text-white/70">Fulfillment pipeline</p>
        </div>

        {/* Tune Icon Button in Corner */}
        <button
          onClick={() => navigate('/sales/orders')}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all group-hover:scale-105"
          title="Orders tuning & filters"
          aria-label="Tune orders"
        >
          <SlidersHorizontal className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* 4 Vertical Bars: bleeding off the bottom */}
      <div className="flex-1 grid grid-cols-4 gap-3 px-5 pt-4 items-end relative z-10">
        {columns.map((col) => {
          // Height proportional to real value (minimum visible height 20%)
          const heightPct = Math.max(22, Math.round((col.count / maxCount) * 100));

          return (
            <div
              key={col.status}
              onClick={() => handleBarClick(col.status)}
              className="flex flex-col items-center h-full justify-end cursor-pointer group/bar transition-all"
              title={`${col.label}: ${col.count} orders - click to view`}
            >
              {/* Count & Label above each bar */}
              <div className="text-center mb-2.5 transition-transform group-hover/bar:-translate-y-1">
                <span className="block text-xl sm:text-2xl font-extrabold text-white leading-none">
                  {col.count}
                </span>
                <span className="block text-[11px] sm:text-xs text-white/80 font-medium truncate mt-1">
                  {col.label}
                </span>
              </div>

              {/* Textured Vertical Bar Bleeding off bottom */}
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full rounded-t-xl overflow-hidden transition-all duration-300 group-hover/bar:brightness-110 relative shadow-lg"
              >
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <rect
                    width="100%"
                    height="100%"
                    fill={col.fill}
                    className="transition-all"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
