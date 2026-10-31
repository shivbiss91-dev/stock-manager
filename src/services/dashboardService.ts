import { PeriodType } from '../types/common';
import { inventoryService } from './inventoryService';
import { OrdersStatusSummary } from '../data/ordersData';
import { OrderHistoryItem, Invoice, Customer } from '../types/sales';
import { ActiveShipment } from '../types/logistics';
import { StorageService, STORAGE_KEYS } from './storageService';

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
    const { items, totalCount, statusCounts } = await inventoryService.getItems({
      warehouseId,
      pageSize: 5000,
    });

    const totalPieces = items.reduce((sum, item) => sum + item.currentStock, 0);
    const totalStockValueINR = items.reduce(
      (sum, item) => sum + item.currentStock * item.costPrice,
      0
    );

    // Outstanding payments from stored customers and unpaid invoices
    const customers = StorageService.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    const invoices = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);

    const customerOutstanding = customers.reduce(
      (sum, c) => sum + (c.outstandingBalanceINR || 0),
      0
    );
    const invoiceOutstanding = invoices
      .filter((inv) => inv.status === 'overdue' || inv.status === 'sent' || inv.status === 'partially_paid')
      .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    const totalOutstandingINR = customerOutstanding + invoiceOutstanding;

    // Filter real invoices for today and current month/year
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);
    const yearStr = todayStr.slice(0, 4);

    const todayInvoices = invoices.filter((inv) => inv.date?.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const monthInvoices = invoices.filter((inv) =>
      period === 'year' ? inv.date?.startsWith(yearStr) : inv.date?.startsWith(monthStr)
    );
    const monthSales = monthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    const makeSparkline = (val: number): number[] => {
      if (val === 0) return [0, 0, 0, 0, 0, 0, 0];
      return [
        Math.round(val * 0.9),
        Math.round(val * 0.94),
        Math.round(val * 0.92),
        Math.round(val * 0.97),
        Math.round(val * 0.95),
        Math.round(val * 0.98),
        val,
      ];
    };

    return [
      {
        id: 'total_items',
        title: 'Total Items',
        value: totalCount.toLocaleString('en-IN'),
        numericValue: totalCount,
        subtitle: totalCount > 0 ? `${totalCount} Master SKUs recorded` : 'No SKUs added yet',
        trendText: totalCount > 0 ? 'Active catalog' : 'No catalog items',
        trendPercent: 0,
        isPositive: true,
        sparkline: makeSparkline(totalCount),
      },
      {
        id: 'total_pieces',
        title: 'Total Pieces',
        value: totalPieces.toLocaleString('en-IN'),
        numericValue: totalPieces,
        subtitle: totalPieces > 0 ? `${totalPieces.toLocaleString('en-IN')} physical inventory` : '0 physical inventory volume',
        trendText: totalPieces > 0 ? 'Stock recorded' : 'No physical stock',
        trendPercent: 0,
        isPositive: true,
        sparkline: makeSparkline(totalPieces),
      },
      {
        id: 'stock_value',
        title: 'Stock Value',
        value:
          totalStockValueINR >= 10000000
            ? `₹${(totalStockValueINR / 10000000).toFixed(2)} Cr`
            : totalStockValueINR > 0
            ? `₹${(totalStockValueINR / 100000).toFixed(2)} L`
            : '₹0.00',
        numericValue: totalStockValueINR,
        subtitle: 'FIFO wholesale valuation',
        trendText: totalStockValueINR > 0 ? 'Valuation at cost' : 'Zero valuation',
        trendPercent: 0,
        isPositive: true,
        sparkline: makeSparkline(totalStockValueINR > 100000 ? Math.round(totalStockValueINR / 100000) : totalStockValueINR),
      },
      {
        id: 'today_sales',
        title: "Today's Sales",
        value: `₹${todaySales.toLocaleString('en-IN')}`,
        numericValue: todaySales,
        subtitle: `${todayInvoices.length} dispatch invoices billed`,
        trendText: todaySales > 0 ? 'Billed today' : 'No sales billed today',
        trendPercent: 0,
        isPositive: true,
        sparkline: makeSparkline(todaySales > 1000 ? Math.round(todaySales / 1000) : todaySales),
      },
      {
        id: 'month_sales',
        title: period === 'year' ? `FY ${yearStr} Sales` : "This Month's Sales",
        value:
          monthSales >= 10000000
            ? `₹${(monthSales / 10000000).toFixed(2)} Cr`
            : monthSales > 0
            ? `₹${(monthSales / 100000).toFixed(2)} L`
            : '₹0.00',
        numericValue: monthSales,
        subtitle: `${monthInvoices.length} invoices recorded`,
        trendText: monthSales > 0 ? 'Billed revenue' : 'No sales recorded',
        trendPercent: 0,
        isPositive: true,
        sparkline: makeSparkline(monthSales > 100000 ? Math.round(monthSales / 100000) : monthSales),
      },
      {
        id: 'outstanding_payments',
        title: 'Outstanding Due',
        value:
          totalOutstandingINR >= 100000
            ? `₹${(totalOutstandingINR / 100000).toFixed(2)} L`
            : `₹${totalOutstandingINR.toLocaleString('en-IN')}`,
        numericValue: totalOutstandingINR,
        subtitle: totalOutstandingINR > 0 ? 'Pending receivables' : 'Zero overdue payments',
        trendText: totalOutstandingINR > 0 ? 'Receivables pending' : 'Zero overdue payments',
        trendPercent: 0,
        isPositive: totalOutstandingINR === 0,
        sparkline: makeSparkline(totalOutstandingINR > 1000 ? Math.round(totalOutstandingINR / 1000) : totalOutstandingINR),
      },
      {
        id: 'low_stock_alerts',
        title: 'Low-Stock Alerts',
        value: `${statusCounts.lowStock + statusCounts.outOfStock} Items`,
        numericValue: statusCounts.lowStock + statusCounts.outOfStock,
        subtitle: `${statusCounts.outOfStock} zero, ${statusCounts.lowStock} near threshold`,
        trendText:
          statusCounts.lowStock + statusCounts.outOfStock > 0
            ? 'Immediate PO suggested'
            : 'Inventory levels optimal',
        trendPercent: 0,
        isPositive: statusCounts.lowStock + statusCounts.outOfStock === 0,
        sparkline: makeSparkline(statusCounts.lowStock + statusCounts.outOfStock),
      },
    ];
  },

  async getStockDonut(warehouseId: string): Promise<StockDonutSegment[]> {
    const { statusCounts } = await inventoryService.getItems({ warehouseId });
    const total = statusCounts.total || 0;

    return [
      {
        name: 'In Stock',
        value: statusCounts.inStock,
        percentage: total > 0 ? Number(((statusCounts.inStock / total) * 100).toFixed(1)) : 0,
        color: '#10B981', // emerald-500
        statusKey: 'in_stock',
      },
      {
        name: 'Low Stock',
        value: statusCounts.lowStock,
        percentage: total > 0 ? Number(((statusCounts.lowStock / total) * 100).toFixed(1)) : 0,
        color: '#F59E0B', // amber-500
        statusKey: 'low_stock',
      },
      {
        name: 'Out of Stock',
        value: statusCounts.outOfStock,
        percentage: total > 0 ? Number(((statusCounts.outOfStock / total) * 100).toFixed(1)) : 0,
        color: '#EF4444', // rose-500
        statusKey: 'out_of_stock',
      },
      {
        name: 'Dead Stock (>90d)',
        value: statusCounts.deadStock,
        percentage: total > 0 ? Number(((statusCounts.deadStock / total) * 100).toFixed(1)) : 0,
        color: '#8B5CF6', // violet-500
        statusKey: 'dead_stock',
      },
    ];
  },

  async getOrdersBreakdown(_period: PeriodType): Promise<OrdersStatusSummary[]> {
    const invoices = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const returns = StorageService.get<any[]>(STORAGE_KEYS.RETURNS, []);

    const completed = invoices.filter((inv) => inv.status === 'paid');
    const inProgress = invoices.filter((inv) => inv.status === 'sent' || inv.status === 'partially_paid');
    const overdue = invoices.filter((inv) => inv.status === 'overdue');

    const completedCount = completed.length;
    const completedTotal = completed.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    const inProgressCount = inProgress.length;
    const inProgressTotal = inProgress.reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    const overdueCount = overdue.length;
    const overdueTotal = overdue.reduce((sum, i) => sum + (i.balanceDue || 0), 0);

    const returnedCount = returns.length;
    const returnedTotal = returns.reduce((sum, r) => sum + (r.totalAmountINR || r.refundAmount || 0), 0);

    const totalCount = completedCount + inProgressCount + overdueCount + returnedCount;

    return [
      {
        status: 'completed',
        label: 'Completed & Delivered',
        count: completedCount,
        totalAmountINR: completedTotal,
        percentage: totalCount > 0 ? Number(((completedCount / totalCount) * 100).toFixed(1)) : 0,
        colorClass: 'bg-emerald-500 text-emerald-500',
        texturePattern: 'bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:6px_6px]',
      },
      {
        status: 'in_progress',
        label: 'In Progress / Transit',
        count: inProgressCount,
        totalAmountINR: inProgressTotal,
        percentage: totalCount > 0 ? Number(((inProgressCount / totalCount) * 100).toFixed(1)) : 0,
        colorClass: 'bg-blue-500 text-blue-500',
        texturePattern: 'bg-[radial-gradient(#3B82F6_1px,transparent_1px)] [background-size:6px_6px]',
      },
      {
        status: 'overdue',
        label: 'Payment Overdue',
        count: overdueCount,
        totalAmountINR: overdueTotal,
        percentage: totalCount > 0 ? Number(((overdueCount / totalCount) * 100).toFixed(1)) : 0,
        colorClass: 'bg-rose-500 text-rose-500',
        texturePattern: 'bg-[radial-gradient(#EF4444_1px,transparent_1px)] [background-size:6px_6px]',
      },
      {
        status: 'returned',
        label: 'Returns / Credit Notes',
        count: returnedCount,
        totalAmountINR: returnedTotal,
        percentage: totalCount > 0 ? Number(((returnedCount / totalCount) * 100).toFixed(1)) : 0,
        colorClass: 'bg-amber-500 text-amber-500',
        texturePattern: 'bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:6px_6px]',
      },
    ];
  },

  async getOrderHistory(): Promise<OrderHistoryItem[]> {
    const invoices = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    return invoices.map((inv) => ({
      id: inv.id,
      orderNumber: inv.invoiceNumber,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      city: inv.placeOfSupplyStateName || 'HQ',
      state: inv.placeOfSupplyStateName || 'HQ',
      date: inv.date,
      itemsCount: inv.items ? inv.items.reduce((s, it) => s + (it.quantity || 0), 0) : 0,
      primaryItemName: inv.items && inv.items[0] ? inv.items[0].name : 'Standard Item',
      amountINR: inv.grandTotal || 0,
      status:
        inv.status === 'paid'
          ? 'completed'
          : inv.status === 'overdue'
          ? 'overdue'
          : 'in_progress',
    }));
  },

  async getActiveShipments(): Promise<ActiveShipment[]> {
    // Return empty array when no active fleet shipments exist
    return [];
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


