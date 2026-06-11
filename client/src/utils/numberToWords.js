const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function two(value) {
  if (value < 20) return ones[value];
  return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ''}`;
}

function three(value) {
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  return `${hundreds ? `${ones[hundreds]} Hundred${remainder ? ' ' : ''}` : ''}${remainder ? two(remainder) : ''}`;
}

function integerToWords(value) {
  if (value === 0) return 'Zero';

  let remaining = value;
  let result = '';
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore) result += `${integerToWords(crore)} Crore `;
  if (lakh) result += `${two(lakh)} Lakh `;
  if (thousand) result += `${two(thousand)} Thousand `;
  if (remaining) result += three(remaining);
  return result.trim();
}

export function numberToWords(input) {
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return 'Zero Rupees Only';

  const totalPaise = Math.round(value * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const rupeeWords = `${integerToWords(rupees)} Rupee${rupees === 1 ? '' : 's'}`;
  const paiseWords = paise ? ` and ${integerToWords(paise)} Paise` : '';
  return `${rupeeWords}${paiseWords} Only`;
}
