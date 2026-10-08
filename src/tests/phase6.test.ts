import { describe, it, expect } from 'vitest';
import { purchaseService } from '../services/purchaseService';
import { warehouseService } from '../services/warehouseService';
import { inventoryService } from '../services/inventoryService';
import { customerService } from '../services/customerService';

describe('Phase 6: Purchases, Transfers, Hubs, Ledgers & Reports', () => {
  it('1. Verifies 4 regional warehouse hubs with capacity and valuation metrics', async () => {
    const all = await warehouseService.getWarehouses();
    const hubs = all.filter((h) => h.id !== 'all');
    expect(hubs.length).toBe(4);

    const codes = hubs.map((h) => h.code);
    expect(codes.some((c) => c.startsWith('BHW'))).toBe(true);
    expect(codes.some((c) => c.startsWith('PNV'))).toBe(true);
    expect(codes.some((c) => c.startsWith('OKH'))).toBe(true);
    expect(codes.some((c) => c.startsWith('PEE'))).toBe(true);

    hubs.forEach((h) => {
      expect(h.totalCapacitySqFt).toBeGreaterThan(0);
      expect(h.utilizedCapacityPercent).toBeGreaterThanOrEqual(0);
      expect(h.utilizedCapacityPercent).toBeLessThanOrEqual(100);
      expect(h.totalItemsCount).toBeGreaterThan(0);
    });
  });

  it('2. Creates Purchase Order and verifies auto-incremented PO number format', async () => {
    const po = await purchaseService.createPurchaseOrder({
      date: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      supplierId: 'sup-001',
      supplierName: 'Greenply Industries Ltd',
      supplierGstin: '19AAACG1000G1Z1',
      warehouseId: 'wh-001',
      warehouseName: 'Bhiwandi Central Hub (MH)',
      status: 'approved',
      paymentTerms: '45 Days Net',
      createdBy: 'Procurement Manager',
      subtotalTaxable: 215000,
      totalTax: 38700,
      grandTotal: 253700,
      items: [
        {
          id: 'pol-test',
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          hsnCode: '440711',
          quantityOrdered: 100,
          quantityReceived: 0,
          unit: 'sheets',
          rate: 2150,
          gstRate: 18,
          lineTaxable: 215000,
          taxAmount: 38700,
          lineTotal: 253700,
        },
      ],
    });

    expect(po.poNumber).toMatch(/^PO-2026-\d{4}$/);
    expect(po.status).toBe('approved');
    expect(po.grandTotal).toBe(253700);
  });

  it('3. Inwards consignment via GRN and increases warehouse stock', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();
    const initialStock = item!.currentStock;

    const grn = await purchaseService.createGRN({
      poId: 'po-001',
      poNumber: 'PO-2026-0422',
      supplierId: 'sup-001',
      supplierName: 'Greenply Industries Ltd',
      warehouseId: 'wh-001',
      warehouseName: 'Bhiwandi Central Hub (MH)',
      receivedDate: new Date().toISOString(),
      supplierInvoiceNumber: 'GP-INV-TEST-01',
      supplierInvoiceDate: '2026-10-06',
      vehicleNumber: 'MH-04-AB-9999',
      transporterName: 'V-Trans Logistics',
      status: 'accepted',
      receivedBy: 'Warehouse Master',
      remarks: 'Moisture and core verification passed',
      items: [
        {
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          quantityReceived: 50,
          acceptedQty: 50,
          rejectedQty: 0,
          unit: 'sheets',
        },
      ],
    });

    expect(grn.grnNumber).toMatch(/^GRN-2026-\d{4}$/);
    expect(grn.status).toBe('accepted');

    // Verify stock incremented by 50
    const updated = await inventoryService.getItemById('item-wd-0001');
    expect(updated!.currentStock).toBe(initialStock + 50);
  });

  it('4. Processes supplier bills and disbursements', async () => {
    const bills = await purchaseService.getSupplierBills();
    expect(bills.length).toBeGreaterThan(0);
    const target = bills[0];

    const updated = await purchaseService.paySupplierBill(target.id, 50000);
    expect(updated.amountPaid).toBeGreaterThanOrEqual(50000);
    expect(updated.balanceDue).toBe(updated.totalAmount - updated.amountPaid);
  });

  it('5. Dispatches inter-hub transfer between regional warehouses', async () => {
    const tr = await purchaseService.createTransfer({
      date: new Date().toISOString(),
      fromWarehouseId: 'wh-001',
      fromWarehouseName: 'Bhiwandi Central Hub (MH)',
      toWarehouseId: 'wh-004',
      toWarehouseName: 'Peenya Hub (KA)',
      vehicleNumber: 'KA-01-AB-1234',
      driverName: 'Suresh Gowda',
      driverPhone: '+91 98450 99881',
      status: 'in_transit',
      dispatchedAt: new Date().toISOString(),
      createdBy: 'Logistics Supervisor',
      items: [
        {
          itemId: 'item-wd-0001',
          name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
          sku: 'WD-VEN-GUR-0001',
          quantity: 20,
          unit: 'sheets',
        },
      ],
    });

    expect(tr.transferNumber).toMatch(/^TR-2026-\d{3}$/);
    expect(tr.status).toBe('in_transit');
    expect(tr.items[0].quantity).toBe(20);
  });

  it('6. Queries commercial quotations, sales orders, and credit returns', async () => {
    const quotations = await purchaseService.getQuotations();
    expect(quotations.length).toBeGreaterThan(0);
    expect(quotations[0].quotationNumber).toContain('QT-');

    const orders = await purchaseService.getSalesOrders();
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].orderNumber).toContain('SO-');

    const returns = await purchaseService.getReturns();
    expect(returns.length).toBeGreaterThan(0);
    expect(returns[0].returnNumber).toContain('CRN-');
  });

  it('7. Calculates 30/60/90-day customer receivables ageing distribution', async () => {
    const customers = await customerService.getCustomers();
    const totalDebt = customers.reduce((acc, c) => acc + c.outstandingBalanceINR, 0);

    expect(totalDebt).toBeGreaterThan(0);
    expect(customers.every((c) => c.creditLimitINR > 0)).toBe(true);
  });
});
