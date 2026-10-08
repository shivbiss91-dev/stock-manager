import { format, parseISO } from 'date-fns';

/**
 * Standard Indian date formatting: DD/MM/YYYY
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
}

/**
 * Standard Indian date & time formatting: DD/MM/YYYY, hh:mm a
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (isNaN(d.getTime())) return '-';
    return format(d, 'dd/MM/yyyy, hh:mm a');
  } catch {
    return '-';
  }
}

/**
 * Calculates Indian Financial Year string (e.g. "2026-27")
 * Financial year starts on April 1 and ends on March 31.
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();

  if (month >= 3) {
    // April onwards -> FY is current year to next year
    const nextYearShort = String((year + 1) % 100).padStart(2, '0');
    return `${year}-${nextYearShort}`;
  } else {
    // Jan-March -> FY is previous year to current year
    const currentYearShort = String(year % 100).padStart(2, '0');
    return `${year - 1}-${currentYearShort}`;
  }
}

/**
 * Formats standard Invoice prefix: INV-YYYY-YY-XXXXX
 */
export function generateInvoiceNumber(sequence: number, date: Date = new Date()): string {
  const fy = getFinancialYear(date);
  const padded = String(sequence).padStart(5, '0');
  return `INV-${fy}-${padded}`;
}
