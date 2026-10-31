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
import { StorageService, STORAGE_KEYS } from './storageService';

export const purchaseService = {
  // PO Methods
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, []);
  },

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber'>): Promise<PurchaseOrder> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, []);
    const nextNum = list.length + 1;
    const created: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${String(nextNum).padStart(4, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.PURCHASES, list);
    return created;
  },

  // GRN Methods
  async getGRNs(): Promise<GoodsReceivedNote[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<GoodsReceivedNote[]>(STORAGE_KEYS.GRN, []);
  },

  async createGRN(grn: Omit<GoodsReceivedNote, 'id' | 'grnNumber'>): Promise<GoodsReceivedNote> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<GoodsReceivedNote[]>(STORAGE_KEYS.GRN, []);
    const nextNum = list.length + 1;
    const created: GoodsReceivedNote = {
      ...grn,
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${String(nextNum).padStart(4, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.GRN, list);

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
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<SupplierBill[]>(STORAGE_KEYS.SUPPLIER_BILLS, []);
  },

  async createSupplierBill(billData: Omit<SupplierBill, 'id'>): Promise<SupplierBill> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<SupplierBill[]>(STORAGE_KEYS.SUPPLIER_BILLS, []);
    const created: SupplierBill = {
      ...billData,
      id: `sb-${Date.now()}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.SUPPLIER_BILLS, list);
    return created;
  },

  async paySupplierBill(id: string, amount: number): Promise<SupplierBill> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<SupplierBill[]>(STORAGE_KEYS.SUPPLIER_BILLS, []);
    const bill = list.find((b) => b.id === id);
    if (!bill) throw new Error('Supplier bill not found');
    bill.amountPaid += amount;
    bill.balanceDue = Math.max(0, bill.totalAmount - bill.amountPaid);
    bill.status = bill.balanceDue === 0 ? 'paid' : 'partially_paid';
    StorageService.set(STORAGE_KEYS.SUPPLIER_BILLS, list);
    return bill;
  },

  // Inter-Hub Transfers
  async getTransfers(): Promise<InterHubTransfer[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<InterHubTransfer[]>(STORAGE_KEYS.TRANSFERS, []);
  },

  async createTransfer(tr: Omit<InterHubTransfer, 'id' | 'transferNumber'>): Promise<InterHubTransfer> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<InterHubTransfer[]>(STORAGE_KEYS.TRANSFERS, []);
    const nextNum = list.length + 1;
    const created: InterHubTransfer = {
      ...tr,
      id: `tr-${Date.now()}`,
      transferNumber: `TR-2026-${String(nextNum).padStart(3, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.TRANSFERS, list);
    return created;
  },

  // Quotations
  async getQuotations(): Promise<SalesQuotation[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<SalesQuotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  },

  async createQuotation(qt: Omit<SalesQuotation, 'id' | 'quotationNumber'>): Promise<SalesQuotation> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<SalesQuotation[]>(STORAGE_KEYS.QUOTATIONS, []);
    const nextNum = list.length + 1;
    const created: SalesQuotation = {
      ...qt,
      id: `qt-${Date.now()}`,
      quotationNumber: `QT-2026-${String(nextNum).padStart(4, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.QUOTATIONS, list);
    return created;
  },

  // Sales Orders
  async getSalesOrders(): Promise<SalesOrder[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<SalesOrder[]>(STORAGE_KEYS.SALES_ORDERS, []);
  },

  async createSalesOrder(so: Omit<SalesOrder, 'id' | 'orderNumber'>): Promise<SalesOrder> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<SalesOrder[]>(STORAGE_KEYS.SALES_ORDERS, []);
    const nextNum = list.length + 1;
    const created: SalesOrder = {
      ...so,
      id: `so-${Date.now()}`,
      orderNumber: `SO-2026-${String(nextNum).padStart(4, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.SALES_ORDERS, list);
    return created;
  },

  // Sales Returns
  async getReturns(): Promise<SalesReturn[]> {
    await new Promise((res) => setTimeout(res, 20));
    return StorageService.get<SalesReturn[]>(STORAGE_KEYS.RETURNS, []);
  },

  async createReturn(ret: Omit<SalesReturn, 'id' | 'returnNumber'>): Promise<SalesReturn> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<SalesReturn[]>(STORAGE_KEYS.RETURNS, []);
    const nextNum = list.length + 1;
    const created: SalesReturn = {
      ...ret,
      id: `crn-${Date.now()}`,
      returnNumber: `CRN-2026-${String(nextNum).padStart(3, '0')}`,
    };
    list.unshift(created);
    StorageService.set(STORAGE_KEYS.RETURNS, list);
    return created;
  },

  _seedSupplierBillsForTesting(bills: SupplierBill[]): void {
    StorageService.set(STORAGE_KEYS.SUPPLIER_BILLS, bills);
  },
  _seedPurchasesForTesting(pos: PurchaseOrder[]): void {
    StorageService.set(STORAGE_KEYS.PURCHASES, pos);
  },
  _seedGRNsForTesting(grns: GoodsReceivedNote[]): void {
    StorageService.set(STORAGE_KEYS.GRN, grns);
  },
  _seedTransfersForTesting(transfers: InterHubTransfer[]): void {
    StorageService.set(STORAGE_KEYS.TRANSFERS, transfers);
  },
  _seedQuotationsForTesting(qts: SalesQuotation[]): void {
    StorageService.set(STORAGE_KEYS.QUOTATIONS, qts);
  },
  _seedSalesOrdersForTesting(orders: SalesOrder[]): void {
    StorageService.set(STORAGE_KEYS.SALES_ORDERS, orders);
  },
  _seedReturnsForTesting(returns: SalesReturn[]): void {
    StorageService.set(STORAGE_KEYS.RETURNS, returns);
  },
};
