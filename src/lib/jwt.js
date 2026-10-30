/* JWT decoding without verification. */
import { base64ToBytes } from './base64.js';

const TIME_CLAIMS = { exp: 'Expires', iat: 'Issued at', nbf: 'Not before', auth_time: 'Auth time' };

function decodePart(part, label) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(part)); }
  catch { throw new Error(`${label} is not valid Base64url`); }
  try { return JSON.parse(text); } catch { throw new Error(`${label} is not valid JSON`); }
}

export function decodeJwt(raw, now = Date.now()) {
  let token = String(raw).trim();
  if (/^bearer\s+/i.test(token)) token = token.replace(/^bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length < 2 || parts.length > 3) throw new Error('A JWT has three dot-separated segments (header.payload.signature)');
  const header = decodePart(parts[0], 'Header');
  const payload = decodePart(parts[1], 'Payload');
  const warnings = [];
  if (!header.alg || String(header.alg).toLowerCase() === 'none') warnings.push('Algorithm is "none": the token carries no signature and must not be trusted.');
  if (parts.length < 3 || !parts[2]) warnings.push('Signature segment is missing.');
  const times = [];
  for (const [claim, label] of Object.entries(TIME_CLAIMS)) {
    if (typeof payload[claim] === 'number') times.push({ claim, label, date: new Date(payload[claim] * 1000) });
  }
  if (typeof payload.exp === 'number' && payload.exp * 1000 < now) warnings.push(`Token expired on ${new Date(payload.exp * 1000).toISOString()}.`);
  if (typeof payload.nbf === 'number' && payload.nbf * 1000 > now) warnings.push('Token is not valid yet (nbf is in the future).');
  return { header, payload, signature: parts[2] || '', times, warnings };
}
