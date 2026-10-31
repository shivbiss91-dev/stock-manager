import { describe, it, expect, beforeAll } from 'vitest';
import { itemAnalyticsService } from '../services/itemAnalyticsService';
import { stockMovementService } from '../services/stockMovementService';
import { inventoryService } from '../services/inventoryService';
import { approvalsService } from '../services/approvalsService';
import { MASTER_INVENTORY } from './fixtures/inventorySeed';

describe('Phase 4: Item Detail, Sales Analytics & Movement Audit', () => {
  beforeAll(() => {
    inventoryService._seedInventoryForTesting(MASTER_INVENTORY);
  });
  const testItemId = 'item-wd-0001';
  const testSellingPrice = 2450;

  it('1. Generates sales analytics strictly adhering to data rules (Avg Price = Sales / Units)', async () => {
    const monthlyAnalytics = await itemAnalyticsService.getSalesAnalytics(
      testItemId,
      testSellingPrice,
      'monthly'
    );

    expect(monthlyAnalytics.chartData.length).toBeGreaterThan(0);
    expect(monthlyAnalytics.totalSalesINR).toBeGreaterThan(0);
    expect(monthlyAnalytics.unitsSold).toBeGreaterThan(0);

    // Verify mathematical integrity: sum of chart points must equal summary total
    const computedSumSales = monthlyAnalytics.chartData.reduce((acc, p) => acc + p.salesINR, 0);
    const computedSumUnits = monthlyAnalytics.chartData.reduce((acc, p) => acc + p.unitsSold, 0);

    expect(monthlyAnalytics.totalSalesINR).toBe(computedSumSales);
    expect(monthlyAnalytics.unitsSold).toBe(computedSumUnits);

    // Verify strict rule: Avg Selling Price = Total Sales / Units Sold
    const expectedAvgPrice = monthlyAnalytics.totalSalesINR / monthlyAnalytics.unitsSold;
    expect(monthlyAnalytics.avgSellingPriceINR).toBeCloseTo(expectedAvgPrice, 2);
  });

  it('2. Supports all 4 time granularities (daily, weekly, monthly, yearly)', async () => {
    const daily = await itemAnalyticsService.getSalesAnalytics(testItemId, testSellingPrice, 'daily');
    const weekly = await itemAnalyticsService.getSalesAnalytics(testItemId, testSellingPrice, 'weekly');
    const monthly = await itemAnalyticsService.getSalesAnalytics(testItemId, testSellingPrice, 'monthly');
    const yearly = await itemAnalyticsService.getSalesAnalytics(testItemId, testSellingPrice, 'yearly');

    expect(daily.chartData.length).toBe(14); // 14 days
    expect(weekly.chartData.length).toBe(8);  // 8 weeks
    expect(monthly.chartData.length).toBe(12); // 12 months
    expect(yearly.chartData.length).toBe(3);   // 3 financial years (FY 2024-25, FY 2025-26, FY 2026-27 YTD)
  });

  it('3. Retrieves top customer purchasing statistics for the item', async () => {
    const topCustomers = await itemAnalyticsService.getTopCustomers(testItemId, testSellingPrice);

    expect(topCustomers.length).toBe(5);
    topCustomers.forEach((cust) => {
      expect(cust.customerName).toBeTruthy();
      expect(cust.unitsPurchased).toBeGreaterThan(0);
      expect(cust.totalSpentINR).toBe(cust.unitsPurchased * testSellingPrice);
      expect(cust.state).toBeTruthy();
    });
  });

  it('4. Provides item documents and certificates', async () => {
    const docs = await itemAnalyticsService.getItemDocuments(testItemId);
    expect(docs.length).toBeGreaterThanOrEqual(4);
    expect(docs.some((d) => d.category === 'Certificate')).toBe(true);
    expect(docs.some((d) => d.category === 'Test Report')).toBe(true);
  });

  it('5. Queries stock movement ledger and verifies audit ordering', async () => {
    const movements = await stockMovementService.getMovements({ itemId: testItemId });
    expect(movements.length).toBeGreaterThanOrEqual(5);

    // Verify sorted descending by date
    for (let i = 0; i < movements.length - 1; i++) {
      const d1 = new Date(movements[i].date).getTime();
      const d2 = new Date(movements[i + 1].date).getTime();
      expect(d1).toBeGreaterThanOrEqual(d2);
    }

    // Verify filter by movement type
    const inMovements = await stockMovementService.getMovements({
      itemId: testItemId,
      type: 'in',
    });
    expect(inMovements.every((m) => m.type === 'in')).toBe(true);
  });

  it('6. Direct Admin Item Update updates master record and prevents duplicate SKU', async () => {
    const existing = await inventoryService.getItemById(testItemId);
    expect(existing).not.toBeNull();

    // Update rack and selling price
    const updated = await inventoryService.updateItem(testItemId, {
      rackLocation: 'Rack BHW-TEST-99',
      sellingPrice: 2600,
    });

    expect(updated.rackLocation).toBe('Rack BHW-TEST-99');
    expect(updated.sellingPrice).toBe(2600);

    // Get another existing item's SKU
    const otherItem = await inventoryService.getItemById('item-wd-0002');
    expect(otherItem).not.toBeNull();

    // Attempting duplicate SKU must throw error
    await expect(
      inventoryService.updateItem(testItemId, {
        sku: otherItem!.sku, // Another existing SKU
      })
    ).rejects.toThrow(/already assigned/);
  });

  it('7. Negative stock prevention rule strictly forbids negative stock balance', async () => {
    const item = await inventoryService.getItemById(testItemId);
    expect(item).not.toBeNull();

    // Attempting to deduct more stock than available
    const excessiveDeduction = -(item!.currentStock + 500);

    await expect(
      inventoryService.updateStock(testItemId, excessiveDeduction, 'Test deduction', 'Tester')
    ).rejects.toThrow(/Insufficient stock. Cannot reduce stock below 0/);
  });

  it('8. Non-admin approval workflow records pending request and allows Admin approval', async () => {
    const approval = await approvalsService.createApproval({
      type: 'price_adjustment',
      targetId: testItemId,
      targetTitle: 'Gurjan BWP Marine Plywood 18mm',
      requestedBy: 'Amit Verma',
      requestedByRole: 'staff',
      oldValue: '₹2,600.00',
      newValue: '₹2,450.00',
      reason: 'Bulk distributor discount requirement',
    });

    expect(approval.id).toBeTruthy();
    expect(approval.status).toBe('pending');

    // Admin approves request
    const approved = await approvalsService.approveRequest(
      approval.id,
      'Rajesh Sharma',
      'Approved for bulk delivery'
    );

    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('Rajesh Sharma');
  });
});
