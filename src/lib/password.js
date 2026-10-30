/* Password generation (unbiased) and strength estimation. */
export const sets = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789',
  symbols: '!@#$%^&*()_-+=[]{};:,.<>?/', ambiguous: '0O1lI|`\'"',
};

/** Uniform random integer in [0, n) by rejection sampling: no modulo bias. */
export function randomInt(n) {
  if (!(n > 0 && n <= 0x100000000)) throw new Error('Range out of bounds');
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % n;
}

export function buildAlphabet({ upper = true, lower = true, digits = true, symbols = true, excludeAmbiguous = false, custom = '' }) {
  let a = '';
  if (upper) a += sets.upper;
  if (lower) a += sets.lower;
  if (digits) a += sets.digits;
  if (symbols) a += sets.symbols;
  a += custom;
  if (excludeAmbiguous) a = [...a].filter(c => !sets.ambiguous.includes(c)).join('');
  const unique = [...new Set(a)].join('');
  if (!unique) throw new Error('Select at least one character set');
  return unique;
}

export function generatePassword(length, options) {
  const alphabet = buildAlphabet(options);
  if (!(length >= 4 && length <= 256)) throw new Error('Length must be 4–256');
  // Guarantee at least one character from each enabled set, then shuffle.
  const required = [];
  for (const k of ['upper', 'lower', 'digits', 'symbols']) {
    if (options[k] !== false && options[k] !== undefined) {
      const pool = [...sets[k]].filter(c => alphabet.includes(c));
      if (pool.length) required.push(pool[randomInt(pool.length)]);
    }
  }
  const chars = required.slice(0, length);
  while (chars.length < length) chars.push(alphabet[randomInt(alphabet.length)]);
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
  return chars.join('');
}

const WORDS = ['anchor', 'basalt', 'cobalt', 'delta', 'ember', 'falcon', 'granite', 'harbor', 'ion', 'jasper', 'kelvin', 'lumen', 'magnet', 'nickel', 'orbit', 'piston', 'quartz', 'relay', 'sensor', 'torque', 'uplink', 'valve', 'watt', 'xenon', 'yield', 'zinc', 'alloy', 'beacon', 'cipher', 'diode', 'engine', 'fiber', 'gauge', 'helix', 'inlet', 'joule', 'kernel', 'lattice', 'modem', 'nozzle', 'ohm', 'probe', 'rotor', 'solder', 'tensor', 'vector', 'weld', 'axle', 'bolt', 'crank', 'drill', 'flux', 'gear', 'hinge', 'ingot', 'lever', 'motor', 'pump', 'rivet', 'shaft', 'turbine', 'vortex', 'winch', 'byte', 'cache', 'daemon', 'ethernet', 'firmware', 'gateway', 'host', 'index', 'kilo', 'logic', 'mesh', 'node', 'packet', 'query', 'router', 'socket', 'token', 'uplink', 'vlan', 'wafer', 'buffer', 'circuit', 'driver', 'encoder', 'filter', 'ground', 'heater', 'input', 'jumper', 'ladder', 'meter', 'output', 'panel', 'reactor', 'signal', 'timer', 'vessel', 'cable', 'damper', 'fuse', 'grid', 'loop', 'mixer', 'orifice', 'pipe', 'range', 'sample', 'tank', 'union', 'volt', 'wire'];
export function generatePassphrase(words = 4, separator = '-', capitalize = false, addNumber = false) {
  if (!(words >= 2 && words <= 12)) throw new Error('Use 2–12 words');
  const picked = Array.from({ length: words }, () => { const w = WORDS[randomInt(WORDS.length)]; return capitalize ? w[0].toUpperCase() + w.slice(1) : w; });
  if (addNumber) picked.push(String(randomInt(100)));
  return { phrase: picked.join(separator), entropyBits: words * Math.log2(WORDS.length) + (addNumber ? Math.log2(100) : 0) };
}

/** Estimate entropy from the character classes present, with pattern penalties. */
export function analyzePassword(pw) {
  if (!pw) return { length: 0, entropyBits: 0, poolSize: 0, crackTime: '—', rating: 'empty', notes: ['Enter a password'] };
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
  let bits = pw.length * Math.log2(pool || 1);
  const notes = [];
  const lower = pw.toLowerCase();
  if (/(.)\1{2,}/.test(pw)) { bits *= 0.8; notes.push('Repeated characters reduce strength.'); }
  if (/(abc|bcd|cde|def|123|234|345|456|567|678|789|qwe|wer|ert|asd|sdf|zxc)/.test(lower)) { bits *= 0.8; notes.push('Contains a keyboard or numeric sequence.'); }
  if (/(password|senha|admin|welcome|letmein|qwerty|123456|iloveyou|root|user|login)/.test(lower)) { bits *= 0.5; notes.push('Contains a very common word.'); }
  if (/^\d+$/.test(pw)) notes.push('Digits only: trivial to brute-force.');
  if (/^(19|20)\d\d$/.test(pw) || /(19|20)\d\d/.test(pw)) notes.push('Looks like it contains a year.');
  const guessesPerSec = 1e10; // offline attack on a fast hash
  const seconds = 2 ** bits / guessesPerSec / 2;
  const rating = bits < 28 ? 'very weak' : bits < 36 ? 'weak' : bits < 60 ? 'fair' : bits < 80 ? 'strong' : 'very strong';
  return { length: pw.length, poolSize: pool, entropyBits: bits, crackTime: humanTime(seconds), rating, notes };
}

export function humanTime(seconds) {
  if (seconds < 1) return 'instant';
  const units = [['year', 31557600], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  for (const [name, s] of units) {
    if (seconds >= s) {
      const v = seconds / s;
      if (v > 1e12) return `${v.toExponential(1)} ${name}s`;
      return `${Math.round(v).toLocaleString('en-US')} ${name}${Math.round(v) === 1 ? '' : 's'}`;
    }
  }
  return 'instant';
}
