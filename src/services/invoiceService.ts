import { Invoice, InvoiceStatus, InvoiceLineItem } from '../types/sales';
import { toPaise, toINR } from '../utils/gstUtils';
import { inventoryService } from './inventoryService';
import { StorageService, STORAGE_KEYS } from './storageService';
import { CompanySettings } from './settingsService';

export function getCompanyDetails(): {
  companyName: string;
  companyGstin: string;
  companyAddress: string;
  bank: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    upiId: string;
  };
} {
  const settings = StorageService.get<CompanySettings | null>(STORAGE_KEYS.SETTINGS, null);
  return {
    companyName: settings?.companyName || 'StockVista Wholesale Distribution',
    companyGstin: settings?.gstin || 'Unconfigured GSTIN',
    companyAddress: settings?.address
      ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`
      : 'Address not configured in Settings',
    bank: {
      bankName: settings?.bankName || 'Bank Not Configured',
      accountNumber: settings?.accountNumber || '—',
      ifscCode: settings?.ifscCode || '—',
      branch: settings?.branch || '—',
      upiId: settings?.upiId || '—',
    },
  };
}

// Export backward-compatible dynamic getters
export const COMPANY_NAME = 'StockVista Wholesale Distribution';
export const COMPANY_GSTIN = 'Unconfigured GSTIN';
export const COMPANY_ADDRESS = 'Company Address Not Configured';
export const COMPANY_BANK = {
  bankName: 'HDFC Bank Ltd',
  accountNumber: '—',
  ifscCode: '—',
  branch: '—',
  upiId: '—',
};

export const invoiceService = {
  async getInvoices(filters?: { status?: InvoiceStatus; search?: string }): Promise<Invoice[]> {
    await new Promise((res) => setTimeout(res, 30));
    let list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);

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
    await new Promise((res) => setTimeout(res, 20));
    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id || i.invoiceNumber === id);
    return inv ? { ...inv } : null;
  },

  async getNextInvoiceNumber(): Promise<string> {
    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const nextNum = list.length + 1;
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
    await new Promise((res) => setTimeout(res, 60));

    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('Invoice must contain at least one line item.');
    }

    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const invoiceNumber = `INV-2026-27-${String(list.length + 1).padStart(5, '0')}`;
    const id = `inv-${String(list.length + 1).padStart(5, '0')}`;

    const settings = StorageService.get<CompanySettings | null>(STORAGE_KEYS.SETTINGS, null);
    const supplierStateCode = settings?.stateCode || '27';
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
        } catch {}
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

    list.unshift(created);
    StorageService.set(STORAGE_KEYS.INVOICES, list);
    return created;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 30));
    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');
    inv.status = status;
    StorageService.set(STORAGE_KEYS.INVOICES, list);
    return inv;
  },

  async generateEInvoice(id: string): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    if (!inv.customerGstin || inv.customerGstin.length !== 15) {
      throw new Error('Valid 15-character B2B GSTIN is mandatory for E-Invoice IRN generation.');
    }

    const hex = '0123456789abcdef';
    let irn = '';
    for (let i = 0; i < 64; i++) {
      irn += hex[Math.floor(Math.random() * hex.length)];
    }

    inv.irnNumber = irn;
    inv.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
      `IRN:${irn}|GSTIN:${inv.customerGstin}|TOTAL:${inv.grandTotal}`
    )}`;

    StorageService.set(STORAGE_KEYS.INVOICES, list);
    return inv;
  },

  async generateEWayBill(id: string, vehicleNo: string, distanceKm: number): Promise<Invoice> {
    await new Promise((res) => setTimeout(res, 40));
    const list = StorageService.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
    const inv = list.find((i) => i.id === id);
    if (!inv) throw new Error('Invoice not found');

    const eway = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    inv.ewayBillNumber = eway;
    StorageService.set(STORAGE_KEYS.INVOICES, list);
    return inv;
  },

  _seedInvoicesForTesting(invoices: Invoice[]): void {
    StorageService.set(STORAGE_KEYS.INVOICES, invoices);
  },
};
