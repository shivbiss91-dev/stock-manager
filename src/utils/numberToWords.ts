/**
 * Convert numbers into words using the Indian numbering system (Crore, Lakh, Thousand, Hundred)
 * Handles Rupees and Paise.
 * Example: 49371.20 -> "Forty Nine Thousand Three Hundred Seventy One Rupees and Twenty Paise Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  if (n === 0) return '';
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      str += ONES[n] + ' ';
    } else {
      str += TENS[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) {
        str += ONES[n % 10] + ' ';
      }
    }
  }
  return str.trim();
}

export function numberToWordsINR(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let current = rupees;
  let words = '';

  const crores = Math.floor(current / 10000000);
  current %= 10000000;

  const lakhs = Math.floor(current / 100000);
  current %= 100000;

  const thousands = Math.floor(current / 1000);
  current %= 1000;

  const hundreds = current;

  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertBelowThousand(hundreds) + ' ';
  }

  words = words.trim();
  if (words === '') {
    words = 'Zero';
  }

  let result = words + ' Rupees';

  if (paise > 0) {
    const paiseWords = convertBelowThousand(paise);
    result += ' and ' + paiseWords + ' Paise';
  }

  return result + ' Only';
}
