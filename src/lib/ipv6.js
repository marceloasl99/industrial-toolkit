/* IPv6 parsing with BigInt. */
const MAX = (1n << 128n) - 1n;

export function parseIpv6(text) {
  let s = String(text).trim().toLowerCase();
  if (s.includes('%')) s = s.split('%')[0]; // drop zone id
  if (!/^[0-9a-f:.]+$/.test(s)) throw new Error('Invalid IPv6 characters');
  // embedded IPv4 tail (::ffff:192.0.2.1)
  if (s.includes('.')) {
    const idx = s.lastIndexOf(':');
    const v4 = s.slice(idx + 1).split('.');
    if (v4.length !== 4 || v4.some(o => !/^\d{1,3}$/.test(o) || +o > 255)) throw new Error('Invalid embedded IPv4');
    const hex = ((+v4[0] << 8) | +v4[1]).toString(16) + ':' + ((+v4[2] << 8) | +v4[3]).toString(16);
    s = s.slice(0, idx + 1) + hex;
  }
  const dbl = s.split('::');
  if (dbl.length > 2) throw new Error('Only one "::" is allowed');
  const head = dbl[0] ? dbl[0].split(':') : [];
  const tail = dbl.length === 2 && dbl[1] ? dbl[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (dbl.length === 1 && missing !== 0) throw new Error('An IPv6 address has eight groups');
  if (missing < 0) throw new Error('Too many groups');
  const groups = [...head, ...(dbl.length === 2 ? Array(missing).fill('0') : []), ...tail];
  if (groups.length !== 8) throw new Error('An IPv6 address has eight groups');
  let n = 0n;
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) throw new Error(`Invalid group "${g}"`);
    n = (n << 16n) | BigInt(parseInt(g, 16));
  }
  return n;
}

export function toGroups(n) {
  const g = [];
  for (let i = 7; i >= 0; i--) g.push(Number((n >> BigInt(i * 16)) & 0xffffn));
  return g;
}

export function expand(n) {
  return toGroups(n).map(g => g.toString(16).padStart(4, '0')).join(':');
}

/** RFC 5952 compression: longest run of zero groups (len >= 2) becomes "::". */
export function compress(n) {
  const g = toGroups(n).map(x => x.toString(16));
  let best = { start: -1, len: 0 }, cur = { start: -1, len: 0 };
  g.forEach((x, i) => {
    if (x === '0') { if (cur.start === -1) cur = { start: i, len: 1 }; else cur.len++; if (cur.len > best.len) best = { ...cur }; }
    else cur = { start: -1, len: 0 };
  });
  if (best.len < 2) return g.join(':');
  const left = g.slice(0, best.start).join(':'), right = g.slice(best.start + best.len).join(':');
  return `${left}::${right}`;
}

export function ipv6Type(n) {
  const s = expand(n);
  if (n === 0n) return 'Unspecified (::)';
  if (n === 1n) return 'Loopback (::1)';
  if (s.startsWith('fe80')) return 'Link-local (fe80::/10)';
  if (/^f[cd]/.test(s)) return 'Unique local (fc00::/7)';
  if (s.startsWith('ff')) return 'Multicast (ff00::/8)';
  if (s.startsWith('2001:0db8')) return 'Documentation (2001:db8::/32)';
  if (s.startsWith('0000:0000:0000:0000:0000:ffff')) return 'IPv4-mapped (::ffff:0:0/96)';
  if (/^[23]/.test(s)) return 'Global unicast (2000::/3)';
  return 'Reserved / other';
}

export function subnet6(text, prefixArg) {
  let s = String(text).trim(), prefix = prefixArg;
  if (s.includes('/')) [s, prefix] = s.split('/');
  prefix = Number(prefix);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) throw new Error('Prefix must be 0–128');
  const ip = parseIpv6(s);
  const mask = prefix === 0 ? 0n : (MAX << BigInt(128 - prefix)) & MAX;
  const network = ip & mask;
  const last = network | (~mask & MAX);
  const count = 1n << BigInt(128 - prefix);
  return {
    ip, prefix, network, last, count, type: ipv6Type(ip),
    expanded: expand(ip), compressed: compress(ip),
    networkCompressed: compress(network), lastCompressed: compress(last),
    subnets64: prefix <= 64 ? 1n << BigInt(64 - prefix) : 0n,
  };
}
