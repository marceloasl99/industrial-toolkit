/*
 * PLC address notation helpers. Vendor <-> Modbus mappings follow the conventions most
 * gateways use; every result must be checked against the specific device manual.
 */
export const vendors = {
  schneider: 'Schneider / Modicon IEC (%MW, %M, %IW)',
  siemens: 'Siemens S7 (DBx.DBWy, Mx.y, IWx, QWx)',
  ab: 'Allen-Bradley SLC/PLC-5 (N7:x, B3:x, F8:x)',
  modbus: 'Modbus reference (40001 / 400001)',
};

/** Convert a Schneider IEC address into a Modbus reference. */
function fromSchneider(addr) {
  const m = addr.match(/^%(MW|M|IW|I|QW|Q)(\d+)(?:\.(\d+))?$/i);
  if (!m) throw new Error('Expected %MWn, %Mn, %IWn, %In, %QWn or %Qn');
  const type = m[1].toUpperCase(), n = +m[2];
  switch (type) {
    case 'MW': return { family: 4, offset: n, note: '%MW n ↔ holding register 4000(n+1) on Modicon gateways' };
    case 'M': return { family: 0, offset: n, note: '%M n ↔ coil n+1' };
    case 'IW': return { family: 3, offset: n, note: '%IW n ↔ input register 3000(n+1)' };
    case 'I': return { family: 1, offset: n, note: '%I n ↔ discrete input 1000(n+1)' };
    case 'QW': return { family: 4, offset: n, note: 'Outputs words usually map to holding registers; vendor dependent' };
    case 'Q': return { family: 0, offset: n, note: 'Output bits usually map to coils; vendor dependent' };
  }
}

function fromSiemens(addr) {
  const m = addr.match(/^(?:DB(\d+)\.)?(DBW|DBD|DBX|DBB|MW|MD|M|IW|QW|I|Q)(\d+)(?:\.(\d))?$/i);
  if (!m) throw new Error('Expected DB1.DBW0, DB1.DBX0.3, MW10, M0.1, IW0 or QW0');
  const area = m[2].toUpperCase(), byte = +m[3], bit = m[4] !== undefined ? +m[4] : null;
  const isWord = /W|D/.test(area);
  if (isWord && byte % 2) throw new Error('Word/double-word addresses must be even byte offsets');
  const note = 'Siemens addresses are byte-based; Modbus registers are 16-bit. Word offset = byte / 2 (gateway mapping is configurable).';
  if (area.startsWith('DB') || area.startsWith('M')) return { family: isWord ? 4 : 0, offset: isWord ? byte / 2 : byte * 8 + (bit || 0), note, db: m[1] ? +m[1] : null, bytes: area.endsWith('D') ? 4 : area.endsWith('W') ? 2 : 1 };
  if (area.startsWith('I')) return { family: isWord ? 3 : 1, offset: isWord ? byte / 2 : byte * 8 + (bit || 0), note };
  return { family: isWord ? 4 : 0, offset: isWord ? byte / 2 : byte * 8 + (bit || 0), note };
}

function fromAb(addr) {
  const m = addr.match(/^([NBFIOTC])(\d+):(\d+)(?:\/(\d+))?$/i);
  if (!m) throw new Error('Expected N7:0, B3:0/5, F8:2, I:0/3 style');
  const file = m[1].toUpperCase(), element = +m[3], bit = m[4] !== undefined ? +m[4] : null;
  const note = 'SLC/MicroLogix Modbus mapping: N files → holding registers (N7:0 ↔ 40001 by default), B files → coils.';
  if (file === 'N') return { family: 4, offset: element, note, bytes: 2 };
  if (file === 'F') return { family: 4, offset: element * 2, note: 'F files are 32-bit floats: two holding registers each.', bytes: 4 };
  if (file === 'B') return { family: 0, offset: element * 16 + (bit || 0), note };
  if (file === 'I') return { family: 1, offset: element * 16 + (bit || 0), note };
  if (file === 'O') return { family: 0, offset: element * 16 + (bit || 0), note };
  throw new Error('Timer/counter files have no direct Modbus mapping');
}

function fromModbus(addr) {
  const n = +addr.replace(/\D/g, '');
  if (!Number.isInteger(n) || n < 1) throw new Error('Enter a Modbus reference such as 40001 or 400001');
  const six = n >= 100000;
  const digit = Math.floor(n / (six ? 100000 : 10000));
  const starts = { 0: 1, 1: six ? 100001 : 10001, 3: six ? 300001 : 30001, 4: six ? 400001 : 40001 };
  const fam = digit === 0 ? 0 : digit;
  if (!(fam in starts)) throw new Error('Reference must start with 0, 1, 3 or 4');
  return { family: fam, offset: n - starts[fam], note: 'Reference numbers are one-based; protocol addresses are zero-based.' };
}

export function parseAddress(vendor, text) {
  const addr = String(text).trim();
  if (!addr) throw new Error('Enter an address');
  switch (vendor) {
    case 'schneider': return fromSchneider(addr);
    case 'siemens': return fromSiemens(addr);
    case 'ab': return fromAb(addr);
    case 'modbus': return fromModbus(addr);
    default: throw new Error('Unknown vendor');
  }
}

export function toNotations({ family, offset }) {
  const fam = { 0: 'coil', 1: 'discrete input', 3: 'input register', 4: 'holding register' }[family];
  const five = { 0: 1, 1: 10001, 3: 30001, 4: 40001 }[family] + offset;
  const six = { 0: 1, 1: 100001, 3: 300001, 4: 400001 }[family] + offset;
  const out = { family: fam, offset, hex: `0x${offset.toString(16).toUpperCase().padStart(4, '0')}`, modbus5: five, modbus6: six };
  if (family === 4) { out.schneider = `%MW${offset}`; out.ab = `N7:${offset}`; out.siemens = `DBW${offset * 2} (in a DB) / MW${offset * 2}`; }
  else if (family === 3) { out.schneider = `%IW${offset}`; out.siemens = `IW${offset * 2}`; }
  else if (family === 0) { out.schneider = `%M${offset}`; out.ab = `B3:${Math.floor(offset / 16)}/${offset % 16}`; out.siemens = `M${Math.floor(offset / 8)}.${offset % 8}`; }
  else if (family === 1) { out.schneider = `%I${offset}`; out.ab = `I:${Math.floor(offset / 16)}/${offset % 16}`; out.siemens = `I${Math.floor(offset / 8)}.${offset % 8}`; }
  return out;
}
