/**
 * Indian Rupee formatting utility
 * Formats numbers into standard Indian numbering system (Lakhs, Crores)
 * Example: 1234567.89 -> ₹12,34,567.89
 * Compact: 12500000 -> ₹1.25 Cr, 450000 -> ₹4.5 L, 25000 -> ₹25 K
 */

export interface FormatINROptions {
  compact?: boolean;
  showDecimals?: boolean;
  showSymbol?: boolean;
}

export function formatINR(
  amount: number | null | undefined,
  options: FormatINROptions = {}
): string {
  const {
    compact = false,
    showDecimals = true,
    showSymbol = true,
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const symbol = showSymbol ? '₹' : '';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact) {
    if (absAmount >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = absAmount / 10000000;
      return `${isNegative ? '-' : ''}${symbol}${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`;
    }
    if (absAmount >= 100000) {
      // 1 Lakh = 100,000
      const lakh = absAmount / 100000;
      return `${isNegative ? '-' : ''}${symbol}${lakh.toFixed(lakh >= 10 ? 1 : 2)} L`;
    }
    if (absAmount >= 1000) {
      // 1 Thousand = 1,000
      const k = absAmount / 1000;
      return `${isNegative ? '-' : ''}${symbol}${k.toFixed(1)} K`;
    }
    return `${isNegative ? '-' : ''}${symbol}${absAmount.toFixed(showDecimals ? 2 : 0)}`;
  }

  // Full Indian currency formatting with commas (last 3, then groups of 2)
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = showDecimals ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return `${isNegative ? '-' : ''}${symbol}${result}`;
}

export function formatNumberIndian(amount: number | null | undefined): string {
  return formatINR(amount, { showSymbol: false, showDecimals: false });
}
