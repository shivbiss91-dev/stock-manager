import { describe, it, expect } from 'vitest';
import { formatINR, formatNumberIndian } from '../utils/formatINR';
import { numberToWordsINR } from '../utils/numberToWords';
import { validateGSTIN, calculateGSTBreakup, getStateCodeFromGSTIN } from '../utils/gstUtils';
import { formatDate, getFinancialYear, generateInvoiceNumber } from '../utils/dateUtils';
import { ROLE_PERMISSIONS } from '../types/auth';

describe('Localisation: formatINR', () => {
  it('formats Indian numbering with commas correctly', () => {
    expect(formatINR(1234567.89)).toBe('₹12,34,567.89');
    expect(formatINR(49371)).toBe('₹49,371.00');
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(10000000)).toBe('₹1,00,00,000.00');
  });

  it('formats compact representations correctly', () => {
    expect(formatINR(12500000, { compact: true })).toBe('₹1.25 Cr');
    expect(formatINR(450000, { compact: true })).toBe('₹4.50 L');
    expect(formatINR(25000, { compact: true })).toBe('₹25.0 K');
  });

  it('handles numbers without currency symbol', () => {
    expect(formatNumberIndian(148250)).toBe('1,48,250');
  });
});

describe('Localisation: numberToWordsINR', () => {
  it('converts amounts into Indian system words with Rupees and Paise', () => {
    const result = numberToWordsINR(49371.2);
    expect(result).toBe('Forty Nine Thousand Three Hundred Seventy One Rupees and Twenty Paise Only');

    const result2 = numberToWordsINR(1000000);
    expect(result2).toBe('Ten Lakh Rupees Only');

    const result3 = numberToWordsINR(0);
    expect(result3).toBe('Zero Rupees Only');
  });
});

describe('GST & Tax Utilities', () => {
  it('validates 15-character Indian GSTIN correctly', () => {
    // Valid Maharashtra GSTIN
    expect(validateGSTIN('27AABCU9603R1ZM')).toBe(true);
    // Valid Delhi GSTIN
    expect(validateGSTIN('07AAAAA0000A1Z5')).toBe(true);
    // Invalid length or structure
    expect(validateGSTIN('12345')).toBe(false);
    expect(validateGSTIN('27AABCU9603R1')).toBe(false);
    expect(validateGSTIN('')).toBe(false);
  });

  it('extracts state code from GSTIN', () => {
    expect(getStateCodeFromGSTIN('27AABCU9603R1ZM')).toBe('27');
    expect(getStateCodeFromGSTIN('07AAAAA0000A1Z5')).toBe('07');
  });

  it('calculates intra-state CGST and SGST using integer paise', () => {
    // Intra-state (both 27 Maharashtra): 18% splits to 9% CGST + 9% SGST
    const breakup = calculateGSTBreakup(10000, 18, '27', '27');
    expect(breakup.isInterState).toBe(false);
    expect(breakup.cgstRate).toBe(9);
    expect(breakup.sgstRate).toBe(9);
    expect(breakup.cgstAmount).toBe(900);
    expect(breakup.sgstAmount).toBe(900);
    expect(breakup.igstAmount).toBe(0);
    expect(breakup.totalTax).toBe(1800);
    expect(breakup.grandTotal).toBe(11800);
  });

  it('calculates inter-state IGST correctly', () => {
    // Inter-state (27 Maharashtra to 07 Delhi): full 18% IGST
    const breakup = calculateGSTBreakup(10000, 18, '27', '07');
    expect(breakup.isInterState).toBe(true);
    expect(breakup.igstRate).toBe(18);
    expect(breakup.igstAmount).toBe(1800);
    expect(breakup.cgstAmount).toBe(0);
    expect(breakup.sgstAmount).toBe(0);
    expect(breakup.totalTax).toBe(1800);
    expect(breakup.grandTotal).toBe(11800);
  });
});

describe('Date & Financial Year Utilities', () => {
  it('formats dates in Indian DD/MM/YYYY format', () => {
    const formatted = formatDate('2026-10-08T10:00:00Z');
    expect(formatted).toBe('08/10/2026');
  });

  it('computes financial year April to March', () => {
    // October 2026 -> FY 2026-27
    const octDate = new Date(2026, 9, 8);
    expect(getFinancialYear(octDate)).toBe('2026-27');

    // February 2026 -> FY 2025-26
    const febDate = new Date(2026, 1, 15);
    expect(getFinancialYear(febDate)).toBe('2025-26');
  });

  it('generates standard invoice numbers with FY', () => {
    const octDate = new Date(2026, 9, 8);
    const invNum = generateInvoiceNumber(1, octDate);
    expect(invNum).toBe('INV-2026-27-00001');
  });
});

describe('Role-Based Access Permissions', () => {
  it('ensures admin has all critical permissions', () => {
    expect(ROLE_PERMISSIONS.admin).toContain('manage_users');
    expect(ROLE_PERMISSIONS.admin).toContain('manage_backups');
    expect(ROLE_PERMISSIONS.admin).toContain('view_audit_log');
    expect(ROLE_PERMISSIONS.admin).toContain('approve_requests');
  });

  it('ensures viewer has read-only access', () => {
    expect(ROLE_PERMISSIONS.viewer).not.toContain('manage_users');
    expect(ROLE_PERMISSIONS.viewer).not.toContain('create_invoice');
    expect(ROLE_PERMISSIONS.viewer).not.toContain('edit_inventory');
    expect(ROLE_PERMISSIONS.viewer).toContain('view_dashboard');
  });
});
