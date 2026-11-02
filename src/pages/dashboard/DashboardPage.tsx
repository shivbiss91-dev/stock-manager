import React, { useState } from 'react';
import { DashboardCalendarCard } from '../../components/dashboard/DashboardCalendarCard';
import { ProductListTableCard } from '../../components/dashboard/ProductListTableCard';
import { StockStatus } from '../../types/common';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { FilePlus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { selectedWarehouseId } = useUIStore();
  const [tableStatusFilter, setTableStatusFilter] = useState<StockStatus | 'all'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Welcome & Quick Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#12151D] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
              Wholesale Operations Center
            </span>
            <Badge variant="solid-blue" size="sm" dot>
              Live Sync
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#F2F4F8] tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#9AA0AE] mt-0.5">
            Operational milestones, automated inventory thresholds, and catalog management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Refresh dashboard data"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
          </button>

          {/* Create Invoice Quick Action */}
          <Link to="/sales/invoices/new">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FilePlus className="w-3.5 h-3.5" />}
            >
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Operations Calendar */}
      <DashboardCalendarCard key={`cal-${refreshKey}`} />

      {/* Product List Master Table */}
      <ProductListTableCard
        key={`prod-${refreshKey}`}
        warehouseId={selectedWarehouseId}
        statusFilter={tableStatusFilter}
        onStatusFilterChange={setTableStatusFilter}
      />
    </div>
  );
};
