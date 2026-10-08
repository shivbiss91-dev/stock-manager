export type PurchaseOrderStatus =
  | 'draft'
  | 'approved'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  hsnCode: string;
  quantityOrdered: number;
  quantityReceived: number;
  unit: string;
  rate: number;
  gstRate: number;
  lineTaxable: number;
  taxAmount: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0422
  date: string;
  expectedDate: string;
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  warehouseId: string;
  warehouseName: string;
  items: PurchaseOrderLine[];
  subtotalTaxable: number;
  totalTax: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  paymentTerms: string;
  notes?: string;
  createdBy: string;
}

export interface GRNLineItem {
  itemId: string;
  name: string;
  sku: string;
  quantityReceived: number;
  acceptedQty: number;
  rejectedQty: number;
  unit: string;
  inspectionNotes?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string; // e.g. GRN-2026-0089
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  receivedDate: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  vehicleNumber: string;
  transporterName: string;
  ewayBillNumber?: string;
  items: GRNLineItem[];
  status: 'accepted' | 'partial' | 'rejected';
  receivedBy: string;
  remarks?: string;
}

export interface SupplierBill {
  id: string;
  billNumber: string; // e.g. SB-2026-0182
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  poNumber: string;
  grnNumber: string;
  billDate: string;
  dueDate: string;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'paid' | 'partially_paid' | 'unpaid' | 'overdue';
  paymentMode?: string;
}

export interface InterHubTransfer {
  id: string;
  transferNumber: string; // e.g. TR-2026-031
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  items: {
    itemId: string;
    name: string;
    sku: string;
    quantity: number;
    unit: string;
  }[];
  status: 'draft' | 'in_transit' | 'received' | 'cancelled';
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
  createdBy: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string; // QT-2026-0012
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerGstin: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'converted';
  itemsCount: number;
  convertedInvoiceId?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // SO-2026-4401
  date: string;
  customerId: string;
  customerName: string;
  warehouseName: string;
  grandTotal: number;
  itemsCount: number;
  status: 'pending' | 'processing' | 'dispatched' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'credit';
  invoiceNumber?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string; // CRN-2026-014
  date: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  reason: string;
  itemsCount: number;
  creditAmount: number;
  status: 'approved' | 'pending' | 'refunded';
}
