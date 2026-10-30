import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, variablesIn } from '../src/lib/expr.js';
import { convert } from '../src/lib/units.js';
import { parseIp, ipToString, subnet, vlsm, prefixFromMask } from '../src/lib/ipv4.js';
import { parseIpv6, expand, compress, subnet6 } from '../src/lib/ipv6.js';
import { crc32, crc16Modbus, crc16CcittFalse, lrc, xorChecksum, hex } from '../src/lib/crc.js';
import { referenceToOffset, buildPdu, buildRtu, buildTcp, decodeFrame } from '../src/lib/modbus.js';
import { decode32, encode32, parseWords } from '../src/lib/registers.js';
import { scale, namurStatus, loopBudget, wireResistance } from '../src/lib/scaling.js';
import { loan, markup } from '../src/lib/finance.js';
import { describe } from '../src/lib/stats.js';
import { parseBase, toGray, fromGray, toBcd, fromBcd } from '../src/lib/base.js';
import { encodeBase64, decodeBase64, base32ToBytes } from '../src/lib/base64.js';
import { decodeJwt } from '../src/lib/jwt.js';
import { rtdResistance, rtdTemperature } from '../src/lib/rtd.js';
import { mvToCelsius, celsiusToMv } from '../src/lib/thermocouple.js';
import { ohm, threePhase, resistorFromBands, voltageDrop, motor, mwToDbm } from '../src/lib/electrical.js';
import { oee } from '../src/lib/oee.js';
import { describeCron, nextRuns, parseCron } from '../src/lib/cron.js';
import { macInfo } from '../src/lib/mac.js';
import { baseScore, parseVector } from '../src/lib/cvss.js';
import { hotp, totp } from '../src/lib/totp.js';
import { diffLines, diffStats } from '../src/lib/diff.js';
import { generatePassword, analyzePassword, randomInt } from '../src/lib/password.js';
import { parseTimestamp, toLocalInputValue, isoWeek } from '../src/lib/timestamp.js';
import { hexdump, extractStrings } from '../src/lib/hexdump.js';
import { parseCsv, toCsv } from '../src/lib/csv.js';
import { topicMatches, validateTopicFilter } from '../src/lib/mqtt.js';
import { parseAddress, toNotations } from '../src/lib/plc.js';
import { transferTime, iotBudget } from '../src/lib/bandwidth.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('expression evaluator', () => {
  assert.equal(evaluate('2*3'), 6);
  assert.equal(evaluate('2×3'), 6);
  assert.equal(evaluate('6÷2'), 3);
  assert.equal(evaluate('-2^2'), -4); // unary minus binds looser than ^
  assert.equal(evaluate('2^3^2'), 512); // right associative
  close(evaluate('sin(30) + sqrt(16) * 2'), 8.5);
  close(evaluate('cos(60)'), 0.5);
  close(evaluate('tan(45)'), 1);
  close(evaluate('sin(pi/2)', { radians: true }), 1);
  assert.equal(evaluate('1e3'), 1000);
  assert.equal(evaluate('log(1000)'), 3);
  close(evaluate('ln(e)'), 1);
  assert.equal(evaluate('fact(5)'), 120);
  assert.equal(evaluate('2(3)'.replace('2(', '2*(')), 6);
  assert.equal(evaluate('a*b+c', { variables: { a: 2, b: 3, c: 4 } }), 10);
  assert.deepEqual(variablesIn('a*b+sin(x)+pi'), ['a', 'b', 'x']);
  assert.throws(() => evaluate('2(3)'), /Missing operator/);
  assert.throws(() => evaluate('1/0'), /not finite/);
  assert.throws(() => evaluate('foo(1)'), /Unknown function/);
  assert.throws(() => evaluate('(1+2'), /Unbalanced/);
  assert.throws(() => evaluate('2+'), /ends with an operator/);
  assert.throws(() => evaluate('alert(1)'), /Unknown function/);
});

test('unit conversion', () => {
  close(convert('Length', 1, 'mile', 'kilometre'), 1.609344);
  close(convert('Pressure', 1, 'bar', 'psi'), 14.5037738, 1e-6);
  close(convert('Temperature', 100, 'Celsius', 'Fahrenheit'), 212);
  close(convert('Temperature', 0, 'Kelvin', 'Celsius'), -273.15);
  close(convert('Data size', 1, 'gibibyte', 'megabyte'), 1073.741824);
  assert.throws(() => convert('Length', NaN, 'metre', 'foot'));
});

test('ipv4', () => {
  assert.equal(ipToString(parseIp('192.168.10.15')), '192.168.10.15');
  assert.throws(() => parseIp('010.1.1.1'), /leading zeros/);
  assert.throws(() => parseIp('256.1.1.1'));
  const s = subnet(parseIp('192.168.10.15'), 24);
  assert.equal(ipToString(s.network), '192.168.10.0');
  assert.equal(ipToString(s.broadcast), '192.168.10.255');
  assert.equal(s.usable, 254);
  assert.equal(ipToString(s.wildcard), '0.0.0.255');
  assert.equal(subnet(parseIp('10.0.0.0'), 31).usable, 2);
  assert.equal(subnet(parseIp('10.0.0.1'), 32).usable, 1);
  assert.equal(prefixFromMask('255.255.255.192'), 26);
  assert.throws(() => prefixFromMask('255.0.255.0'), /contiguous/);
  const v = vlsm('192.168.0.0/24', [{ name: 'A', hosts: 100 }, { name: 'B', hosts: 50 }, { name: 'C', hosts: 2 }]);
  assert.equal(v.subnets[0].prefix, 25);
  assert.equal(v.subnets[1].prefix, 26);
  assert.equal(v.subnets[2].prefix, 30);
  assert.equal(ipToString(v.subnets[1].network), '192.168.0.128');
});

test('ipv6', () => {
  assert.equal(expand(parseIpv6('2001:db8::1')), '2001:0db8:0000:0000:0000:0000:0000:0001');
  assert.equal(compress(parseIpv6('2001:0db8:0000:0000:0000:0000:0000:0001')), '2001:db8::1');
  assert.equal(compress(parseIpv6('::ffff:192.0.2.1')), '::ffff:c000:201');
  assert.equal(compress(parseIpv6('1:0:0:1:0:0:0:1')), '1:0:0:1::1');
  const s = subnet6('2001:db8:abcd:1234::1/64');
  assert.equal(s.networkCompressed, '2001:db8:abcd:1234::');
  assert.equal(s.lastCompressed, '2001:db8:abcd:1234:ffff:ffff:ffff:ffff');
  assert.throws(() => parseIpv6('1::2::3'));
});

test('checksums', () => {
  assert.equal(hex(crc32('123456789'), 8), 'CBF43926');
  assert.equal(hex(crc16Modbus('123456789'), 4), '4B37');
  assert.equal(hex(crc16CcittFalse('123456789'), 4), '29B1');
  assert.equal(lrc(Uint8Array.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x0a])), 0xf2);
  assert.equal(xorChecksum('GPGGA,123519,4807.038,N'), 'GPGGA,123519,4807.038,N'.split('').reduce((x, c) => x ^ c.charCodeAt(0), 0));
});

test('modbus', () => {
  assert.equal(referenceToOffset(4, 40001).offset, 0);
  assert.equal(referenceToOffset(4, 400001).offset, 0);
  assert.equal(referenceToOffset(3, 30010).offset, 9);
  assert.throws(() => referenceToOffset(4, 30001), /run from/);
  const pdu = buildPdu({ fc: 3, address: 0, quantity: 10 });
  const rtu = buildRtu(1, pdu);
  assert.equal([...rtu].map(b => hex(b, 2)).join(' '), '01 03 00 00 00 0A C5 CD');
  const tcp = buildTcp(1, pdu, 1);
  assert.equal([...tcp].map(b => hex(b, 2)).join(' '), '00 01 00 00 00 06 01 03 00 00 00 0A');
  const d = decodeFrame('01 03 00 00 00 0A C5 CD', 'rtu');
  assert.equal(d.crcOk, true);
  assert.equal(d.unitId, 1);
  const bad = decodeFrame('01 03 00 00 00 0A C5 CE', 'rtu');
  assert.equal(bad.crcOk, false);
  const ex = decodeFrame('00 01 00 00 00 03 01 83 02', 'tcp');
  assert.equal(ex.exception, true);
});

test('register types', () => {
  // 1.0f = 0x3F800000
  assert.equal(decode32([0x3f80, 0x0000], 'ABCD').float32, 1);
  assert.equal(decode32([0x0000, 0x3f80], 'CDAB').float32, 1);
  assert.equal(decode32([0x803f, 0x0000], 'BADC').float32, 1);
  assert.equal(decode32([0x0000, 0x803f], 'DCBA').float32, 1);
  assert.deepEqual(encode32(1, 'float32', 'CDAB'), [0x0000, 0x3f80]);
  assert.equal(decode32([0xffff, 0xffff]).int32, -1);
  assert.deepEqual(parseWords('0x3F80 0'), [0x3f80, 0]);
  assert.throws(() => parseWords('70000'));
});

test('scaling and loops', () => {
  assert.equal(scale(12, 4, 20, 0, 100), 50);
  assert.equal(scale(50, 0, 100, 4, 20), 12);
  assert.equal(scale(0, 100, 0, 4, 20), 20); // inverted range
  assert.equal(namurStatus(3.5).level, 'fault');
  assert.equal(namurStatus(12).level, 'ok');
  assert.equal(namurStatus(20.3).level, 'warn');
  const lb = loopBudget({ supply: 24, transmitterMin: 12, loads: [250, 50], wireResistance: 20 });
  assert.equal(lb.ok, true);
  close(lb.maxLoad, 600);
  close(wireResistance({ lengthM: 100, areaMm2: 1.5, loop: true }), 2.2933, 1e-3);
});

test('finance', () => {
  const l = loan({ principal: 10000, annualRate: 8, months: 36 });
  close(l.payment, 313.36, 0.01);
  assert.equal(l.schedule.length, 36);
  close(l.schedule[35].balance, 0, 0.01);
  assert.throws(() => loan({ principal: -5, annualRate: 8, months: 36 }));
  const m = markup({ cost: 100, markupPct: 30 });
  close(m.marginPct, 23.0769, 1e-3);
  assert.throws(() => markup({ cost: 0, markupPct: 30 }));
});

test('statistics', () => {
  const d = describe([12, 15, 18, 22, 24, 29]);
  assert.equal(d.mean, 20);
  assert.equal(d.median, 20);
  close(d.popStdDev, 5.6862, 1e-3);
  close(d.sampleStdDev, 6.2290, 1e-3);
});

test('bases, gray, bcd', () => {
  assert.equal(parseBase('ff', 16), 255n);
  assert.equal(parseBase('0b1010', 2), 10n);
  assert.throws(() => parseBase('12', 2));
  assert.equal(toGray(5n), 7n);
  assert.equal(fromGray(7n), 5n);
  assert.equal(toBcd(42n), '0100 0010');
  assert.equal(fromBcd('0100 0010'), 42n);
});

test('base64 / base32', () => {
  assert.equal(encodeBase64('ação'), 'YcOnw6Nv');
  assert.equal(decodeBase64('YcOnw6Nv'), 'ação');
  assert.equal(encodeBase64('ação', { url: true }), 'YcOnw6Nv');
  assert.throws(() => decodeBase64('%%%'), /alphabet/);
  assert.throws(() => decodeBase64('/w=='), /UTF-8/);
  assert.equal(new TextDecoder().decode(base32ToBytes('GEZDGNBVGY3TQOJQ')), '1234567890');
});

test('jwt', () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const j = decodeJwt('Bearer ' + token);
  assert.equal(j.payload.name, 'John Doe');
  assert.equal(j.header.alg, 'HS256');
  assert.equal(j.times[0].claim, 'iat');
  assert.throws(() => decodeJwt('abc'), /three dot-separated/);
});

test('rtd', () => {
  close(rtdResistance(0), 100);
  close(rtdResistance(100), 138.5055, 1e-3);
  close(rtdResistance(-50), 80.3063, 1e-3);
  close(rtdTemperature(138.5055), 100, 1e-3);
  close(rtdTemperature(80.3063), -50, 1e-3);
  close(rtdResistance(100, 1000), 1385.055, 1e-2);
});

test('thermocouple', () => {
  close(mvToCelsius('K', 4.096), 100, 0.1);
  close(mvToCelsius('J', 5.269), 100, 0.1);
  close(mvToCelsius('T', 4.279), 100, 0.1);
  close(mvToCelsius('K', 41.276), 1000, 0.5);
  close(celsiusToMv('K', 100), 4.096, 0.005);
  close(celsiusToMv('K', -100), -3.554, 0.01);
  close(celsiusToMv('E', 100), 6.319, 0.01);
  close(celsiusToMv('N', 100), 2.774, 0.01);
  assert.throws(() => mvToCelsius('K', 99));
});

test('electrical', () => {
  const o = ohm({ V: 24, R: 12 });
  assert.equal(o.I, 2); assert.equal(o.P, 48);
  assert.throws(() => ohm({ V: 24 }));
  const t = threePhase({ vLine: 380, iLine: 10, pf: 0.85 });
  close(t.kVA, 6.5818, 1e-3);
  close(t.kW, 5.5945, 1e-3);
  assert.equal(resistorFromBands(['yellow', 'violet', 'red', 'gold']).value, 4700);
  assert.equal(resistorFromBands(['brown', 'black', 'black', 'red', 'brown']).value, 10000);
  const vd = voltageDrop({ volts: 24, amps: 2, lengthM: 50, areaMm2: 1.5 });
  close(vd.drop, 2.2933, 1e-3);
  assert.equal(motor({ hz: 60, poles: 4, rpmActual: 1750 }).syncRpm, 1800);
  close(motor({ hz: 60, poles: 4, rpmActual: 1750 }).slipPct, 2.7778, 1e-3);
  close(mwToDbm(1), 0);
});

test('oee', () => {
  const r = oee({ plannedMin: 480, downtimeMin: 60, idealCycleSec: 1, totalCount: 19271, goodCount: 18848 });
  close(r.availability, 0.875, 1e-4);
  close(r.performance, 0.7647, 1e-3);
  close(r.quality, 0.978, 1e-3);
  close(r.oee, 0.6544, 1e-3);
});

test('cron', () => {
  assert.equal(describeCron('0 9 * * 1-5'), 'at 09:00, on Monday, Tuesday, Wednesday, Thursday, Friday');
  assert.equal(describeCron('*/15 * * * *'), 'every 15 minutes');
  assert.equal(describeCron('@daily'), 'at 00:00');
  const runs = nextRuns('30 8 * * *', 2, new Date(2026, 0, 1, 10, 0));
  assert.equal(runs[0].getDate(), 2); assert.equal(runs[0].getHours(), 8); assert.equal(runs[0].getMinutes(), 30);
  assert.equal(runs[1].getDate(), 3);
  assert.throws(() => parseCron('61 * * * *'));
  assert.throws(() => parseCron('* * * *'));
});

test('mac', () => {
  const m = macInfo('b8-27-eb-12-34-56');
  assert.equal(m.formats.colon, 'B8:27:EB:12:34:56');
  assert.equal(m.formats.cisco, 'b827.eb12.3456');
  assert.equal(m.vendor, 'Raspberry Pi Foundation');
  assert.equal(m.multicast, false);
  assert.equal(macInfo('01:00:5e:00:00:01').multicast, true);
  assert.equal(macInfo('02:42:ac:11:00:02').locallyAdministered, true);
  assert.equal(m.eui64LinkLocal, 'fe80::ba27:ebff:fe12:3456');
});

test('cvss 3.1', () => {
  // CVE-2021-44228 (Log4Shell): AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H = 10.0
  assert.equal(baseScore(parseVector('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H')).score, 10);
  // AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8
  assert.equal(baseScore(parseVector('AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')).score, 9.8);
  // AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N = 5.5
  assert.equal(baseScore(parseVector('AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N')).score, 5.5);
  assert.equal(baseScore(parseVector('AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N')).score, 0);
});

test('hotp / totp (RFC 4226 / 6238 vectors)', async () => {
  const secret = new TextEncoder().encode('12345678901234567890');
  assert.equal(await hotp(secret, 0), '755224');
  assert.equal(await hotp(secret, 1), '287082');
  assert.equal(await hotp(secret, 9), '520489');
  // RFC 6238: time 59 s, SHA-1, 8 digits -> 94287082
  const r = await totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', { digits: 8, now: 59 * 1000 });
  assert.equal(r.code, '94287082');
});

test('diff', () => {
  const d = diffLines('a\nb\nc', 'a\nc\nd');
  assert.deepEqual(diffStats(d), { added: 1, removed: 1, same: 2 });
  assert.equal(d.find(x => x.type === 'del').text, 'b');
});

test('password', () => {
  const p = generatePassword(20, { upper: true, lower: true, digits: true, symbols: true });
  assert.equal(p.length, 20);
  assert.ok(/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^a-zA-Z0-9]/.test(p));
  const np = generatePassword(16, { upper: true, lower: true, digits: true, symbols: false, excludeAmbiguous: true });
  assert.ok(!/[0O1lI]/.test(np));
  for (let i = 0; i < 1000; i++) { const r = randomInt(7); assert.ok(r >= 0 && r < 7); }
  assert.equal(analyzePassword('password123').rating, 'very weak');
  assert.ok(analyzePassword('xK9#mP2$vL5@nQ8!').entropyBits > 80);
});

test('timestamp', () => {
  assert.equal(parseTimestamp('1767225600').unit, 'seconds');
  assert.equal(parseTimestamp('1767225600000').unit, 'milliseconds');
  assert.equal(parseTimestamp('1767225600').date.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.throws(() => parseTimestamp('abc'));
  assert.throws(() => parseTimestamp('9'.repeat(30)));
  const d = new Date(2026, 0, 5, 9, 7, 3);
  assert.equal(toLocalInputValue(d), '2026-01-05T09:07:03');
  assert.equal(isoWeek(new Date(2026, 0, 1)), 1);
  assert.equal(isoWeek(new Date(2027, 0, 1)), 53);
});

test('hexdump', () => {
  const bytes = new TextEncoder().encode('Hello, world!');
  assert.ok(hexdump(bytes).startsWith('00000000  48 65 6c 6c 6f'));
  assert.equal(extractStrings(Uint8Array.from([0, 65, 66, 67, 68, 0, 1]), 4)[0].text, 'ABCD');
});

test('csv', () => {
  const rows = parseCsv('name,qty\n"Valve, 2""",3\nPump,4');
  assert.deepEqual(rows, [{ name: 'Valve, 2"', qty: 3 }, { name: 'Pump', qty: 4 }]);
  assert.equal(toCsv(rows), 'name,qty\n"Valve, 2""",3\nPump,4');
});

test('mqtt', () => {
  assert.equal(topicMatches('plant/+/temp', 'plant/line1/temp'), true);
  assert.equal(topicMatches('plant/#', 'plant/line1/temp'), true);
  assert.equal(topicMatches('plant/+', 'plant/line1/temp'), false);
  assert.equal(topicMatches('#', '$SYS/broker'), false);
  assert.throws(() => validateTopicFilter('plant/#/x'));
  assert.throws(() => validateTopicFilter('plant/a+'));
});

test('plc addresses', () => {
  assert.deepEqual([parseAddress('schneider', '%MW10').family, parseAddress('schneider', '%MW10').offset], [4, 10]);
  assert.equal(toNotations(parseAddress('schneider', '%MW10')).modbus5, 40011);
  assert.equal(toNotations(parseAddress('ab', 'N7:5')).modbus5, 40006);
  assert.equal(toNotations(parseAddress('siemens', 'DB1.DBW20')).modbus5, 40011);
  assert.equal(toNotations(parseAddress('modbus', '400011')).schneider, '%MW10');
  assert.throws(() => parseAddress('siemens', 'DB1.DBW21'), /even/);
});

test('bandwidth', () => {
  close(transferTime({ size: 1, sizeUnit: 'GB', rate: 100, rateUnit: 'Mbit/s' }).seconds, 80);
  const b = iotBudget({ devices: 100, payloadBytes: 200, intervalSec: 60 });
  assert.equal(b.messagesPerDay, 1440);
  assert.equal(b.totalMonth, 200 * 1440 * 30 * 100);
});
