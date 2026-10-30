/* Modbus helpers: reference numbers, function codes, RTU/TCP frames. */
import { crc16Modbus, parseHexBytes, hex } from './crc.js';

export const families = {
  0: { name: 'Coil', start: 1, read: 'FC01', write: 'FC05 / FC15', bits: true },
  1: { name: 'Discrete input', start: 10001, read: 'FC02', write: '— (read-only)', bits: true },
  3: { name: 'Input register', start: 30001, read: 'FC04', write: '— (read-only)', bits: false },
  4: { name: 'Holding register', start: 40001, read: 'FC03', write: 'FC06 / FC16', bits: false },
};

export const functionCodes = {
  1: 'Read Coils', 2: 'Read Discrete Inputs', 3: 'Read Holding Registers', 4: 'Read Input Registers',
  5: 'Write Single Coil', 6: 'Write Single Register', 15: 'Write Multiple Coils', 16: 'Write Multiple Registers',
  23: 'Read/Write Multiple Registers',
};

export const exceptionCodes = {
  1: 'Illegal Function', 2: 'Illegal Data Address', 3: 'Illegal Data Value', 4: 'Slave Device Failure',
  5: 'Acknowledge', 6: 'Slave Device Busy', 8: 'Memory Parity Error', 10: 'Gateway Path Unavailable', 11: 'Gateway Target Failed to Respond',
};

/** Convert a human reference (40001 or 400001) into a zero-based protocol offset. */
export function referenceToOffset(family, reference) {
  const f = families[family];
  if (!f) throw new Error('Unknown register family');
  const n = Number(reference);
  if (!Number.isInteger(n)) throw new Error('Enter an integer reference number');
  // 6-digit notation: 400001 → 40001 style with 65536 range
  const sixDigit = n >= 100000;
  const start = sixDigit ? f.start * 10 - 9 : f.start; // 1→1, 10001→100001, 30001→300001, 40001→400001
  const max = start + (sixDigit ? 65535 : 9998);
  if (n < start || n > max) throw new Error(`${f.name} references run from ${start} to ${max}`);
  return { offset: n - start, sixDigit, ...f };
}

export function offsetToReference(family, offset, sixDigit = false) {
  const f = families[family];
  if (!f) throw new Error('Unknown register family');
  if (!Number.isInteger(offset) || offset < 0 || offset > 65535) throw new Error('Offset must be 0–65535');
  const start = sixDigit ? f.start * 10 - 9 : f.start;
  return start + offset;
}

/** Build a request PDU for the common read/write-single functions. */
export function buildPdu({ fc, address, quantity = 1, value = 0 }) {
  const pdu = [fc];
  if (![1, 2, 3, 4, 5, 6].includes(fc)) throw new Error('Supported request functions: 1, 2, 3, 4, 5, 6');
  if (!Number.isInteger(address) || address < 0 || address > 65535) throw new Error('Address must be 0–65535');
  pdu.push(address >> 8, address & 255);
  if (fc <= 4) {
    const max = fc <= 2 ? 2000 : 125;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > max) throw new Error(`Quantity must be 1–${max} for FC${hex(fc, 2)}`);
    pdu.push(quantity >> 8, quantity & 255);
  } else {
    const v = fc === 5 ? (value ? 0xff00 : 0x0000) : value;
    if (!Number.isInteger(v) || v < 0 || v > 65535) throw new Error('Value must be 0–65535');
    pdu.push(v >> 8, v & 255);
  }
  return Uint8Array.from(pdu);
}

export function buildRtu(unitId, pdu) {
  const body = Uint8Array.from([unitId, ...pdu]);
  const crc = crc16Modbus(body);
  return Uint8Array.from([...body, crc & 255, crc >> 8]); // CRC low byte first
}

export function buildTcp(unitId, pdu, transactionId = 1) {
  const len = pdu.length + 1;
  return Uint8Array.from([transactionId >> 8, transactionId & 255, 0, 0, len >> 8, len & 255, unitId, ...pdu]);
}

function describePdu(pdu) {
  const fc = pdu[0];
  const fields = [];
  if (fc & 0x80) {
    fields.push(['Exception response for', `FC${hex(fc & 0x7f, 2)} ${functionCodes[fc & 0x7f] || ''}`]);
    fields.push(['Exception code', `${pdu[1]} — ${exceptionCodes[pdu[1]] || 'Unknown'}`]);
    return { fc, exception: true, fields };
  }
  fields.push(['Function', `${fc} (0x${hex(fc, 2)}) — ${functionCodes[fc] || 'Unknown / vendor specific'}`]);
  const word = i => (pdu[i] << 8) | pdu[i + 1];
  if ([1, 2, 3, 4].includes(fc) && pdu.length === 5) {
    fields.push(['Starting address', `${word(1)} (0x${hex(word(1), 4)})`], ['Quantity', word(3)]);
  } else if ([1, 2, 3, 4].includes(fc) && pdu.length >= 2 && pdu[1] === pdu.length - 2) {
    fields.push(['Byte count', pdu[1]], ['Data', [...pdu.slice(2)].map(b => hex(b, 2)).join(' ')]);
    if (fc >= 3) fields.push(['Registers', Array.from({ length: pdu[1] / 2 }, (_, i) => word(2 + i * 2)).join(', ')]);
  } else if ([5, 6].includes(fc) && pdu.length === 5) {
    fields.push(['Address', `${word(1)} (0x${hex(word(1), 4)})`], ['Value', fc === 5 ? (word(3) === 0xff00 ? 'ON (0xFF00)' : word(3) === 0 ? 'OFF (0x0000)' : `0x${hex(word(3), 4)} (invalid)`) : `${word(3)} (0x${hex(word(3), 4)})`]);
  } else if ([15, 16].includes(fc) && pdu.length >= 6) {
    fields.push(['Starting address', word(1)], ['Quantity', word(3)]);
    if (pdu.length > 5) fields.push(['Byte count', pdu[5]], ['Data', [...pdu.slice(6)].map(b => hex(b, 2)).join(' ')]);
  } else {
    fields.push(['Data', [...pdu.slice(1)].map(b => hex(b, 2)).join(' ') || '(none)']);
  }
  return { fc, exception: false, fields };
}

/** Decode a frame; `mode` is 'rtu' or 'tcp'. */
export function decodeFrame(hexText, mode) {
  const bytes = parseHexBytes(hexText);
  if (mode === 'rtu') {
    if (bytes.length < 4) throw new Error('An RTU frame needs at least 4 bytes');
    const body = bytes.slice(0, -2);
    const got = bytes[bytes.length - 2] | (bytes[bytes.length - 1] << 8);
    const want = crc16Modbus(body);
    return { mode, unitId: bytes[0], crcOk: got === want, crcGot: got, crcWant: want, ...describePdu(body.slice(1)) };
  }
  if (bytes.length < 8) throw new Error('A Modbus TCP frame needs at least 8 bytes (MBAP + function)');
  const tid = (bytes[0] << 8) | bytes[1], pid = (bytes[2] << 8) | bytes[3], len = (bytes[4] << 8) | bytes[5];
  return { mode, transactionId: tid, protocolId: pid, length: len, lengthOk: len === bytes.length - 6, unitId: bytes[6], ...describePdu(bytes.slice(7)) };
}
