import { OrderHistoryItem, OrderProgressStatus } from '../types/sales';

export interface OrdersStatusSummary {
  status: OrderProgressStatus;
  label: string;
  count: number;
  totalAmountINR: number;
  percentage: number;
  colorClass: string;
  texturePattern: string;
}

/**
 * Orders Data: Empty initial collections for production.
 * Live orders and status distributions are calculated from actual invoices and sales orders.
 */
export const MOCK_ORDERS_STATUS_BREAKDOWN: OrdersStatusSummary[] = [];
export const MOCK_ORDER_HISTORY: OrderHistoryItem[] = [];
