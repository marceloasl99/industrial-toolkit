/* Electrical engineering helpers. */

/** Solve Ohm's law / power from any two of V, I, R, P. */
export function ohm(known) {
  const k = Object.fromEntries(Object.entries(known).filter(([, v]) => Number.isFinite(v)));
  const keys = Object.keys(k);
  if (keys.length !== 2) throw new Error('Provide exactly two known values');
  let { V, I, R, P } = k;
  if (V !== undefined && I !== undefined) { R = V / I; P = V * I; }
  else if (V !== undefined && R !== undefined) { I = V / R; P = V * V / R; }
  else if (V !== undefined && P !== undefined) { I = P / V; R = V * V / P; }
  else if (I !== undefined && R !== undefined) { V = I * R; P = I * I * R; }
  else if (I !== undefined && P !== undefined) { V = P / I; R = P / (I * I); }
  else if (R !== undefined && P !== undefined) { V = Math.sqrt(P * R); I = Math.sqrt(P / R); }
  const out = { V, I, R, P };
  if (Object.values(out).some(v => !Number.isFinite(v))) throw new Error('Values must be positive and non-zero');
  return out;
}

export const series = rs => rs.reduce((s, r) => s + r, 0);
export const parallel = rs => 1 / rs.reduce((s, r) => s + 1 / r, 0);

export function divider({ vin, r1, r2 }) {
  if (!(vin > 0 && r1 > 0 && r2 > 0)) throw new Error('Enter positive values');
  const vout = vin * r2 / (r1 + r2), i = vin / (r1 + r2);
  return { vout, current: i, powerR1: i * i * r1, powerR2: i * i * r2 };
}

export const colorBands = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'grey', 'white'];
export const toleranceBands = { brown: 1, red: 2, green: 0.5, blue: 0.25, violet: 0.1, grey: 0.05, gold: 5, silver: 10, none: 20 };
export const multiplierBands = { black: 1, brown: 10, red: 100, orange: 1e3, yellow: 1e4, green: 1e5, blue: 1e6, violet: 1e7, grey: 1e8, white: 1e9, gold: 0.1, silver: 0.01 };

export function resistorFromBands(bands) {
  const n = bands.length;
  if (n !== 4 && n !== 5) throw new Error('Use 4 or 5 bands');
  const digits = bands.slice(0, n - 2).map(b => { const i = colorBands.indexOf(b); if (i < 0) throw new Error(`"${b}" is not a digit colour`); return i; });
  const mult = multiplierBands[bands[n - 2]], tol = toleranceBands[bands[n - 1]];
  if (mult === undefined) throw new Error('Invalid multiplier band');
  if (tol === undefined) throw new Error('Invalid tolerance band');
  const value = Number(digits.join('')) * mult;
  return { value, tolerance: tol, min: value * (1 - tol / 100), max: value * (1 + tol / 100) };
}

export function formatOhms(r) {
  if (r >= 1e6) return `${+(r / 1e6).toPrecision(4)} MΩ`;
  if (r >= 1e3) return `${+(r / 1e3).toPrecision(4)} kΩ`;
  return `${+r.toPrecision(4)} Ω`;
}

/** Three-phase power. Provide line voltage, line current, power factor. */
export function threePhase({ vLine, iLine, pf = 1, kW, efficiency = 1 }) {
  if (kW !== undefined && Number.isFinite(kW)) {
    if (!(vLine > 0 && pf > 0 && pf <= 1 && efficiency > 0 && efficiency <= 1)) throw new Error('Enter valid voltage, power factor and efficiency');
    const kVA = kW / (pf * efficiency), I = kVA * 1000 / (Math.sqrt(3) * vLine);
    return { kW, kVA, kvar: Math.sqrt(Math.max(0, kVA * kVA - (kW / efficiency) ** 2)), iLine: I, pf, vLine, vPhase: vLine / Math.sqrt(3) };
  }
  if (!(vLine > 0 && iLine > 0 && pf > 0 && pf <= 1)) throw new Error('Enter valid voltage, current and power factor');
  const kVA = Math.sqrt(3) * vLine * iLine / 1000, P = kVA * pf;
  return { kW: P, kVA, kvar: Math.sqrt(kVA * kVA - P * P), iLine, pf, vLine, vPhase: vLine / Math.sqrt(3) };
}

export function singlePhase({ v, i, pf = 1 }) {
  if (!(v > 0 && i > 0 && pf > 0 && pf <= 1)) throw new Error('Enter valid values');
  const VA = v * i, P = VA * pf;
  return { W: P, VA, var: Math.sqrt(VA * VA - P * P) };
}

/** Power factor correction capacitor (kvar) needed to move from pf1 to pf2. */
export function pfCorrection(kW, pf1, pf2) {
  if (!(kW > 0 && pf1 > 0 && pf1 <= 1 && pf2 > 0 && pf2 <= 1)) throw new Error('Enter valid values');
  return kW * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));
}

export const dbmToMw = dbm => 10 ** (dbm / 10);
export const mwToDbm = mw => { if (!(mw > 0)) throw new Error('Power must be positive'); return 10 * Math.log10(mw); };
export const ratioToDb = (ratio, kind = 'power') => { if (!(ratio > 0)) throw new Error('Ratio must be positive'); return (kind === 'power' ? 10 : 20) * Math.log10(ratio); };
export const dbToRatio = (db, kind = 'power') => 10 ** (db / (kind === 'power' ? 10 : 20));
export const dbuvToDbm = (dbuv, ohms = 50) => dbuv - 90 - 10 * Math.log10(ohms / 50) - 17; // 0 dBm = 107 dBµV @ 50 Ω
export const dbmToDbuv = (dbm, ohms = 50) => dbm + 107 + 10 * Math.log10(ohms / 50);

/** Voltage drop for DC or single-phase AC. Returns volts and percent. */
export function voltageDrop({ volts, amps, lengthM, areaMm2, material = 'copper', phases = 'dc', pf = 1 }) {
  const rho = { copper: 0.0172, aluminium: 0.0282 }[material];
  if (!rho) throw new Error('Unknown material');
  if (!(volts > 0 && amps > 0 && lengthM > 0 && areaMm2 > 0)) throw new Error('Enter positive values');
  const rOneWay = rho * lengthM / areaMm2;
  let drop;
  if (phases === 'three') drop = Math.sqrt(3) * amps * rOneWay * pf;
  else drop = 2 * amps * rOneWay * pf;
  return { drop, percent: drop / volts * 100, loadVoltage: volts - drop, resistanceLoop: phases === 'three' ? rOneWay : 2 * rOneWay };
}

/** Motor synchronous speed and slip. */
export function motor({ hz, poles, rpmActual }) {
  if (!(hz > 0) || !Number.isInteger(poles) || poles < 2 || poles % 2) throw new Error('Enter a frequency and an even number of poles');
  const sync = 120 * hz / poles;
  const slip = Number.isFinite(rpmActual) ? (sync - rpmActual) / sync * 100 : NaN;
  return { syncRpm: sync, radPerSec: sync * 2 * Math.PI / 60, slipPct: slip, rotorHz: Number.isFinite(slip) ? hz * slip / 100 : NaN };
}

/** Steady-state temperature rise: ΔT = P × Rθ. */
export function thermal({ powerW, rthJA, ambientC = 25, tjMaxC = 125 }) {
  if (!(powerW >= 0 && rthJA > 0)) throw new Error('Enter power and thermal resistance');
  const rise = powerW * rthJA, tj = ambientC + rise;
  return { rise, junction: tj, margin: tjMaxC - tj, maxPower: (tjMaxC - ambientC) / rthJA };
}
