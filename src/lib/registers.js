/* 16-bit register words <-> 32-bit/64-bit numeric types with selectable byte/word order. */
export const orders = {
  ABCD: 'Big-endian (ABCD)',
  CDAB: 'Word-swapped (CDAB)',
  BADC: 'Byte-swapped (BADC)',
  DCBA: 'Little-endian (DCBA)',
};

function toBytes(words) {
  const b = [];
  for (const w of words) b.push((w >> 8) & 255, w & 255);
  return b;
}

/** Reorder 4 bytes (big-endian ABCD in) into the chosen wire order. */
function reorder(bytes, order) {
  const [A, B, C, D] = bytes;
  switch (order) {
    case 'ABCD': return [A, B, C, D];
    case 'CDAB': return [C, D, A, B];
    case 'BADC': return [B, A, D, C];
    case 'DCBA': return [D, C, B, A];
    default: throw new Error('Unknown byte order');
  }
}

export function parseWords(text) {
  const parts = String(text).trim().split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) throw new Error('Enter register values');
  return parts.map(p => {
    const n = /^0x/i.test(p) ? parseInt(p, 16) : Number(p);
    if (!Number.isInteger(n) || n < 0 || n > 65535) throw new Error(`"${p}" is not a 16-bit register value (0–65535 or 0xFFFF)`);
    return n;
  });
}

/** Decode two registers into every 32-bit interpretation. */
export function decode32(words, order = 'ABCD') {
  if (words.length < 2) throw new Error('Two registers are needed for 32-bit values');
  const wire = reorder(toBytes(words.slice(0, 2)), order);
  const view = new DataView(new Uint8Array(wire).buffer);
  return {
    float32: view.getFloat32(0, false),
    int32: view.getInt32(0, false),
    uint32: view.getUint32(0, false),
    hex: [...wire].map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(''),
  };
}

export function decode16(word) {
  const view = new DataView(new Uint8Array([word >> 8, word & 255]).buffer);
  return { int16: view.getInt16(0, false), uint16: word, hex: word.toString(16).toUpperCase().padStart(4, '0'), binary: word.toString(2).padStart(16, '0') };
}

/** Encode a number into two registers for the chosen type and order. */
export function encode32(value, type, order = 'ABCD') {
  const buf = new ArrayBuffer(4), view = new DataView(buf);
  if (type === 'float32') view.setFloat32(0, value, false);
  else if (type === 'int32') { if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) throw new Error('int32 range is −2,147,483,648 to 2,147,483,647'); view.setInt32(0, value, false); }
  else if (type === 'uint32') { if (!Number.isInteger(value) || value < 0 || value > 4294967295) throw new Error('uint32 range is 0 to 4,294,967,295'); view.setUint32(0, value, false); }
  else throw new Error('Unknown type');
  const abcd = [...new Uint8Array(buf)];
  // invert the mapping: we need bytes such that reorder(bytes, order) === abcd
  const inverse = { ABCD: 'ABCD', CDAB: 'CDAB', BADC: 'BADC', DCBA: 'DCBA' }[order]; // all four are self-inverse
  const wire = reorder(abcd, inverse);
  return [(wire[0] << 8) | wire[1], (wire[2] << 8) | wire[3]];
}

export function decode64(words, order = 'ABCD') {
  if (words.length < 4) throw new Error('Four registers are needed for 64-bit values');
  const bytes = toBytes(words.slice(0, 4));
  let wire;
  switch (order) {
    case 'ABCD': wire = bytes; break;
    case 'DCBA': wire = [...bytes].reverse(); break;
    case 'CDAB': wire = [...bytes.slice(6, 8), ...bytes.slice(4, 6), ...bytes.slice(2, 4), ...bytes.slice(0, 2)]; break;
    case 'BADC': wire = []; for (let i = 0; i < 8; i += 2) wire.push(bytes[i + 1], bytes[i]); break;
    default: throw new Error('Unknown byte order');
  }
  const view = new DataView(new Uint8Array(wire).buffer);
  return { float64: view.getFloat64(0, false), int64: view.getBigInt64(0, false), uint64: view.getBigUint64(0, false) };
}
