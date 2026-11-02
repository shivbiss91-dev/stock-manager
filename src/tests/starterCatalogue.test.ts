import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, STORAGE_KEYS } from '../services/storageService';
import { inventoryService } from '../services/inventoryService';
import { warehouseService } from '../services/warehouseService';
import { supplierService } from '../services/supplierService';
import { customerService } from '../services/customerService';
import { dashboardService } from '../services/dashboardService';
import { STARTER_PRODUCTS } from '../data/inventorySeed';
import { PREDEFINED_UNIT_CODES } from '../utils/unitConversions';

describe('StockVista Starter Catalogue Business Requirements', () => {
  beforeEach(() => {
    // Reset to clean fresh install state
    StorageService.resetToFreshInstall();
  });

  it('initializes the catalog with ONLY the four required starter products', async () => {
    const { items, totalCount } = await inventoryService.getItems({ pageSize: 100 });
    expect(totalCount).toBe(4);
    expect(items).toHaveLength(4);

    const productNames = items.map((i) => i.name).sort();
    expect(productNames).toEqual(['Button Bag', 'Card Holder', 'Hook', 'Lanyard'].sort());
  });

  it('ensures opening stock defaults strictly to ZERO for all four products', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    for (const item of items) {
      expect(item.currentStock).toBe(0);
    }
  });

  it('ensures no fake prices or fake HSN codes are pre-generated', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    for (const item of items) {
      expect(item.costPrice).toBe(0);
      expect(item.sellingPrice).toBe(0);
      expect(item.hsnCode).toBe('');
    }
  });

  it('ensures warehouses, suppliers, and customers start completely empty (no fake entities)', async () => {
    const warehouses = await warehouseService.getWarehouses();
    expect(warehouses).toHaveLength(0);

    const suppliers = await supplierService.getSuppliers();
    expect(suppliers).toHaveLength(0);

    const customers = await customerService.getCustomers();
    expect(customers).toHaveLength(0);
  });

  it('ensures warehouse assignment is unassigned and manually configurable', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    for (const item of items) {
      expect(item.warehouseId).toBe('');
      expect(item.warehouseName).toBe('Unassigned');
    }
  });

  it('ensures all products use approved units: PCS, UNT, DOZ, CTN, BOX, BDL', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    for (const item of items) {
      expect(PREDEFINED_UNIT_CODES).toContain(item.unit);
    }
  });

  it('ensures product image is relevant and replaceable', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    const cardHolder = items.find((i) => i.name === 'Card Holder')!;
    expect(cardHolder.images).toBeDefined();
    expect(cardHolder.images.length).toBeGreaterThan(0);
    expect(cardHolder.images[0]).toContain('card-holder');

    // Replace image
    const updated = await inventoryService.updateItem(cardHolder.id, {
      images: ['https://example.com/custom-card-holder.png'],
    });
    expect(updated.images[0]).toBe('https://example.com/custom-card-holder.png');
  });

  it('allows manual configuration of SKU, HSN code, GST rate, purchase price, selling price, and warehouse', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    const lanyard = items.find((i) => i.name === 'Lanyard')!;

    // Create a real warehouse to manually select
    const newWh = await warehouseService.createWarehouse({
      name: 'Mumbai Central Facility',
      code: 'MUM-01',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Plot 42, Logistics Park',
      pincode: '400001',
      capacitySqFt: 50000,
      contactPerson: 'Operations Lead',
      phone: '+91 9876543210',
      email: 'ops@stockvista.com',
      isActive: true,
      zones: [],
    });

    const updated = await inventoryService.updateItem(lanyard.id, {
      sku: 'LAN-PREMIUM-01',
      hsnCode: '630790',
      gstRate: 18,
      costPrice: 15.5,
      sellingPrice: 28.0,
      unit: 'DOZ',
      reorderLevel: 50,
      warehouseId: newWh.id,
      warehouseName: newWh.name,
    });

    expect(updated.sku).toBe('LAN-PREMIUM-01');
    expect(updated.hsnCode).toBe('630790');
    expect(updated.gstRate).toBe(18);
    expect(updated.costPrice).toBe(15.5);
    expect(updated.sellingPrice).toBe(28.0);
    expect(updated.unit).toBe('DOZ');
    expect(updated.reorderLevel).toBe(50);
    expect(updated.warehouseId).toBe(newWh.id);
    expect(updated.warehouseName).toBe('Mumbai Central Facility');
  });

  it('ensures all four products are deletable individually', async () => {
    const { items } = await inventoryService.getItems({ pageSize: 100 });
    expect(items).toHaveLength(4);

    const hookItem = items.find((i) => i.name === 'Hook')!;
    const deleted = await inventoryService.deleteItem(hookItem.id);
    expect(deleted).toBe(true);

    const afterDelete = await inventoryService.getItems({ pageSize: 100 });
    expect(afterDelete.totalCount).toBe(3);
    expect(afterDelete.items.some((i) => i.name === 'Hook')).toBe(false);
  });

  it('calculates all dashboard statistics strictly from actual records', async () => {
    const kpis = await dashboardService.getKPIs('month', 'all');
    const totalItemsKpi = kpis.find((k) => k.id === 'total_items')!;
    const totalPiecesKpi = kpis.find((k) => k.id === 'total_pieces')!;
    const stockValueKpi = kpis.find((k) => k.id === 'stock_value')!;
    const todaySalesKpi = kpis.find((k) => k.id === 'today_sales')!;
    const monthSalesKpi = kpis.find((k) => k.id === 'month_sales')!;
    const outstandingKpi = kpis.find((k) => k.id === 'outstanding_payments')!;

    // Exactly 4 items, 0 pieces, ₹0 value, ₹0 sales, ₹0 outstanding
    expect(totalItemsKpi.numericValue).toBe(4);
    expect(totalPiecesKpi.numericValue).toBe(0);
    expect(stockValueKpi.numericValue).toBe(0);
    expect(todaySalesKpi.numericValue).toBe(0);
    expect(monthSalesKpi.numericValue).toBe(0);
    expect(outstandingKpi.numericValue).toBe(0);

    const donut = await dashboardService.getStockDonut('all');
    const outOfStockSegment = donut.find((d) => d.statusKey === 'out_of_stock')!;
    expect(outOfStockSegment.value).toBe(4);
    expect(outOfStockSegment.percentage).toBe(100);
  });
});
