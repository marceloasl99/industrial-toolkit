/* IPv4 parsing, subnetting and VLSM. All math on unsigned 32-bit integers. */
export function parseIp(text) {
  const parts = String(text).trim().split('.');
  if (parts.length !== 4) throw new Error('Enter a valid IPv4 address (four octets)');
  return parts.reduce((n, p) => {
    if (!/^(0|[1-9]\d{0,2})$/.test(p) || +p > 255) throw new Error(`Invalid octet "${p}" (0–255, no leading zeros)`);
    return (n * 256) + +p;
  }, 0) >>> 0;
}

export function ipToString(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function maskFromPrefix(prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('Prefix must be 0–32');
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function prefixFromMask(maskText) {
  const m = parseIp(maskText);
  const bits = m.toString(2).padStart(32, '0');
  if (!/^1*0*$/.test(bits)) throw new Error('Not a contiguous subnet mask');
  return bits.indexOf('0') === -1 ? 32 : bits.indexOf('0');
}

/** Accepts "10.0.0.0/24" or separate ip + prefix (or dotted mask). */
export function parseCidr(text, prefixOrMask) {
  let ipText = String(text).trim(), prefix = prefixOrMask;
  if (ipText.includes('/')) [ipText, prefix] = ipText.split('/');
  if (typeof prefix === 'string' && prefix.includes('.')) prefix = prefixFromMask(prefix);
  prefix = Number(prefix);
  return { ip: parseIp(ipText), prefix };
}

export function ipClass(ip) {
  const first = ip >>> 24;
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D (multicast)';
  return 'E (reserved)';
}

export function isPrivate(ip) {
  const a = ip >>> 24, b = (ip >>> 16) & 255;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export function subnet(ip, prefix) {
  const mask = maskFromPrefix(prefix);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);
  // RFC 3021: /31 links have two usable addresses; /32 is a single host.
  const usable = prefix === 32 ? 1 : prefix === 31 ? 2 : total - 2;
  const firstHost = prefix >= 31 ? network : network + 1;
  const lastHost = prefix >= 31 ? broadcast : broadcast - 1;
  return {
    ip, prefix, mask, network, broadcast, total, usable, firstHost, lastHost,
    wildcard: (~mask >>> 0), class: ipClass(ip), private: isPrivate(ip),
    binaryMask: mask.toString(2).padStart(32, '0').match(/.{8}/g).join('.'),
  };
}

/** Smallest prefix that fits `hosts` usable addresses. /31 and /32 are only used when `allowTiny` is set. */
export function prefixForHosts(hosts, { allowTiny = false } = {}) {
  if (!(hosts >= 1)) throw new Error('Hosts must be at least 1');
  for (let p = allowTiny ? 32 : 30; p >= 0; p--) {
    const usable = p === 32 ? 1 : p === 31 ? 2 : 2 ** (32 - p) - 2;
    if (usable >= hosts) return p;
  }
  throw new Error('Too many hosts');
}

/** VLSM: allocate subnets (largest first) inside a parent block. */
export function vlsm(parentCidr, requests) {
  const { ip, prefix } = parseCidr(parentCidr);
  const parent = subnet(ip, prefix);
  const sorted = requests.map((r, i) => ({ ...r, i })).sort((a, b) => b.hosts - a.hosts);
  let cursor = parent.network;
  const out = [];
  for (const r of sorted) {
    const p = prefixForHosts(r.hosts);
    if (p < prefix) throw new Error(`"${r.name}" needs /${p}, larger than the parent /${prefix}`);
    const size = 2 ** (32 - p);
    cursor = Math.ceil(cursor / size) * size; // align to block boundary
    if (cursor + size - 1 > parent.broadcast) throw new Error(`Not enough space for "${r.name}" (${r.hosts} hosts)`);
    out.push({ name: r.name, hosts: r.hosts, ...subnet(cursor, p) });
    cursor += size;
  }
  return { parent, subnets: out, remaining: parent.broadcast - cursor + 1 };
}
