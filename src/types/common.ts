export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent?: boolean;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'dead_stock';

export interface DateRange {
  startDate: string; // ISO string
  endDate: string;   // ISO string
}
