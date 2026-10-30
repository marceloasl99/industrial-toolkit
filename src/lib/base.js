/* Number base conversion, BCD and Gray code. Uses BigInt so large values survive. */
export function parseBase(text, base) {
  const s = String(text).trim().replace(/^0[xob]/i, '').replace(/[\s_]/g, '').toLowerCase();
  if (!s) throw new Error('Enter a value');
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, base);
  let n = 0n;
  for (const ch of s) {
    const d = digits.indexOf(ch);
    if (d === -1) throw new Error(`"${ch}" is not a valid base-${base} digit`);
    n = n * BigInt(base) + BigInt(d);
  }
  return n;
}

export function toAllBases(n) {
  return { binary: n.toString(2), octal: n.toString(8), decimal: n.toString(10), hexadecimal: n.toString(16).toUpperCase() };
}

export function groupDigits(s, size, sep = ' ') {
  const pad = (size - (s.length % size)) % size;
  return (('0'.repeat(pad)) + s).match(new RegExp(`.{${size}}`, 'g')).join(sep);
}

/** Packed BCD: each decimal digit as a 4-bit nibble. */
export function toBcd(n) {
  if (n < 0n) throw new Error('BCD needs a non-negative integer');
  return n.toString(10).split('').map(d => (+d).toString(2).padStart(4, '0')).join(' ');
}

export function fromBcd(bits) {
  const clean = String(bits).replace(/[^01]/g, '');
  if (!clean || clean.length % 4) throw new Error('BCD input must be groups of 4 bits');
  return BigInt(clean.match(/.{4}/g).map(nib => { const d = parseInt(nib, 2); if (d > 9) throw new Error(`Nibble ${nib} is not a decimal digit`); return d; }).join(''));
}

export function toGray(n) { return n ^ (n >> 1n); }
export function fromGray(g) { let n = 0n; for (let b = g; b > 0n; b >>= 1n) n ^= b; return n; }

export function twosComplement(n, bits) {
  const mod = 1n << BigInt(bits);
  if (n >= mod / 2n || n < -(mod / 2n)) throw new Error(`Value does not fit in ${bits}-bit signed`);
  return ((n % mod) + mod) % mod;
}
