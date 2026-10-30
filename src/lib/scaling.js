/* Linear signal scaling and current-loop helpers. */

/** Map x from [inMin,inMax] to [outMin,outMax]; inverted ranges are allowed. */
export function scale(x, inMin, inMax, outMin, outMax) {
  if ([x, inMin, inMax, outMin, outMax].some(v => !Number.isFinite(v))) throw new Error('Enter numeric values');
  if (inMin === inMax) throw new Error('Input range cannot be zero');
  return outMin + (x - inMin) * (outMax - outMin) / (inMax - inMin);
}

export const signalPresets = {
  '4–20 mA': [4, 20], '0–20 mA': [0, 20], '0–10 V': [0, 10], '2–10 V': [2, 10], '0–5 V': [0, 5], '1–5 V': [1, 5],
  '0–32767 (PLC raw 15-bit)': [0, 32767], '0–27648 (Siemens raw)': [0, 27648], '0–4095 (12-bit)': [0, 4095], '0–65535 (16-bit)': [0, 65535],
};

/** NAMUR NE 43 classification for a 4–20 mA signal. */
export function namurStatus(mA) {
  if (!Number.isFinite(mA)) return { level: 'error', text: 'Invalid' };
  if (mA < 3.6) return { level: 'fault', text: 'Fault — under-range (< 3.6 mA, NE 43 low alarm or open loop)' };
  if (mA < 3.8) return { level: 'warn', text: 'Below saturation limit (3.6–3.8 mA)' };
  if (mA < 4) return { level: 'warn', text: 'Saturated low (3.8–4 mA)' };
  if (mA <= 20) return { level: 'ok', text: 'Within normal range (4–20 mA)' };
  if (mA <= 20.5) return { level: 'warn', text: 'Saturated high (20–20.5 mA)' };
  if (mA <= 21) return { level: 'warn', text: 'Above saturation limit (20.5–21 mA)' };
  return { level: 'fault', text: 'Fault — over-range (> 21 mA, NE 43 high alarm or short circuit)' };
}

/** 4–20 mA loop budget: does the supply voltage cover every drop in the loop? */
export function loopBudget({ supply, transmitterMin = 12, loads = [], wireResistance = 0, current = 0.02 }) {
  const loadOhms = loads.reduce((s, r) => s + r, 0) + wireResistance;
  const dropAtMax = loadOhms * current; // loads at 20 mA (or chosen current)
  const available = supply - transmitterMin;
  const maxLoad = available / current;
  return { loadOhms, dropAtMax, available, maxLoad, margin: available - dropAtMax, ok: available >= dropAtMax, transmitterVoltage: supply - dropAtMax };
}

/** Copper wire resistance (ohm) for a given cross-section (mm²) and one-way length (m); loop length is 2×. */
export function wireResistance({ lengthM, areaMm2, material = 'copper', loop = true, temperatureC = 20 }) {
  const rho = { copper: 0.0172, aluminium: 0.0282 }[material]; // Ω·mm²/m at 20 °C
  const alpha = { copper: 0.00393, aluminium: 0.00403 }[material];
  if (!rho) throw new Error('Unknown material');
  if (!(lengthM > 0 && areaMm2 > 0)) throw new Error('Length and area must be positive');
  const r20 = rho * lengthM * (loop ? 2 : 1) / areaMm2;
  return r20 * (1 + alpha * (temperatureC - 20));
}

export const awgToMm2 = awg => 0.012668 * 92 ** ((36 - awg) / 19.5); // area in mm²
export const standardSections = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];
