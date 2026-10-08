import { Invoice, InvoiceStatus, InvoiceLineItem } from '../types/sales';
import { calculateGSTBreakup, toPaise, toINR } from '../utils/gstUtils';
import { inventoryService } from './inventoryService';
import { stockMovementService } from './stockMovementService';

// Default Supplier / Origin: Bhiwandi Central Hub, Maharashtra (State Code 27)
export const COMPANY_GSTIN = '27AAACS1429B1Z4';
export const COMPANY_NAME = 'StockVista Wholesale Distribution LLP';
export const COMPANY_ADDRESS = 'Survey No. 48/2, Mumbai-Nashik Highway, Bhiwandi, Thane, Maharashtra - 421302';
export const COMPANY_BANK = {
  bankName: 'HDFC Bank Ltd',
  accountNumber: '50200084920194',
  ifscCode: 'HDFC0001248',
  branch: 'Bhiwandi Commercial Branch',
  upiId: 'stockvista@hdfcbank',
};

let invoiceCounter = 40;

// Seed invoices
let invoicesDatabase: Invoice[] = [
  {
    id: 'inv-00038',
    invoiceNumber: 'INV-2026-27-00038',
    date: '2026-10-07T11:30:00Z',
    dueDate: '2026-10-22T11:30:00Z',
    status: 'paid',
    customerId: 'cust-0001',
    customerName: 'Rajdhani Timber & Plywood Mart',
    customerGstin: '27AAACR1000R1Z1',
    billingAddress: 'Plot No. 40, Wholesale Timber Market, Ring Road, Mumbai, Maharashtra',
    shippingAddress: 'Warehouse Gate 1, Logistics Park, Mumbai, Maharashtra',
    placeOfSupplyStateCode: '27',
    placeOfSupplyStateName: 'Maharashtra',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    items: [
      {
        id: 'line-1',
        itemId: 'item-wd-0001',
        name: 'Gurjan BWP Marine Veneers & Laminates - 18mm (8x4 ft)',
        sku: 'WD-VEN-GUR-0001',
        hsnCode: '440711',
        quantity: 50,
        unit: 'sheets',
        rate: 2450,
        discountPercent: 0,
        gstRate: 18,
        lineTaxableAmount: 122500,
        cgstAmount: 11025,
        sgstAmount: 11025,
        igstAmount: 0,
        totalTax: 22050,
        lineTotal: 144550,
      },
    ],
    subtotalTaxable: 122500,
    totalDiscount: 0,
    isInterState: false,
    cgstTotal: 11025,
    sgstTotal: 11025,
    igstTotal: 0,
    totalTax: 22050,
    roundOff: 0,
    grandTotal: 144550,
    amountPaid: 144550,
    balanceDue: 0,
    paymentMode: 'Bank Transfer (RTGS)',
    irnNumber: '5f9b4c3e8a1d720b6f4e19a8c3d7b5f2a1e4c8d9e2b7a4c1f8d3e9a7c2b5f1a4',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-2026-27-00038',
    ewayBillNumber: '281940291048',
    notes: 'Advance cleared against PO # RT-2026-904',
    createdBy: 'Amit Verma',
  },
  {
    id: 'inv-00039',
    invoiceNumber: 'INV-2026-27-00039',
    date: '2026-10-08T14:15:00Z',
    dueDate: '2026-11-07T14:15:00Z',
    status: 'sent',
    customerId: 'cust-0002',
    customerName: 'Royal Interiors & Furnishings Pvt Ltd',
    customerGstin: '24AAACS1001S1Z2',
    billingAddress: 'Plot No. 41, Wholesale Timber Market, Ring Road, Ahmedabad, Gujarat',
    shippingAddress: 'Warehouse Gate 2, Logistics Park, Ahmedabad, Gujarat',
    placeOfSupplyStateCode: '24',
    placeOfSupplyStateName: 'Gujarat',
    warehouseId: 'wh-001',
    warehouseName: 'Bhiwandi Central Hub (MH)',
    items: [
      {
        id: 'line-2',
        itemId: 'item-wd-0002',
        name: 'Commercial MR Grade Plywood - 19mm (8x4 ft)',
        sku: 'WD-PLY-COM-0002',
        hsnCode: '441233',
        quantity: 100,
        unit: 'sheets',
        rate: 1850,
        discountPercent: 5,
        gstRate: 18,
        lineTaxableAmount: 175750,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 31635,
        totalTax: 31635,
        lineTotal: 207385,
      },
    ],
    subtotalTaxable: 175750,
    totalDiscount: 9250,
    isInterState: true,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 31635,
    totalTax: 31635,
    roundOff: 0,
    grandTotal: 207385,
    amountPaid: 50000,
    balanceDue: 157385,
    paymentMode: 'Credit (30 Days)',
    irnNumber: '7a2e8c1b4d9f305e6b7a2c8d4f1e9a3b5c7d2e8f1a4b9c6d3e7f2a1b5c8d4e9f',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV-2026-27-00039',
    notes: 'Interstate shipment via V-Trans Logistics',
    createdBy: 'Priya Patel',
  },
];

export const invoiceService = {
  async getInvoices(filters?: { status?: InvoiceStatus; search?: string }): Promise<Invoice[]> {
    await new Promise((res) => setTimeout(res, 50));
    let list = [...invoicesDatabase];

    if (filters?.status) {
      list = list.filter((inv) => inv.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerGstin.toLowerCase().includes(q) ||
          (inv.irnNumber && inv.irnNumber.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    await new Promise((res) => setTimeout(res, 40));
    const inv = invoicesDatabase.find((i) => i.id === id || i.invoiceNumber === id);
    return inv ? { ...inv } : null;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const nextNum = invoiceCounter + 1;
    return `INV-2026-27-${String(nextNum).padStart(5, '0')}`;
  },

  async createInvoice(invoiceData: {
    customerId: string;
    customerName: string;
    customerGstin: string;
    billingAddress: string;
    shippingAddress: string;
    placeOfSupplyStateCode: string;
    placeOfSupplyStateName: string;
    warehouseId: string;
    warehouseName: string;
    date: string;
    dueDate: string;
    paymentMode?: string;
    amountPaid?: number;
    notes?: string;
    status?: InvoiceStatus;
    createdBy: string;
    items: {
      itemId: string;
      name: string;
      sku: string;
      hsnCode: string;
      quantity: number;
      unit: string;
      rate: number;
      discountPercent: number;
      gstRate: number;
    }[];
  }): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 80));

    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('Invoice must contain at least one line item.');
    }

    invoiceCounter += 1;
    const invoiceNumber = `INV-2026-27-${String(invoiceCounter).padStart(5, '0')}`;
    const id = `inv-${String(invoiceCounter).padStart(5, '0')}`;

    const supplierStateCode = '27'; // Maharashtra
    const customerStateCode = invoiceData.placeOfSupplyStateCode;
    const isInterState = supplierStateCode !== customerStateCode;

    let subtotalTaxablePaise = 0;
    let totalDiscountPaise = 0;
    let cgstTotalPaise = 0;
    let sgstTotalPaise = 0;
    let igstTotalPaise = 0;

    const lineItems: InvoiceLineItem[] = [];

    for (const item of invoiceData.items) {
      if (item.quantity <= 0) {
        throw new Error(`Quantity for "${item.name}" must be greater than zero.`);
      }

      const grossPaise = toPaise(item.quantity * item.rate);
      const discountPaise = Math.round((grossPaise * item.discountPercent) / 100);
      const taxablePaise = grossPaise - discountPaise;
      const taxableINR = toINR(taxablePaise);

      totalDiscountPaise += discountPaise;
      subtotalTaxablePaise += taxablePaise;

      let lineCgst = 0;
      let lineSgst = 0;
      let lineIgst = 0;

      if (isInterState) {
        const igstPaise = Math.round((taxablePaise * item.gstRate) / 100);
        lineIgst = toINR(igstPaise);
        igstTotalPaise += igstPaise;
      } else {
        const halfRate = item.gstRate / 2;
        const cgstPaise = Math.round((taxablePaise * halfRate) / 100);
        const sgstPaise = Math.round((taxablePaise * halfRate) / 100);
        lineCgst = toINR(cgstPaise);
        lineSgst = toINR(sgstPaise);
        cgstTotalPaise += cgstPaise;
        sgstTotalPaise += sgstPaise;
      }

      const lineTotalTax = isInterState ? lineIgst : lineCgst + lineSgst;
      const lineTotal = taxableINR + lineTotalTax;

      lineItems.push({
        id: `line-${Date.now()}-${item.itemId}`,
        itemId: item.itemId,
        name: item.name,
        sku: item.sku,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        gstRate: item.gstRate,
        lineTaxableAmount: taxableINR,
        cgstAmount: lineCgst,
        sgstAmount: lineSgst,
        igstAmount: lineIgst,
        totalTax: lineTotalTax,
        lineTotal,
      });

      // Deduct warehouse stock & record movement if not a draft
      if (invoiceData.status !== 'draft') {
        try {
          await inventoryService.updateStock(
            item.itemId,
            -item.quantity,
            `Billed on ${invoiceNumber} to ${invoiceData.customerName}`,
            invoiceData.createdBy
          );
        } catch {
          // Fallback if custom item id
        }
      }
    }

    const subtotalTaxable = toINR(subtotalTaxablePaise);
    const totalDiscount = toINR(totalDiscountPaise);
    const cgstTotal = toINR(cgstTotalPaise);
    const sgstTotal = toINR(sgstTotalPaise);
    const igstTotal = toINR(igstTotalPaise);
    const totalTax = isInterState ? igstTotal : cgstTotal + sgstTotal;

    const rawGrandTotal = subtotalTaxable + totalTax;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    const amountPaid = invoiceData.amountPaid || 0;
    const balanceDue = roundedGrandTotal - amountPaid;

    const initialStatus: InvoiceStatus =
      invoiceData.status || (amountPaid >= roundedGrandTotal ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'sent');

    const created: Invoice = {
      id,
      invoiceNumber,
      date: invoiceData.date,
      dueDate: invoiceData.dueDate,
      status: initialStatus,
      customerId: invoiceData.customerId,
      customerName: invoiceData.customerName,
      customerGstin: invoiceData.customerGstin,
      billingAddress: invoiceData.billingAddress,
      shippingAddress: invoiceData.shippingAddress,
      placeOfSupplyStateCode: invoiceData.placeOfSupplyStateCode,
      placeOfSupplyStateName: invoiceData.placeOfSupplyStateName,
      warehouseId: invoiceData.warehouseId,
      warehouseName: invoiceData.warehouseName,
      items: lineItems,
      subtotalTaxable,
      totalDiscount,
      isInterState,
      cgstTotal,
      sgstTotal,
      igstTotal,
      totalTax,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountPaid,
      balanceDue,
      paymentMode: invoiceData.paymentMode || 'Credit (30 Days)',
      notes: invoiceData.notes,
      createdBy: invoiceData.createdBy,
    };

    invoicesDatabase.unshift(created);
    return created;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 40));
    const inv = invoicesDatabase.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = status;
    return inv;
  },

  async generateEInvoice(id: string): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 80));
    const inv = invoicesDatabase.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    if (!inv.customerGstin || inv.customerGstin.length !== 15) {
      throw new Error('Valid 15-character B2B GSTIN is mandatory for E-Invoice IRN generation.');
    }

    // 64-character hash mock IRN
    const hex = '0123456789abcdef';
    let irn = '';
    for (let i = 0; i < 64; i++) {
      irn += hex[Math.floor(Math.random() * hex.length)];
    }

    inv.irnNumber = irn;
    inv.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      `IRN:${irn}|GSTIN:${inv.customerGstin}|TOTAL:${inv.grandTotal}`
    )}`;

    return inv;
  },

  async generateEWayBill(
    id: string,
    vehicleNo: string,
    distanceKm: number
  ): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 80));
    const inv = invoicesDatabase.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    // 12-digit mock E-Way Bill Number
    const eway = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    inv.ewayBillNumber = eway;
    return inv;
  },
};
