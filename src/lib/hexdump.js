/* Hex dump rendering and string extraction, xxd style. */
export function hexdump(bytes, { width = 16, offset = 0 } = {}) {
  const lines = [];
  for (let i = 0; i < bytes.length; i += width) {
    const chunk = bytes.subarray(i, i + width);
    const hex = [...chunk].map(b => b.toString(16).padStart(2, '0')).join(' ').padEnd(width * 3 - 1);
    const ascii = [...chunk].map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
    lines.push(`${(offset + i).toString(16).padStart(8, '0')}  ${hex}  |${ascii}|`);
  }
  return lines.join('\n');
}

export function extractStrings(bytes, minLength = 4) {
  const out = [];
  let cur = '', start = 0;
  bytes.forEach((b, i) => {
    if (b >= 32 && b < 127) { if (!cur) start = i; cur += String.fromCharCode(b); }
    else { if (cur.length >= minLength) out.push({ offset: start, text: cur }); cur = ''; }
  });
  if (cur.length >= minLength) out.push({ offset: start, text: cur });
  return out;
}

export function parseHexdumpInput(text) {
  // Accept raw hex (with or without spaces/0x), or xxd-style lines "00000000: 48 65 ..."
  const cleaned = String(text).split(/\r?\n/).map(l => l.replace(/^\s*[0-9a-f]{4,8}:?\s+/i, '').replace(/\|.*$/, '').replace(/\s{2,}.*$/, m => m.replace(/[^0-9a-f\s]/gi, ''))).join(' ');
  const hex = cleaned.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
  if (hex.length % 2) throw new Error('Odd number of hex digits');
  return Uint8Array.from(hex.match(/.{2}/g) || [], h => parseInt(h, 16));
}

export function entropyOf(bytes) {
  if (!bytes.length) return 0;
  const counts = new Array(256).fill(0);
  for (const b of bytes) counts[b]++;
  let h = 0;
  for (const c of counts) if (c) { const p = c / bytes.length; h -= p * Math.log2(p); }
  return h; // bits per byte, max 8
}
