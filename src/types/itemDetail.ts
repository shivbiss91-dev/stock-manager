import { StockStatus } from './common';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SalesAnalyticsPoint {
  periodLabel: string; // e.g. "01 Oct", "Week 40", "Sep 2026"
  salesINR: number;    // Sales in ₹
  unitsSold: number;   // Units Sold
  ordersCount: number; // Order transactions count
}

export interface SalesAnalyticsSummary {
  totalSalesINR: number;
  totalSalesChangePercent: number;
  ordersCount: number;
  ordersChangePercent: number;
  unitsSold: number;
  unitsSoldChangePercent: number;
  avgSellingPriceINR: number; // Computed strictly as Total Sales ÷ Units Sold
  avgPriceChangePercent: number;
  chartData: SalesAnalyticsPoint[];
}

export interface TopCustomerItemStat {
  customerId: string;
  customerName: string;
  city: string;
  state: string;
  unitsPurchased: number;
  totalSpentINR: number;
  lastPurchaseDate: string;
}

export type MovementType =
  | 'in'
  | 'out'
  | 'transfer'
  | 'return'
  | 'damage'
  | 'adjustment';

export interface StockMovementRecord {
  id: string;
  itemId: string;
  date: string; // ISO
  type: MovementType;
  stockBefore?: number;
  quantityDelta: number; // positive or negative
  stockAfter: number;
  unit: string;
  userName: string;
  userRole: string;
  referenceNumber: string; // e.g. "GRN-2026-0089", "SO-2026-4401", "TR-2026-012"
  referenceType: 'PO' | 'SO' | 'Transfer' | 'Audit' | 'Return' | 'Adjustment';
  reason?: string;
  notes: string;
}

export interface ItemDocument {
  id: string;
  itemId: string;
  title: string;
  fileType: 'pdf' | 'excel' | 'image' | 'doc';
  fileSize: string; // e.g. "2.4 MB"
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  category: 'Certificate' | 'Supplier Invoice' | 'Spec Sheet' | 'Test Report';
}
