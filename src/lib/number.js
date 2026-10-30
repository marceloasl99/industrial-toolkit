/* Number formatting helpers shared by every tool. */
const sig = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 });
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatNumber(n, digits) {
  if (!Number.isFinite(n)) return '—';
  if (digits !== undefined) return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(n);
  return sig.format(n);
}

export function formatMoney(n) {
  return Number.isFinite(n) ? money.format(n) : '—';
}

/** Parse a numeric input; returns NaN for empty or invalid strings. */
export function num(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  return Number(String(value).trim().replace(',', '.'));
}

export function round(n, places = 6) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
