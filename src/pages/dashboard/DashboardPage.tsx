import React, { useState, useEffect } from 'react';
import { KPISection } from '../../components/dashboard/KPISection';
import { OrdersCard } from '../../components/dashboard/OrdersCard';
import { StockDonutCard } from '../../components/dashboard/StockDonutCard';
import { OrderHistoryCarousel } from '../../components/dashboard/OrderHistoryCarousel';
import { LogisticsMapCard } from '../../components/dashboard/LogisticsMapCard';
import { ProductListTableCard } from '../../components/dashboard/ProductListTableCard';
import { DashboardLayoutModal } from '../../components/dashboard/DashboardLayoutModal';
import {
  dashboardService,
  DashboardKPICard,
  StockDonutSegment,
  UserDashboardLayout,
} from '../../services/dashboardService';
import { OrdersStatusSummary } from '../../data/ordersData';
import { MOCK_ACTIVE_SHIPMENTS } from '../../data/logisticsData';
import { OrderHistoryItem } from '../../types/sales';
import { ActiveShipment } from '../../types/logistics';
import { StockStatus } from '../../types/common';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  SlidersHorizontal,
  FilePlus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    selectedWarehouseId,
    period,
    dashboardLayoutOpen,
    setDashboardLayoutOpen,
  } = useUIStore();

  const [kpis, setKpis] = useState<DashboardKPICard[]>([]);
  const [stockDonut, setStockDonut] = useState<StockDonutSegment[]>([]);
  const [ordersBreakdown, setOrdersBreakdown] = useState<OrdersStatusSummary[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [shipments, setShipments] = useState<ActiveShipment[]>(MOCK_ACTIVE_SHIPMENTS);
  const [isLoading, setIsLoading] = useState(true);

  // Cross-component link: Clicking a segment on the Stock Donut filters the Product Table
  const [tableStatusFilter, setTableStatusFilter] = useState<StockStatus | 'all'>('all');

  // User Dashboard layout customization
  const userId = user?.id || 'usr-default';
  const [layout, setLayout] = useState<UserDashboardLayout>(() =>
    dashboardService.getUserLayout(userId)
  );

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, donutRes, ordersRes, histRes, shipRes] = await Promise.all([
        dashboardService.getKPIs(period, selectedWarehouseId),
        dashboardService.getStockDonut(selectedWarehouseId),
        dashboardService.getOrdersBreakdown(period),
        dashboardService.getOrderHistory(),
        dashboardService.getActiveShipments(),
      ]);

      setKpis(kpiRes);
      setStockDonut(donutRes);
      setOrdersBreakdown(ordersRes);
      setOrderHistory(histRes);
      setShipments(shipRes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, selectedWarehouseId]);

  const handleSaveLayout = (newLayout: UserDashboardLayout) => {
    setLayout(newLayout);
    dashboardService.saveUserLayout(userId, newLayout);
  };

  // Render individual cards dynamically according to user's saved layout order
  const renderCard = (cardId: string) => {
    if (layout.hiddenCards.includes(cardId)) return null;

    switch (cardId) {
      case 'orders_card':
        return (
          <div key={cardId} className="w-full">
            <OrdersCard breakdown={ordersBreakdown} />
          </div>
        );
      case 'stock_donut_card':
        return (
          <div key={cardId} className="w-full">
            <StockDonutCard
              segments={stockDonut}
              activeFilter={tableStatusFilter}
              onSelectSegment={setTableStatusFilter}
            />
          </div>
        );
      case 'order_history_card':
        return (
          <div key={cardId} className="w-full">
            <OrderHistoryCarousel orders={orderHistory} />
          </div>
        );
      case 'logistics_map_card':
        return (
          <div key={cardId} className="w-full col-span-1 md:col-span-2 xl:col-span-3">
            <LogisticsMapCard shipments={shipments} />
          </div>
        );
      case 'product_table_card':
        return (
          <div key={cardId} className="w-full col-span-1 md:col-span-2 xl:col-span-3">
            <ProductListTableCard
              warehouseId={selectedWarehouseId}
              statusFilter={tableStatusFilter}
              onStatusFilterChange={setTableStatusFilter}
            />
          </div>
        );
      default:
        return null;
    }
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
            Real-time warehouse metrics, automated inventory thresholds, and active logistics routes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-[#9AA0AE] hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>

          {/* Customize Layout */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDashboardLayoutOpen(true)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Customize
          </Button>

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

      {/* Row 1: KPI Metrics Section */}
      <KPISection kpis={kpis} isLoading={isLoading} />

      {/* Custom Dynamic Grid Cards (Template arrangement: Orders + Stock + Order History, then Logistics, then Product List) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {layout.cardOrder.map((cardId) => renderCard(cardId))}
      </div>

      {/* Customize Layout Modal */}
      <DashboardLayoutModal
        isOpen={dashboardLayoutOpen}
        onClose={() => setDashboardLayoutOpen(false)}
        currentLayout={layout}
        onSave={handleSaveLayout}
      />
    </div>
  );
};
