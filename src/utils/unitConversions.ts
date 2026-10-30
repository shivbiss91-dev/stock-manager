/**
 * Authoritative Unit of Measurement & Packaging Conversions System
 * 
 * Strict predefined units:
 * 1. Pieces (PCS)
 * 2. Units (UNT)
 * 3. Dozens (DOZ) - 1 Dozen = 12 Pieces
 * 4. Cartons (CTN) - Configurable pieces
 * 5. Boxes (BOX) - Configurable pieces
 * 6. Bundles (BDL) - Configurable pieces
 * 
 * Removed units: KG, GM, LTR, MTR, SQFT, SQM (Never allowed in dropdowns or forms).
 */

export type PredefinedUnit = 'PCS' | 'UNT' | 'DOZ' | 'CTN' | 'BOX' | 'BDL';

export interface UnitDefinition {
  code: PredefinedUnit;
  label: string;
  shortLabel: string;
  isPackUnit: boolean;
  description: string;
}

export const PREDEFINED_UNITS: readonly UnitDefinition[] = [
  { code: 'PCS', label: 'Pieces (PCS)', shortLabel: 'PCS', isPackUnit: false, description: 'Individual piece' },
  { code: 'UNT', label: 'Units (UNT)', shortLabel: 'UNT', isPackUnit: false, description: 'Single discrete unit' },
  { code: 'DOZ', label: 'Dozens (DOZ)', shortLabel: 'DOZ', isPackUnit: true, description: 'Pack of 12' },
  { code: 'CTN', label: 'Cartons (CTN)', shortLabel: 'CTN', isPackUnit: true, description: 'Master shipping carton' },
  { code: 'BOX', label: 'Boxes (BOX)', shortLabel: 'BOX', isPackUnit: true, description: 'Inner storage box' },
  { code: 'BDL', label: 'Bundles (BDL)', shortLabel: 'BDL', isPackUnit: true, description: 'Strapped bundle pack' },
] as const;

export const PREDEFINED_UNIT_CODES: readonly PredefinedUnit[] = [
  'PCS',
  'UNT',
  'DOZ',
  'CTN',
  'BOX',
  'BDL',
] as const;

export const PREDEFINED_UNIT_OPTIONS = PREDEFINED_UNITS.map((u) => ({
  value: u.code,
  label: u.label,
}));

export interface PackagingConversions {
  baseUnit: 'PCS' | 'UNT';
  dozenMultiplier: number;  // Standard fixed at 12
  boxMultiplier: number;    // Configurable (e.g. 20)
  cartonMultiplier: number; // Configurable (e.g. 100)
  bundleMultiplier: number; // Configurable (e.g. 25)
}

export const DEFAULT_PACKAGING_CONVERSIONS: PackagingConversions = {
  baseUnit: 'PCS',
  dozenMultiplier: 12,
  boxMultiplier: 20,
  cartonMultiplier: 100,
  bundleMultiplier: 25,
};

/**
 * Normalizes any unit string to its canonical form or matching predefined unit code.
 */
export function normalizeUnitCode(unitStr?: string): PredefinedUnit {
  if (!unitStr) return 'PCS';
  const clean = unitStr.trim().toUpperCase();

  switch (clean) {
    case 'PCS':
    case 'PIECE':
    case 'PIECES':
      return 'PCS';
    case 'UNT':
    case 'UNIT':
    case 'UNITS':
      return 'UNT';
    case 'DOZ':
    case 'DOZEN':
    case 'DOZENS':
      return 'DOZ';
    case 'CTN':
    case 'CARTON':
    case 'CARTONS':
      return 'CTN';
    case 'BOX':
    case 'BOXES':
      return 'BOX';
    case 'BDL':
    case 'BUNDLE':
    case 'BUNDLES':
      return 'BDL';
    default:
      return 'PCS';
  }
}

/**
 * Checks if a unit is one of the strictly allowed 6 predefined units.
 */
export function isPredefinedUnit(unitStr: string): unitStr is PredefinedUnit {
  return PREDEFINED_UNIT_CODES.includes(unitStr as PredefinedUnit);
}

/**
 * Converts any quantity in a given unit to the product's base unit (PCS or UNT).
 */
export function convertToBaseQuantity(
  quantity: number,
  fromUnit: string,
  conversions: PackagingConversions = DEFAULT_PACKAGING_CONVERSIONS
): number {
  if (isNaN(quantity) || quantity === 0) return 0;
  const unitCode = normalizeUnitCode(fromUnit);

  switch (unitCode) {
    case 'DOZ':
      return quantity * (conversions.dozenMultiplier || 12);
    case 'BOX':
      return quantity * (conversions.boxMultiplier || 20);
    case 'CTN':
      return quantity * (conversions.cartonMultiplier || 100);
    case 'BDL':
      return quantity * (conversions.bundleMultiplier || 25);
    case 'UNT':
    case 'PCS':
    default:
      return quantity;
  }
}

/**
 * Converts a base quantity (in PCS or UNT) into a target unit.
 */
export function convertFromBaseQuantity(
  baseQuantity: number,
  toUnit: string,
  conversions: PackagingConversions = DEFAULT_PACKAGING_CONVERSIONS
): number {
  if (isNaN(baseQuantity) || baseQuantity === 0) return 0;
  const unitCode = normalizeUnitCode(toUnit);

  switch (unitCode) {
    case 'DOZ':
      return baseQuantity / (conversions.dozenMultiplier || 12);
    case 'BOX':
      return baseQuantity / (conversions.boxMultiplier || 20);
    case 'CTN':
      return baseQuantity / (conversions.cartonMultiplier || 100);
    case 'BDL':
      return baseQuantity / (conversions.bundleMultiplier || 25);
    case 'UNT':
    case 'PCS':
    default:
      return baseQuantity;
  }
}

/**
 * Returns a human-friendly packaging breakdown.
 * Example: 245 PCS with CTN=100, BOX=20 -> "2 CTN + 2 BOX + 5 PCS"
 */
export function formatPackagingBreakdown(
  baseQuantity: number,
  conversions: PackagingConversions = DEFAULT_PACKAGING_CONVERSIONS
): string {
  if (baseQuantity <= 0) return `0 ${conversions.baseUnit || 'PCS'}`;

  const ctn = conversions.cartonMultiplier || 100;
  const box = conversions.boxMultiplier || 20;
  const base = conversions.baseUnit || 'PCS';

  const cartons = Math.floor(baseQuantity / ctn);
  const remAfterCtn = baseQuantity % ctn;

  const boxes = Math.floor(remAfterCtn / box);
  const remBase = remAfterCtn % box;

  const parts: string[] = [];
  if (cartons > 0) parts.push(`${cartons} CTN`);
  if (boxes > 0) parts.push(`${boxes} BOX`);
  if (remBase > 0 || parts.length === 0) parts.push(`${remBase} ${base}`);

  return parts.join(' + ');
}
