import { StockStatus } from './common';
import { PredefinedUnit, PackagingConversions } from '../utils/unitConversions';

export type { PredefinedUnit, PackagingConversions };

export type MaterialCategory =
  | 'wood'
  | 'metal'
  | 'plastic'
  | 'glass'
  | 'fabric'
  | 'rubber'
  | 'paper'
  | 'ceramic';

export type UnitOfMeasurement =
  | PredefinedUnit
  | 'pieces'
  | 'sheets'
  | 'boxes'
  | 'rolls'
  | 'bundles'
  | 'pairs';

export type SalesVelocity = 'High' | 'Medium' | 'Low';

export interface DailySalesPoint {
  date: string; // YYYY-MM-DD
  units: number;
  revenue: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  materialCategory: MaterialCategory;
  materialSubtype: string;
  description: string;
  currentStock: number;
  unit: UnitOfMeasurement;
  baseUnit?: 'PCS' | 'UNT';
  packagingConversions?: PackagingConversions;
  reorderLevel: number;
  reorderLevelUnit?: PredefinedUnit;
  reorderQuantity?: number;
  reorderQuantityUnit?: PredefinedUnit;
  costPrice: number;    // INR (Exclusive of GST)
  sellingPrice: number; // INR (Exclusive of GST)
  gstRate: number;      // e.g. 18 for 18%
  hsnCode: string;      // 6 or 8 digit HSN code
  warehouseId: string;  // 'wh-001', etc.
  warehouseName: string;
  rackLocation: string; // e.g. 'Rack B3-02'
  supplierId: string;
  supplierName: string;
  images: string[];
  barcode: string;
  sales30Days: number;
  lastSoldDate?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedInventoryItem extends InventoryItem {
  stockStatus: StockStatus;
  salesVelocity: SalesVelocity;
  stockValueINR: number; // currentStock * costPrice
}

export interface MaterialCategoryInfo {
  id: MaterialCategory;
  name: string;
  description: string;
  subtypes: string[];
  defaultHsn: string;
  defaultGstRate: number;
  iconName: string;
  imageUrl: string;
}
