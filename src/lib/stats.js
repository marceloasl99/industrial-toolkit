/* Descriptive statistics for a list of numbers. */
export function parseNumbers(text) {
  const a = String(text).split(/[\s,;]+/).filter(Boolean).map(Number);
  if (!a.length || a.some(x => !Number.isFinite(x))) throw new Error('Enter a valid list of numbers');
  return a;
}

export function describe(a) {
  const n = a.length;
  const sorted = [...a].sort((x, y) => x - y);
  const sum = a.reduce((s, x) => s + x, 0);
  const mean = sum / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const ss = a.reduce((s, x) => s + (x - mean) ** 2, 0);
  const popVar = ss / n, sampleVar = n > 1 ? ss / (n - 1) : NaN;
  const counts = new Map(); a.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
  const maxCount = Math.max(...counts.values());
  const mode = maxCount > 1 ? [...counts].filter(([, c]) => c === maxCount).map(([v]) => v) : [];
  const q = p => { const pos = (n - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos); return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo); };
  return {
    count: n, sum, mean, median, mode, min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
    popVariance: popVar, popStdDev: Math.sqrt(popVar), sampleVariance: sampleVar, sampleStdDev: Math.sqrt(sampleVar),
    q1: q(0.25), q3: q(0.75), iqr: q(0.75) - q(0.25), cv: mean ? Math.sqrt(popVar) / Math.abs(mean) * 100 : NaN,
  };
}
