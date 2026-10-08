import { PeriodType } from '../types/common';
import { inventoryService } from './inventoryService';
import { MOCK_ORDERS_STATUS_BREAKDOWN, MOCK_ORDER_HISTORY, OrdersStatusSummary } from '../data/ordersData';
import { MOCK_ACTIVE_SHIPMENTS } from '../data/logisticsData';
import { OrderHistoryItem } from '../types/sales';
import { ActiveShipment } from '../types/logistics';
import { MOCK_CUSTOMERS } from '../data/customers';

export interface DashboardKPICard {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  subtitle: string;
  trendText: string;
  trendPercent: number;
  isPositive: boolean;
  sparkline: number[];
}

export interface StockDonutSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
  statusKey: 'in_stock' | 'low_stock' | 'out_of_stock' | 'dead_stock';
}

export interface UserDashboardLayout {
  cardOrder: string[];
  hiddenCards: string[];
}

const DEFAULT_CARD_ORDER = [
  'orders_card',
  'stock_donut_card',
  'order_history_card',
  'logistics_map_card',
  'product_table_card',
];

const inMemoryLayouts = new Map<string, UserDashboardLayout>();

export const dashboardService = {
  async getKPIs(period: PeriodType, warehouseId: string): Promise<DashboardKPICard[]> {
    await new Promise((res) => setTimeout(res, 50));

    const { items, totalCount, statusCounts } = await inventoryService.getItems({
      warehouseId,
      pageSize: 5000,
    });

    const totalPieces = items.reduce((sum, item) => sum + item.currentStock, 0);
    const totalStockValueINR = items.reduce(
      (sum, item) => sum + item.currentStock * item.costPrice,
      0
    );

    // Outstanding payments from customers
    const totalOutstandingINR = MOCK_CUSTOMERS.reduce(
      (sum, c) => sum + c.outstandingBalanceINR,
      0
    );

    // Period scaling factor for realistic metrics
    const multiplier =
      period === 'today'
        ? 0.035
        : period === 'week'
        ? 0.22
        : period === 'month'
        ? 1.0
        : period === 'year'
        ? 12.0
        : 1.0;

    const todaySales = Math.round(425000 * (period === 'today' ? 1.0 : multiplier > 1 ? 1.0 : 0.8));
    const monthSales = Math.round(6840000 * multiplier);

    return [
      {
        id: 'total_items',
        title: 'Total Items',
        value: totalCount.toLocaleString('en-IN'),
        numericValue: totalCount,
        subtitle: 'Master SKUs recorded',
        trendText: '+12% vs last quarter',
        trendPercent: 12.0,
        isPositive: true,
        sparkline: [3100, 3180, 3240, 3290, 3350, 3390, totalCount],
      },
      {
        id: 'total_pieces',
        title: 'Total Pieces',
        value: totalPieces.toLocaleString('en-IN'),
        numericValue: totalPieces,
        subtitle: 'Physical inventory volume',
        trendText: '+4.8% inward shipments',
        trendPercent: 4.8,
        isPositive: true,
        sparkline: [138000, 140500, 142000, 145000, 144200, 146900, totalPieces],
      },
      {
        id: 'stock_value',
        title: 'Stock Value',
        value: totalStockValueINR >= 10000000 
          ? `₹${(totalStockValueINR / 10000000).toFixed(2)} Cr`
          : `₹${(totalStockValueINR / 100000).toFixed(2)} L`,
        numericValue: totalStockValueINR,
        subtitle: 'FIFO wholesale valuation',
        trendText: '+2.1% net book value',
        trendPercent: 2.1,
        isPositive: true,
        sparkline: [78, 80, 81.5, 82.2, 83.1, 83.8, Number((totalStockValueINR / 10000000).toFixed(2))],
      },
      {
        id: 'today_sales',
        title: "Today's Sales",
        value: `₹${todaySales.toLocaleString('en-IN')}`,
        numericValue: todaySales,
        subtitle: '18 dispatch invoices billed',
        trendText: '+15.2% vs yesterday',
        trendPercent: 15.2,
        isPositive: true,
        sparkline: [280, 310, 340, 290, 380, 410, Math.round(todaySales / 1000)],
      },
      {
        id: 'month_sales',
        title: period === 'year' ? "FY 2026-27 Sales" : "This Month's Sales",
        value: monthSales >= 10000000 
          ? `₹${(monthSales / 10000000).toFixed(2)} Cr`
          : `₹${(monthSales / 100000).toFixed(2)} L`,
        numericValue: monthSales,
        subtitle: `Target: ₹80.0 L (85.5% achieved)`,
        trendText: '+8.4% YoY growth',
        trendPercent: 8.4,
        isPositive: true,
        sparkline: [48, 52, 55, 60, 62, 65, Number((monthSales / 100000).toFixed(1))],
      },
      {
        id: 'outstanding_payments',
        title: 'Outstanding Due',
        value: `₹${(totalOutstandingINR / 100000).toFixed(2)} L`,
        numericValue: totalOutstandingINR,
        subtitle: 'Overdue receivables > 30d',
        trendText: '4 invoices overdue',
        trendPercent: -3.5,
        isPositive: false,
        sparkline: [18, 19.5, 21, 20.2, 22.1, 21.8, Number((totalOutstandingINR / 100000).toFixed(1))],
      },
      {
        id: 'low_stock_alerts',
        title: 'Low-Stock Alerts',
        value: `${statusCounts.lowStock + statusCounts.outOfStock} Items`,
        numericValue: statusCounts.lowStock + statusCounts.outOfStock,
        subtitle: `${statusCounts.outOfStock} zero, ${statusCounts.lowStock} near threshold`,
        trendText: 'Immediate PO suggested',
        trendPercent: -5.0,
        isPositive: false,
        sparkline: [18, 16, 17, 15, 14, 15, statusCounts.lowStock + statusCounts.outOfStock],
      },
    ];
  },

  async getStockDonut(warehouseId: string): Promise<StockDonutSegment[]> {
    await new Promise((res) => setTimeout(res, 40));
    const { statusCounts } = await inventoryService.getItems({ warehouseId });
    const total = statusCounts.total || 1;

    return [
      {
        name: 'In Stock',
        value: statusCounts.inStock,
        percentage: Number(((statusCounts.inStock / total) * 100).toFixed(1)),
        color: '#10B981', // emerald-500
        statusKey: 'in_stock',
      },
      {
        name: 'Low Stock',
        value: statusCounts.lowStock,
        percentage: Number(((statusCounts.lowStock / total) * 100).toFixed(1)),
        color: '#F59E0B', // amber-500
        statusKey: 'low_stock',
      },
      {
        name: 'Out of Stock',
        value: statusCounts.outOfStock,
        percentage: Number(((statusCounts.outOfStock / total) * 100).toFixed(1)),
        color: '#EF4444', // rose-500
        statusKey: 'out_of_stock',
      },
      {
        name: 'Dead Stock (>90d)',
        value: statusCounts.deadStock,
        percentage: Number(((statusCounts.deadStock / total) * 100).toFixed(1)),
        color: '#8B5CF6', // violet-500
        statusKey: 'dead_stock',
      },
    ];
  },

  async getOrdersBreakdown(period: PeriodType): Promise<OrdersStatusSummary[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...MOCK_ORDERS_STATUS_BREAKDOWN];
  },

  async getOrderHistory(): Promise<OrderHistoryItem[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...MOCK_ORDER_HISTORY];
  },

  async getActiveShipments(): Promise<ActiveShipment[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...MOCK_ACTIVE_SHIPMENTS];
  },

  getUserLayout(userId: string): UserDashboardLayout {
    try {
      if (inMemoryLayouts.has(userId)) {
        return inMemoryLayouts.get(userId)!;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(`stockvista_layout_${userId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return {
      cardOrder: [...DEFAULT_CARD_ORDER],
      hiddenCards: [],
    };
  },

  saveUserLayout(userId: string, layout: UserDashboardLayout): void {
    try {
      inMemoryLayouts.set(userId, layout);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(`stockvista_layout_${userId}`, JSON.stringify(layout));
      }
    } catch {}
  },
};

