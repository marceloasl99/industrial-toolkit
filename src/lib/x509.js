/* Minimal ASN.1 DER parser sufficient for X.509 certificate summaries. No validation. */
import { base64ToBytes } from './base64.js';

const OIDS = {
  '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST', '2.5.4.10': 'O', '2.5.4.11': 'OU', '2.5.4.5': 'serialNumber', '1.2.840.113549.1.9.1': 'emailAddress', '0.9.2342.19200300.100.1.25': 'DC',
  '1.2.840.113549.1.1.1': 'RSA', '1.2.840.113549.1.1.5': 'SHA1 with RSA', '1.2.840.113549.1.1.11': 'SHA256 with RSA', '1.2.840.113549.1.1.12': 'SHA384 with RSA', '1.2.840.113549.1.1.13': 'SHA512 with RSA',
  '1.2.840.113549.1.1.10': 'RSA-PSS', '1.2.840.10045.2.1': 'EC public key', '1.2.840.10045.4.3.2': 'ECDSA with SHA256', '1.2.840.10045.4.3.3': 'ECDSA with SHA384', '1.2.840.10045.4.3.4': 'ECDSA with SHA512',
  '1.3.101.112': 'Ed25519', '1.3.101.113': 'Ed448', '1.2.840.10045.3.1.7': 'P-256', '1.3.132.0.34': 'P-384', '1.3.132.0.35': 'P-521',
  '2.5.29.17': 'subjectAltName', '2.5.29.19': 'basicConstraints', '2.5.29.15': 'keyUsage', '2.5.29.37': 'extKeyUsage', '2.5.29.14': 'subjectKeyIdentifier', '2.5.29.35': 'authorityKeyIdentifier',
  '2.5.29.31': 'cRLDistributionPoints', '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess', '2.5.29.32': 'certificatePolicies', '1.3.6.1.4.1.11129.2.4.2': 'SCT list',
  '1.3.6.1.5.5.7.3.1': 'serverAuth', '1.3.6.1.5.5.7.3.2': 'clientAuth', '1.3.6.1.5.5.7.3.3': 'codeSigning', '1.3.6.1.5.5.7.3.4': 'emailProtection', '1.3.6.1.5.5.7.3.8': 'timeStamping', '1.3.6.1.5.5.7.3.9': 'OCSPSigning',
};

function readLength(bytes, pos) {
  let len = bytes[pos++];
  if (len & 0x80) {
    const n = len & 0x7f; len = 0;
    for (let i = 0; i < n; i++) len = (len << 8) | bytes[pos++];
  }
  return { len, pos };
}

/** Parse one TLV at `pos`. Returns {tag, cls, constructed, start, end, children?} */
export function parseTlv(bytes, pos = 0) {
  if (pos >= bytes.length) throw new Error('Unexpected end of DER data');
  const tagByte = bytes[pos++];
  const tag = tagByte & 0x1f, cls = tagByte >> 6, constructed = !!(tagByte & 0x20);
  const l = readLength(bytes, pos);
  const start = l.pos, end = start + l.len;
  if (end > bytes.length) throw new Error('DER length exceeds data');
  const node = { tag, cls, constructed, start, end, tagByte };
  if (constructed) {
    node.children = [];
    let p = start;
    while (p < end) { const c = parseTlv(bytes, p); node.children.push(c); p = c.end; }
  }
  return node;
}

function oidOf(bytes, node) {
  const b = bytes.subarray(node.start, node.end);
  const parts = [];
  let v = 0;
  for (let i = 0; i < b.length; i++) {
    v = (v << 7) | (b[i] & 0x7f);
    if (!(b[i] & 0x80)) { if (!parts.length) parts.push(Math.floor(v / 40), v % 40); else parts.push(v); v = 0; }
  }
  return parts.join('.');
}
const str = (bytes, node) => new TextDecoder().decode(bytes.subarray(node.start, node.end));
const hexOf = (bytes, node) => [...bytes.subarray(node.start, node.end)].map(b => b.toString(16).padStart(2, '0')).join(':');

function parseName(bytes, node) {
  // Name ::= SEQUENCE OF SET OF SEQUENCE { OID, value }
  return node.children.map(set => set.children.map(atv => {
    const oid = oidOf(bytes, atv.children[0]);
    return `${OIDS[oid] || oid}=${str(bytes, atv.children[1])}`;
  }).join('+')).join(', ');
}

function parseTime(bytes, node) {
  const s = str(bytes, node);
  const utc = node.tag === 23; // UTCTime YYMMDDHHMMSSZ
  const year = utc ? (+s.slice(0, 2) < 50 ? 2000 : 1900) + +s.slice(0, 2) : +s.slice(0, 4);
  const o = utc ? 2 : 4;
  return new Date(Date.UTC(year, +s.slice(o, o + 2) - 1, +s.slice(o + 2, o + 4), +s.slice(o + 4, o + 6), +s.slice(o + 6, o + 8), +s.slice(o + 8, o + 10) || 0));
}

export function pemToDer(text) {
  const s = String(text).trim();
  const m = s.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  const body = m ? m[2] : s;
  if (m && !/CERTIFICATE/.test(m[1])) throw new Error(`This is a ${m[1]}, not a certificate`);
  return base64ToBytes(body.replace(/\s+/g, ''));
}

export function parseCertificate(input) {
  const der = input instanceof Uint8Array ? input : pemToDer(input);
  const root = parseTlv(der);
  if (!root.constructed || root.children.length < 3) throw new Error('Not an X.509 certificate structure');
  const tbs = root.children[0];
  let i = 0;
  let version = 1;
  if (tbs.children[0].cls === 2 && tbs.children[0].tag === 0) { version = der[tbs.children[0].children[0].start] + 1; i = 1; }
  const serial = hexOf(der, tbs.children[i++]);
  const sigAlgOid = oidOf(der, tbs.children[i++].children[0]);
  const issuer = parseName(der, tbs.children[i++]);
  const validity = tbs.children[i++];
  const notBefore = parseTime(der, validity.children[0]), notAfter = parseTime(der, validity.children[1]);
  const subject = parseName(der, tbs.children[i++]);
  const spki = tbs.children[i++];
  const keyAlgOid = oidOf(der, spki.children[0].children[0]);
  let keyDetail = '';
  if (keyAlgOid === '1.2.840.10045.2.1' && spki.children[0].children[1]) keyDetail = OIDS[oidOf(der, spki.children[0].children[1])] || '';
  if (keyAlgOid === '1.2.840.113549.1.1.1') {
    // BIT STRING -> RSAPublicKey SEQUENCE { modulus INTEGER, exponent }
    try { const bit = spki.children[1]; const rsa = parseTlv(der, bit.start + 1); const mod = rsa.children[0]; const bits = (mod.end - mod.start - (der[mod.start] === 0 ? 1 : 0)) * 8; keyDetail = `${bits}-bit`; } catch { /* ignore */ }
  }
  const extensions = [];
  const san = [];
  let isCa = null;
  for (; i < tbs.children.length; i++) {
    const node = tbs.children[i];
    if (node.cls === 2 && node.tag === 3) {
      for (const ext of node.children[0].children) {
        const oid = oidOf(der, ext.children[0]);
        const critical = ext.children.length === 3;
        const valueNode = ext.children[ext.children.length - 1];
        extensions.push({ oid, name: OIDS[oid] || oid, critical });
        if (oid === '2.5.29.17') {
          const inner = parseTlv(der, valueNode.start);
          for (const gn of inner.children) {
            const t = { 2: 'DNS', 1: 'email', 7: 'IP', 6: 'URI' }[gn.tag];
            if (gn.tag === 7) san.push(`IP:${[...der.subarray(gn.start, gn.end)].join('.')}`);
            else if (t) san.push(`${t}:${str(der, gn)}`);
          }
        }
        if (oid === '2.5.29.19') { const inner = parseTlv(der, valueNode.start); isCa = !!(inner.children[0] && inner.children[0].tag === 1 && der[inner.children[0].start]); }
      }
    }
  }
  const now = Date.now();
  return {
    version, serial, signatureAlgorithm: OIDS[sigAlgOid] || sigAlgOid, issuer, subject, notBefore, notAfter,
    publicKey: `${OIDS[keyAlgOid] || keyAlgOid}${keyDetail ? ' ' + keyDetail : ''}`, subjectAltNames: san, extensions, isCa,
    selfSigned: issuer === subject, expired: notAfter.getTime() < now, notYetValid: notBefore.getTime() > now,
    daysRemaining: Math.floor((notAfter.getTime() - now) / 86400000), der,
  };
}
