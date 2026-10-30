/* HOTP / TOTP (RFC 4226 / 6238) using Web Crypto. */
import { base32ToBytes } from './base64.js';

export async function hmac(algorithm, keyBytes, dataBytes) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algorithm }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, dataBytes));
}

export async function hotp(secretBytes, counter, { digits = 6, algorithm = 'SHA-1' } = {}) {
  const msg = new Uint8Array(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) { msg[i] = Number(c & 0xffn); c >>= 8n; }
  const h = await hmac(algorithm, secretBytes, msg);
  const offset = h[h.length - 1] & 0x0f;
  const code = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(code % 10 ** digits).padStart(digits, '0');
}

export async function totp(secretBase32, { digits = 6, period = 30, algorithm = 'SHA-1', now = Date.now() } = {}) {
  const secret = base32ToBytes(secretBase32);
  const counter = Math.floor(now / 1000 / period);
  const code = await hotp(secret, counter, { digits, algorithm });
  return { code, counter, secondsLeft: period - (Math.floor(now / 1000) % period), next: await hotp(secret, counter + 1, { digits, algorithm }), previous: await hotp(secret, counter - 1, { digits, algorithm }) };
}

export function otpauthUri({ issuer, account, secret, digits = 6, period = 30, algorithm = 'SHA1' }) {
  const label = encodeURIComponent(issuer ? `${issuer}:${account}` : account);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer || '')}&digits=${digits}&period=${period}&algorithm=${algorithm}`;
}
