export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type OrderProgressStatus =
  | 'completed'
  | 'in_progress'
  | 'overdue'
  | 'returned';

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  gstin: string;
  stateCode: string; // 2-digit GST state code
  state: string;
  city: string;
  billingAddress: string;
  shippingAddress: string;
  pincode: string;
  contactPerson: string;
  phone: string;
  email: string;
  creditLimitINR: number;
  outstandingBalanceINR: number;
  paymentTermsDays: number;
  tier: 'Wholesale Standard' | 'Distributor Platinum' | 'Retail Partner';
}

export interface Supplier {
  id: string;
  name: string;
  companyName: string;
  gstin: string;
  stateCode: string;
  state: string;
  city: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  leadTimeDays: number;
  rating: number;
}

export interface InvoiceLineItem {
  id: string;
  itemId: string;
  name: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;          // Exclusive of GST
  discountPercent: number;
  gstRate: number;       // e.g. 18
  lineTaxableAmount: number; // quantity * rate - discount
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-27-00001
  date: string;          // ISO
  dueDate: string;       // ISO
  status: InvoiceStatus;
  customerId: string;
  customerName: string;
  customerGstin: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupplyStateCode: string;
  placeOfSupplyStateName: string;
  warehouseId: string;
  warehouseName: string;
  items: InvoiceLineItem[];
  subtotalTaxable: number;
  totalDiscount: number;
  isInterState: boolean;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: string;
  irnNumber?: string;
  qrCodeUrl?: string;
  ewayBillNumber?: string;
  notes?: string;
  createdBy: string;
}

export interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  customerName: string;
  city: string;
  state: string;
  date: string;
  itemsCount: number;
  primaryItemName: string;
  amountINR: number;
  status: OrderProgressStatus;
}
