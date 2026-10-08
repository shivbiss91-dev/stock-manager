export interface IndianState {
  code: string; // 2-digit GST code
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
];

/**
 * Validates standard 15-character GSTIN format:
 * 2 digits State Code + 10 alphanumeric PAN + 1 entity code + 'Z' + 1 checksum digit
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(clean);
}

/**
 * Extract State Code from GSTIN (first 2 digits)
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

export function getStateNameByCode(code: string): string {
  const state = INDIAN_STATES.find(s => s.code === code);
  return state ? state.name : 'Unknown State';
}

/**
 * Integer paise calculation helper to avoid floating point inaccuracies
 * All calculations performed in paise (1 INR = 100 paise)
 */
export function toPaise(inr: number): number {
  return Math.round(inr * 100);
}

export function toINR(paise: number): number {
  return paise / 100;
}

export interface GSTBreakup {
  taxableAmount: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  roundOff: number;
}

export function calculateGSTBreakup(
  taxableAmount: number,
  gstRate: number, // e.g. 18 for 18%
  supplierStateCode: string = '27', // Default Maharashtra
  customerStateCode: string = '27'
): GSTBreakup {
  const taxablePaise = toPaise(taxableAmount);
  const isInterState = supplierStateCode !== customerStateCode;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  if (isInterState) {
    igstRate = gstRate;
    const igstPaise = Math.round((taxablePaise * igstRate) / 100);
    igstAmount = toINR(igstPaise);
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    const cgstPaise = Math.round((taxablePaise * cgstRate) / 100);
    const sgstPaise = Math.round((taxablePaise * sgstRate) / 100);
    cgstAmount = toINR(cgstPaise);
    sgstAmount = toINR(sgstPaise);
  }

  const totalTax = isInterState ? igstAmount : (cgstAmount + sgstAmount);
  const rawGrandTotal = taxableAmount + totalTax;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

  return {
    taxableAmount,
    isInterState,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTax,
    grandTotal: roundedGrandTotal,
    roundOff,
  };
}
