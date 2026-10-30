/* Checksums used in IT and industrial protocols. Inputs are Uint8Array. */
export function bytesOf(input) {
  return input instanceof Uint8Array ? input : new TextEncoder().encode(String(input));
}

export function crc32(input) {
  let c = 0xffffffff;
  for (const b of bytesOf(input)) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** CRC-16/MODBUS: poly 0x8005 reflected (0xA001), init 0xFFFF, no final xor. */
export function crc16Modbus(input) {
  let c = 0xffff;
  for (const b of bytesOf(input)) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xa001 : c >>> 1;
  }
  return c & 0xffff;
}

/** CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF. */
export function crc16CcittFalse(input) {
  let c = 0xffff;
  for (const b of bytesOf(input)) {
    c ^= b << 8;
    for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c;
}

/** CRC-16/XMODEM: poly 0x1021, init 0x0000. */
export function crc16Xmodem(input) {
  let c = 0;
  for (const b of bytesOf(input)) {
    c ^= b << 8;
    for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff;
  }
  return c;
}

/** LRC used by Modbus ASCII: two's complement of the byte sum. */
export function lrc(input) {
  let s = 0;
  for (const b of bytesOf(input)) s = (s + b) & 0xff;
  return ((0x100 - s) & 0xff);
}

/** XOR checksum (NMEA 0183 style). */
export function xorChecksum(input) {
  let x = 0;
  for (const b of bytesOf(input)) x ^= b;
  return x;
}

export function crc8(input, poly = 0x07, init = 0x00) {
  let c = init;
  for (const b of bytesOf(input)) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ poly) & 0xff : (c << 1) & 0xff;
  }
  return c;
}

export function hex(n, width) {
  return n.toString(16).toUpperCase().padStart(width, '0');
}

/** Parse "01 03 00 00 00 0A" / "0103...". Returns Uint8Array. */
export function parseHexBytes(text) {
  const clean = String(text).replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
  if (clean.length % 2) throw new Error('Hex input must have an even number of digits');
  return Uint8Array.from(clean.match(/.{2}/g) || [], h => parseInt(h, 16));
}

export function toHexString(bytes, sep = ' ') {
  return [...bytes].map(b => hex(b, 2)).join(sep);
}
