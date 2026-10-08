import {
  PurchaseOrder,
  GoodsReceivedNote,
  SupplierBill,
  InterHubTransfer,
  SalesQuotation,
  SalesOrder,
  SalesReturn,
} from '../types/purchases';
import { inventoryService } from './inventoryService';
import { stockMovementService } from './stockMovementService';

// Seed Purchase Orders
let purchaseOrdersDatabase: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2026-0422',
    date: '2026-10-02T10:00:00Z',
    expectedDate: '2026-10-07T18:00:00Z',
    supplierId: 'sup-001',
    supplierName: 'Greenply Industries Ltd',
    supplierGstin: '19AAACG1000G1Z1',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    items: [
      {
        id: 'pol-1',
        itemId: 'item-wd-0001',
        name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
        sku: 'WD-VEN-GUR-0001',
        hsnCode: '440711',
        quantityOrdered: 100,
        quantityReceived: 100,
        unit: 'sheets',
        rate: 2150,
        gstRate: 18,
        lineTaxable: 215000,
        taxAmount: 38700,
        lineTotal: 253700,
      },
    ],
    subtotalTaxable: 215000,
    totalTax: 38700,
    grandTotal: 253700,
    status: 'received',
    paymentTerms: '45 Days Net',
    notes: 'Direct mill shipment for marine grade batch',
    createdBy: 'Priya Patel',
  },
  {
    id: 'po-002',
    poNumber: 'PO-2026-0423',
    date: '2026-10-06T14:30:00Z',
    expectedDate: '2026-10-12T18:00:00Z',
    supplierId: 'sup-002',
    supplierName: 'Tata Steel Long Products Ltd',
    supplierGstin: '20AAACT1002T1Z3',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    items: [
      {
        id: 'pol-2',
        itemId: 'item-mt-0001',
        name: 'Tata Tiscon TMT Fe550D - 12mm Dia (12m)',
        sku: 'MT-STR-TAT-0001',
        hsnCode: '721420',
        quantityOrdered: 200,
        quantityReceived: 0,
        unit: 'bundles',
        rate: 3450,
        gstRate: 18,
        lineTaxable: 690000,
        taxAmount: 124200,
        lineTotal: 814200,
      },
    ],
    subtotalTaxable: 690000,
    totalTax: 124200,
    grandTotal: 814200,
    status: 'approved',
    paymentTerms: '30 Days Net',
    notes: 'Trailer consignment scheduled via Jamshedpur depot',
    createdBy: 'Rajesh Sharma',
  },
];

// Seed Goods Received Notes (GRN)
let grnDatabase: GoodsReceivedNote[] = [
  {
    id: 'grn-001',
    grnNumber: 'GRN-2026-0089',
    poId: 'po-001',
    poNumber: 'PO-2026-0422',
    supplierId: 'sup-001',
    supplierName: 'Greenply Industries Ltd',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    receivedDate: '2026-10-06T15:20:00Z',
    supplierInvoiceNumber: 'GP-INV-2026-904',
    supplierInvoiceDate: '2026-10-03',
    vehicleNumber: 'MH-04-AB-1928',
    transporterName: 'V-Trans Express',
    ewayBillNumber: '281940291048',
    items: [
      {
        itemId: 'item-wd-0001',
        name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
        sku: 'WD-VEN-GUR-0001',
        quantityReceived: 100,
        acceptedQty: 100,
        rejectedQty: 0,
        unit: 'sheets',
        inspectionNotes: 'All 100 sheets moisture certified (under 10%) with zero core gaps',
      },
    ],
    status: 'accepted',
    receivedBy: 'Suresh Patil',
    remarks: 'Unloaded at Bay BHW-A02-S1 without damage',
  },
];

// Seed Supplier Bills
let supplierBillsDatabase: SupplierBill[] = [
  {
    id: 'sb-001',
    billNumber: 'SB-2026-0182',
    supplierId: 'sup-001',
    supplierName: 'Greenply Industries Ltd',
    supplierGstin: '19AAACG1000G1Z1',
    poNumber: 'PO-2026-0422',
    grnNumber: 'GRN-2026-0089',
    billDate: '2026-10-06T16:00:00Z',
    dueDate: '2026-11-20T16:00:00Z',
    taxableAmount: 215000,
    taxAmount: 38700,
    totalAmount: 253700,
    amountPaid: 0,
    balanceDue: 253700,
    status: 'unpaid',
  },
];

// Seed Inter-Hub Transfers
let transfersDatabase: InterHubTransfer[] = [
  {
    id: 'tr-001',
    transferNumber: 'TR-2026-031',
    date: '2026-10-03T11:15:00Z',
    fromWarehouseId: 'wh-001',
    fromWarehouseName: 'Bhiwandi Central Hub (MH)',
    toWarehouseId: 'wh-002',
    toWarehouseName: 'Panvel Logistics Depot (MH)',
    vehicleNumber: 'MH-04-GP-8842',
    driverName: 'Ramesh Yadav',
    driverPhone: '+91 98200 44912',
    items: [
      {
        itemId: 'item-wd-0001',
        name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
        sku: 'WD-VEN-GUR-0001',
        quantity: 25,
        unit: 'sheets',
      },
    ],
    status: 'received',
    dispatchedAt: '2026-10-03T11:45:00Z',
    receivedAt: '2026-10-03T16:30:00Z',
    notes: 'Replenishing coastal project buffer stock',
    createdBy: 'Priya Patel',
  },
  {
    id: 'tr-002',
    transferNumber: 'TR-2026-032',
    date: '2026-10-07T09:00:00Z',
    fromWarehouseId: 'wh-001',
    fromWarehouseName: 'Bhiwandi Central Hub (MH)',
    toWarehouseId: 'wh-004',
    toWarehouseName: 'Peenya Hub (KA)',
    vehicleNumber: 'KA-01-MJ-9912',
    driverName: 'Manjunath Swamy',
    driverPhone: '+91 98450 11982',
    items: [
      {
        itemId: 'item-wd-0002',
        name: 'Commercial MR Grade Plywood - 19mm (8x4 ft)',
        sku: 'WD-PLY-COM-0002',
        quantity: 60,
        unit: 'sheets',
      },
    ],
    status: 'in_transit',
    dispatchedAt: '2026-10-07T09:30:00Z',
    notes: 'Express consignment via NH48 Golden Quadrilateral corridor',
    createdBy: 'Rajesh Sharma',
  },
];

// Seed Quotations
let quotationsDatabase: SalesQuotation[] = [
  {
    id: 'qt-001',
    quotationNumber: 'QT-2026-0012',
    date: '2026-10-06T10:00:00Z',
    validUntil: '2026-10-20T18:00:00Z',
    customerId: 'cust-0001',
    customerName: 'Rajdhani Timber & Plywood Mart',
    customerGstin: '27AAACR1000R1Z1',
    subtotal: 180000,
    taxAmount: 32400,
    grandTotal: 212400,
    status: 'accepted',
    itemsCount: 3,
  },
  {
    id: 'qt-002',
    quotationNumber: 'QT-2026-0013',
    date: '2026-10-08T15:30:00Z',
    validUntil: '2026-10-22T18:00:00Z',
    customerId: 'cust-0003',
    customerName: 'Shree Ram Hardware & Building Solutions',
    customerGstin: '29AAACS1002S1Z3',
    subtotal: 95000,
    taxAmount: 17100,
    grandTotal: 112100,
    status: 'sent',
    itemsCount: 2,
  },
];

// Seed Sales Orders
let salesOrdersDatabase: SalesOrder[] = [
  {
    id: 'so-001',
    orderNumber: 'SO-2026-4401',
    date: '2026-10-08T09:30:00Z',
    customerId: 'cust-0001',
    customerName: 'Rajdhani Timber & Plywood Mart',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    grandTotal: 144550,
    itemsCount: 1,
    status: 'completed',
    paymentStatus: 'paid',
    invoiceNumber: 'INV-2026-27-00038',
  },
  {
    id: 'so-002',
    orderNumber: 'SO-2026-4402',
    date: '2026-10-08T16:00:00Z',
    customerId: 'cust-0004',
    customerName: 'Balaji Commercial Infrastructure Ltd',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    grandTotal: 345000,
    itemsCount: 4,
    status: 'processing',
    paymentStatus: 'credit',
  },
];

// Seed Sales Returns
let salesReturnsDatabase: SalesReturn[] = [
  {
    id: 'crn-001',
    returnNumber: 'CRN-2026-014',
    date: '2026-09-29T14:00:00Z',
    invoiceNumber: 'INV-2026-27-00032',
    customerId: 'cust-0003',
    customerName: 'Shree Ram Hardware & Building Solutions',
    reason: 'Surface scuff during transport unloading',
    itemsCount: 5,
    creditAmount: 12250,
    status: 'approved',
  },
];

export const purchaseService = {
  // PO Methods
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...purchaseOrdersDatabase];
  },

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> {
    await new Promise((res) => setTimeout(res, 60));
    const nextNum = purchaseOrdersDatabase.length + 424;
    const created: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${String(nextNum).padStart(4, '0')}`,
    };
    purchaseOrdersDatabase.unshift(created);
    return created;
  },

  // GRN Methods
  async getGRNs(): Promise<GoodsReceivedNote[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...grnDatabase];
  },

  async createGRN(grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>): Promise<GoodsReceivedNote> {
    await new Promise((res) => setTimeout(res, 70));
    const nextNum = grnDatabase.length + 90;
    const created: GoodsReceivedNote = {
      ...grn,
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${String(nextNum).padStart(4, '0')}`,
    };
    grnDatabase.unshift(created);

    // Increase stock for each accepted item and log movement
    for (const item of created.items) {
      if (item.acceptedQty > 0) {
        try {
          await inventoryService.updateStock(
            item.itemId,
            item.acceptedQty,
            `Inward receipt from ${created.supplierName} (${created.grnNumber})`,
            created.receivedBy
          );
        } catch {
          // Pass
        }
      }
    }

    return created;
  },

  // Supplier Bills
  async getSupplierBills(): Promise<SupplierBill[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...supplierBillsDatabase];
  },

  async paySupplierBill(id: string, amount: number): Promise<SupplierBill> {
    await new Promise((res) => setTimeout(res, 50));
    const bill = supplierBillsDatabase.find((b) => b.id === id);
    if (!bill) throw new Error('Supplier bill not found');
    bill.amountPaid += amount;
    bill.balanceDue = Math.max(0, bill.totalAmount - bill.amountPaid);
    bill.status = bill.balanceDue === 0 ? 'paid' : 'partially_paid';
    return bill;
  },

  // Inter-Hub Transfers
  async getTransfers(): Promise<InterHubTransfer[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...transfersDatabase];
  },

  async createTransfer(tr: Omit<InterHubTransfer, 'id' | 'transferNumber'>): Promise<InterHubTransfer> {
    await new Promise((res) => setTimeout(res, 60));
    const nextNum = transfersDatabase.length + 33;
    const created: InterHubTransfer = {
      ...tr,
      id: `tr-${Date.now()}`,
      transferNumber: `TR-2026-${String(nextNum).padStart(3, '0')}`,
    };
    transfersDatabase.unshift(created);
    return created;
  },

  // Quotations
  async getQuotations(): Promise<SalesQuotation[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...quotationsDatabase];
  },

  // Sales Orders
  async getSalesOrders(): Promise<SalesOrder[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...salesOrdersDatabase];
  },

  // Sales Returns
  async getReturns(): Promise<SalesReturn[]> {
    await new Promise((res) => setTimeout(res, 40));
    return [...salesReturnsDatabase];
  },
};
