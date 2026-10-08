import React from 'react';
import { DashboardKPICard } from '../../services/dashboardService';
import { Card } from '../common/Card';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface KPISectionProps {
  kpis: DashboardKPICard[];
  isLoading?: boolean;
}

export const KPISection: React.FC<KPISectionProps> = ({ kpis, isLoading = false }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'total_items':
        return <Package className="w-4 h-4 text-brand-orange" strokeWidth={1.5} />;
      case 'total_pieces':
        return <Layers className="w-4 h-4 text-[#3B5BFF]" strokeWidth={1.5} />;
      case 'stock_value':
        return <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />;
      case 'today_sales':
        return <DollarSign className="w-4 h-4 text-brand-orange" strokeWidth={1.5} />;
      case 'month_sales':
        return <TrendingUp className="w-4 h-4 text-[#3B5BFF]" strokeWidth={1.5} />;
      case 'outstanding_payments':
        return <Clock className="w-4 h-4 text-rose-500" strokeWidth={1.5} />;
      case 'low_stock_alerts':
        return <AlertTriangle className="w-4 h-4 text-amber-500" strokeWidth={1.5} />;
      default:
        return <Package className="w-4 h-4 text-brand-orange" strokeWidth={1.5} />;
    }
  };

  // Render an SVG sparkline path
  const renderSparkline = (data: number[], isPositive: boolean) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 76;
    const height = 22;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#2ECC71' : '#FF6B35';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-100 dark:bg-[#12151D] animate-pulse border border-slate-200/60 dark:border-white/[0.06]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          variant="glass"
          noPadding
          hoverEffect
          className="p-3.5 flex flex-col justify-between group min-h-[110px]"
        >
          {/* Top: Title & Icon */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-xs text-slate-500 dark:text-[#9AA0AE] font-medium truncate">
              {kpi.title}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#1A1D26] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              {getIcon(kpi.id)}
            </div>
          </div>

          {/* Middle: Bold Big Number */}
          <div className="my-0.5">
            <span className="text-xl xl:text-2xl font-bold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
              {kpi.value}
            </span>
          </div>

          {/* Bottom: Subtitle & Sparkline with Trend Arrow */}
          <div className="flex items-end justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-white/[0.04]">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                {kpi.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" strokeWidth={2} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-amber-500 flex-shrink-0" strokeWidth={2} />
                )}
                <span
                  className={`text-[10px] font-bold ${
                    kpi.isPositive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-500'
                  }`}
                >
                  {kpi.trendText}
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              {renderSparkline(kpi.sparkline, kpi.isPositive)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
