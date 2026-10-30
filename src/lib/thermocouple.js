/*
 * Thermocouple conversion using the NIST ITS-90 inverse polynomials (mV -> °C).
 * °C -> mV is obtained by bisection on the inverse polynomial, which keeps a single
 * source of coefficients. Ranges are the ones NIST publishes for each polynomial.
 */
export const thermocouples = {
  K: {
    name: 'Type K (NiCr–NiAl)',
    ranges: [
      { minMv: -5.891, maxMv: 0, minC: -200, maxC: 0, d: [0, 2.5173462e1, -1.1662878, -1.0833638, -8.977354e-1, -3.7342377e-1, -8.6632643e-2, -1.0450598e-2, -5.1920577e-4] },
      { minMv: 0, maxMv: 20.644, minC: 0, maxC: 500, d: [0, 2.508355e1, 7.860106e-2, -2.503131e-1, 8.31527e-2, -1.228034e-2, 9.804036e-4, -4.41303e-5, 1.057734e-6, -1.052755e-8] },
      { minMv: 20.644, maxMv: 54.886, minC: 500, maxC: 1372, d: [-1.318058e2, 4.830222e1, -1.646031, 5.464731e-2, -9.650715e-4, 8.802193e-6, -3.11081e-8] },
    ],
  },
  J: {
    name: 'Type J (Fe–CuNi)',
    ranges: [
      { minMv: -8.095, maxMv: 0, minC: -210, maxC: 0, d: [0, 1.9528268e1, -1.2286185, -1.0752178, -5.9086933e-1, -1.7256713e-1, -2.8131513e-2, -2.396337e-3, -8.3823321e-5] },
      { minMv: 0, maxMv: 42.919, minC: 0, maxC: 760, d: [0, 1.978425e1, -2.001204e-1, 1.036969e-2, -2.549687e-4, 3.585153e-6, -5.344285e-8, 5.09989e-10] },
      { minMv: 42.919, maxMv: 69.553, minC: 760, maxC: 1200, d: [-3.11358187e3, 3.00543684e2, -9.94773230, 1.70276630e-1, -1.43033468e-3, 4.73886084e-6] },
    ],
  },
  T: {
    name: 'Type T (Cu–CuNi)',
    ranges: [
      { minMv: -5.603, maxMv: 0, minC: -200, maxC: 0, d: [0, 2.5949192e1, -2.1316967e-1, 7.9018692e-1, 4.2527777e-1, 1.3304473e-1, 2.0241446e-2, 1.2668171e-3] },
      { minMv: 0, maxMv: 20.872, minC: 0, maxC: 400, d: [0, 2.592800e1, -7.602961e-1, 4.637791e-2, -2.165394e-3, 6.048144e-5, -7.293422e-7] },
    ],
  },
  E: {
    name: 'Type E (NiCr–CuNi)',
    ranges: [
      { minMv: -8.825, maxMv: 0, minC: -200, maxC: 0, d: [0, 1.6977288e1, -4.3514970e-1, -1.5859697e-1, -9.2502871e-2, -2.6084314e-2, -4.1360199e-3, -3.4034030e-4, -1.1564890e-5] },
      { minMv: 0, maxMv: 76.373, minC: 0, maxC: 1000, d: [0, 1.7057035e1, -2.3301759e-1, 6.5435585e-3, -7.3562749e-5, -1.7896001e-6, 8.4036165e-8, -1.3735879e-9, 1.0629823e-11, -3.2447087e-14] },
    ],
  },
  N: {
    name: 'Type N (NiCrSi–NiSi)',
    ranges: [
      { minMv: -3.990, maxMv: 0, minC: -200, maxC: 0, d: [0, 3.8436847e1, 1.1010485, 5.2229312, 7.2060525, 5.8488586, 2.7754916, 7.7075166e-1, 1.1582665e-1, 7.3138868e-3] },
      { minMv: 0, maxMv: 20.613, minC: 0, maxC: 600, d: [0, 3.86896e1, -1.08267, 4.70205e-2, -2.12169e-6, -1.17272e-4, 5.39280e-6, -7.98156e-8] },
      { minMv: 20.613, maxMv: 47.513, minC: 600, maxC: 1300, d: [1.972485e1, 3.300943e1, -3.915159e-1, 9.855391e-3, -1.274371e-4, 7.767022e-7] },
    ],
  },
};

function poly(d, x) { let s = 0; for (let i = d.length - 1; i >= 0; i--) s = s * x + d[i]; return s; }

export function mvToCelsius(type, mv) {
  const tc = thermocouples[type];
  if (!tc) throw new Error('Unknown thermocouple type');
  if (!Number.isFinite(mv)) throw new Error('Enter a voltage');
  const r = tc.ranges.find(x => mv >= x.minMv && mv <= x.maxMv);
  if (!r) throw new Error(`${tc.name} polynomials cover ${tc.ranges[0].minMv} to ${tc.ranges.at(-1).maxMv} mV`);
  return poly(r.d, mv);
}

export function celsiusToMv(type, tC) {
  const tc = thermocouples[type];
  if (!tc) throw new Error('Unknown thermocouple type');
  const minC = tc.ranges[0].minC, maxC = tc.ranges.at(-1).maxC;
  if (!(tC >= minC && tC <= maxC)) throw new Error(`${tc.name} covers ${minC} °C to ${maxC} °C`);
  let lo = tc.ranges[0].minMv, hi = tc.ranges.at(-1).maxMv;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (mvToCelsius(type, mid) < tC) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Cold-junction compensation: measured mV + mV(reference temperature). */
export function compensate(type, measuredMv, coldJunctionC) {
  return mvToCelsius(type, measuredMv + celsiusToMv(type, coldJunctionC));
}
