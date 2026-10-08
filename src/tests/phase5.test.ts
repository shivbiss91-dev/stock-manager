import { describe, it, expect } from 'vitest';
import { validateGSTIN, getStateCodeFromGSTIN, calculateGSTBreakup } from '../utils/gstUtils';
import { numberToWordsINR } from '../utils/numberToWords';
import { customerService } from '../services/customerService';
import { invoiceService } from '../services/invoiceService';
import { inventoryService } from '../services/inventoryService';

describe('Phase 5: GST Billing Engine, Calculations & Invoice Generator', () => {
  it('1. Validates standard 15-character Indian GSTIN format', () => {
    // Valid GSTINs
    expect(validateGSTIN('27AAACS1429B1Z4')).toBe(true);
    expect(validateGSTIN('24AAACR1000R1Z1')).toBe(true);
    expect(validateGSTIN('29AAACB1002B1Z3')).toBe(true);

    // Invalid GSTINs
    expect(validateGSTIN('')).toBe(false);
    expect(validateGSTIN('12345')).toBe(false);
    expect(validateGSTIN('27AAACS1429B1Z')).toBe(false); // 14 chars
    expect(validateGSTIN('27AAACS1429B1Z49')).toBe(false); // 16 chars
    expect(validateGSTIN('XXAAACS1429B1Z4')).toBe(false); // Non-numeric state code
  });

  it('2. Extracts state code accurately from GSTIN', () => {
    expect(getStateCodeFromGSTIN('27AAACS1429B1Z4')).toBe('27');
    expect(getStateCodeFromGSTIN('24AAACR1000R1Z1')).toBe('24');
    expect(getStateCodeFromGSTIN('07AAACD1003D1Z2')).toBe('07');
  });

  it('3. Computes intra-state (CGST + SGST) vs inter-state (IGST) in integer paise', () => {
    // Intra-state: 27 (MH) to 27 (MH)
    const intra = calculateGSTBreakup(100000, 18, '27', '27');
    expect(intra.isInterState).toBe(false);
    expect(intra.cgstRate).toBe(9);
    expect(intra.sgstRate).toBe(9);
    expect(intra.igstRate).toBe(0);
    expect(intra.cgstAmount).toBe(9000);
    expect(intra.sgstAmount).toBe(9000);
    expect(intra.igstAmount).toBe(0);
    expect(intra.totalTax).toBe(18000);
    expect(intra.grandTotal).toBe(118000);

    // Inter-state: 27 (MH) to 24 (Gujarat)
    const inter = calculateGSTBreakup(100000, 18, '27', '24');
    expect(inter.isInterState).toBe(true);
    expect(inter.cgstAmount).toBe(0);
    expect(inter.sgstAmount).toBe(0);
    expect(inter.igstAmount).toBe(18000);
    expect(inter.totalTax).toBe(18000);
    expect(inter.grandTotal).toBe(118000);
  });

  it('4. Converts numeric INR currency to words in the Indian numbering system', () => {
    const words1 = numberToWordsINR(144550);
    expect(words1.toLowerCase()).toContain('one lakh');
    expect(words1.toLowerCase()).toContain('forty four thousand');
    expect(words1.toLowerCase()).toContain('five hundred fifty');

    const words2 = numberToWordsINR(2500000);
    expect(words2.toLowerCase()).toContain('twenty five lakh');

    const words3 = numberToWordsINR(12345678);
    expect(words3.toLowerCase()).toContain('one crore');
  });

  it('5. Searches customer repository by name, phone, and GSTIN', async () => {
    const all = await customerService.getCustomers();
    expect(all.length).toBeGreaterThan(100);

    const byName = await customerService.getCustomers('Rajdhani');
    expect(byName.length).toBeGreaterThan(0);
    expect(byName[0].companyName.toLowerCase()).toContain('rajdhani');

    const byGstin = await customerService.getCustomers('27AAAC');
    expect(byGstin.length).toBeGreaterThan(0);
  });

  it('6. Enrolls a new customer with valid GSTIN and rejects invalid GSTIN', async () => {
    // Valid creation
    const created = await customerService.createCustomer({
      name: 'Test Industrial Hardware',
      companyName: 'Test Industrial Hardware Pvt Ltd',
      gstin: '27AAACT9999T1Z5',
      stateCode: '27',
      state: 'Maharashtra',
      city: 'Thane',
      billingAddress: 'Gala 14, MIDC Industrial Area, Thane West',
      shippingAddress: 'Gala 14, MIDC Industrial Area, Thane West',
      pincode: '400604',
      contactPerson: 'Sunil Shah',
      phone: '+91 98200 88888',
      email: 'accounts@testindustrial.in',
      creditLimitINR: 3000000,
      paymentTermsDays: 30,
      tier: 'Wholesale Standard',
    });

    expect(created.id).toBeTruthy();
    expect(created.gstin).toBe('27AAACT9999T1Z5');

    // Invalid GSTIN must reject
    await expect(
      customerService.createCustomer({
        name: 'Invalid Corp',
        companyName: 'Invalid Corp',
        gstin: 'INVALID_GSTIN_123',
        stateCode: '27',
        state: 'Maharashtra',
        city: 'Thane',
        billingAddress: 'Street 1',
        shippingAddress: 'Street 1',
        pincode: '400604',
        contactPerson: 'Tester',
        phone: '+91 99999 99999',
        email: 'test@invalid.in',
        creditLimitINR: 1000000,
        paymentTermsDays: 30,
        tier: 'Retail Partner',
      })
    ).rejects.toThrow(/Invalid GSTIN/);
  });

  it('7. Generates complete GST Tax Invoice with stock deductions and exact totals', async () => {
    const item = await inventoryService.getItemById('item-wd-0001');
    expect(item).not.toBeNull();
    const initialStock = item!.currentStock;

    const invoice = await invoiceService.createInvoice({
      customerId: 'cust-0001',
      customerName: 'Rajdhani Timber & Plywood Mart',
      customerGstin: '27AAACR1000R1Z1',
      billingAddress: 'Plot 40, Mumbai',
      shippingAddress: 'Plot 40, Mumbai',
      placeOfSupplyStateCode: '27', // Maharashtra (intra-state)
      placeOfSupplyStateName: 'Maharashtra',
      warehouseId: 'wh-001',
      warehouseName: 'Bhiwandi Central Hub (MH)',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      paymentMode: 'Bank Transfer (RTGS)',
      createdBy: 'Billing Officer',
      status: 'sent',
      items: [
        {
          itemId: item!.id,
          name: item!.name,
          sku: item!.sku,
          hsnCode: item!.hsnCode,
          quantity: 10,
          unit: item!.unit,
          rate: 2000,
          discountPercent: 5, // 5% discount
          gstRate: 18,
        },
      ],
    });

    expect(invoice.invoiceNumber).toMatch(/^INV-2026-27-\d{5}$/);
    expect(invoice.items.length).toBe(1);

    // Rate = 2000, Qty = 10, Gross = 20,000, Disc 5% = 1,000, Taxable = 19,000
    expect(invoice.subtotalTaxable).toBe(19000);
    expect(invoice.totalDiscount).toBe(1000);

    // Intra-state 18%: 9% CGST (1,710) + 9% SGST (1,710) = Total Tax 3,420
    expect(invoice.isInterState).toBe(false);
    expect(invoice.cgstTotal).toBe(1710);
    expect(invoice.sgstTotal).toBe(1710);
    expect(invoice.igstTotal).toBe(0);
    expect(invoice.totalTax).toBe(3420);

    // Grand total = 19,000 + 3,420 = 22,420
    expect(invoice.grandTotal).toBe(22420);

    // Verify warehouse inventory deduction
    const updatedItem = await inventoryService.getItemById('item-wd-0001');
    expect(updatedItem!.currentStock).toBe(initialStock - 10);
  });

  it('8. Generates mock 64-character E-Invoice IRN and E-Way Bill transit numbers', async () => {
    const list = await invoiceService.getInvoices();
    expect(list.length).toBeGreaterThan(0);
    const target = list[0];

    const withIrn = await invoiceService.generateEInvoice(target.id);
    expect(withIrn.irnNumber).toBeTruthy();
    expect(withIrn.irnNumber!.length).toBe(64);
    expect(withIrn.qrCodeUrl).toContain('create-qr-code');

    const withEWay = await invoiceService.generateEWayBill(target.id, 'MH04GP8842', 210);
    expect(withEWay.ewayBillNumber).toBeTruthy();
    expect(withEWay.ewayBillNumber!.length).toBe(12);
  });
});
