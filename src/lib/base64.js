/* UTF-8 safe Base64 and Base64url. Works in browsers and Node. */
export function encodeBase64(text, { url = false } = {}) {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64(bytes, { url });
}

export function bytesToBase64(bytes, { url = false } = {}) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = btoa(bin);
  return url ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64;
}

export function base64ToBytes(text) {
  let s = String(text).trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*=*$/.test(s)) throw new Error('Input contains characters outside the Base64 alphabet');
  if (s.length % 4) s += '='.repeat(4 - (s.length % 4));
  let bin;
  try { bin = atob(s); } catch { throw new Error('Invalid Base64 padding or length'); }
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function decodeBase64(text) {
  const bytes = base64ToBytes(text);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Decoded bytes are not valid UTF-8 text (binary payload?)'); }
}

/** RFC 4648 Base32 decode (used by TOTP secrets). */
export function base32ToBytes(text) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const s = String(text).toUpperCase().replace(/[\s=-]/g, '');
  if (!s) throw new Error('Enter a Base32 secret');
  let bits = 0, value = 0; const out = [];
  for (const ch of s) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error(`"${ch}" is not a Base32 character`);
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Uint8Array.from(out);
}

export function bytesToBase32(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, out = '';
  for (const b of bytes) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
