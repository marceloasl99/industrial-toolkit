/* Platinum RTD (PT100 / PT1000) per IEC 60751 using Callendar–Van Dusen. */
const A = 3.9083e-3, B = -5.775e-7, C = -4.183e-12;

export function rtdResistance(tC, r0 = 100) {
  if (!Number.isFinite(tC)) throw new Error('Enter a temperature');
  if (tC < -200 || tC > 850) throw new Error('IEC 60751 covers −200 °C to 850 °C');
  if (tC >= 0) return r0 * (1 + A * tC + B * tC * tC);
  return r0 * (1 + A * tC + B * tC * tC + C * (tC - 100) * tC ** 3);
}

export function rtdTemperature(r, r0 = 100) {
  if (!(r > 0)) throw new Error('Resistance must be positive');
  if (r >= r0) {
    // closed-form for t >= 0
    const t = (-A + Math.sqrt(A * A - 4 * B * (1 - r / r0))) / (2 * B);
    if (t > 850) throw new Error('Above the 850 °C limit of IEC 60751');
    return t;
  }
  // bisection for the negative branch
  let lo = -200, hi = 0;
  if (r < rtdResistance(-200, r0)) throw new Error('Below the −200 °C limit of IEC 60751');
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (rtdResistance(mid, r0) < r) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Lead-wire error for 2-wire RTD: the lead resistance adds to the reading. */
export function leadWireError(leadOhmsTotal, r0 = 100) {
  return rtdTemperature(r0 + leadOhmsTotal, r0); // °C of apparent offset at 0 °C
}
