/* Generates assets/icon-192.png, icon-512.png and icon-512-maskable.png without any dependency. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(out, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const BG = [11, 32, 52], FG = [55, 215, 160];
/* Same mark as favicon.svg: F built from rectangles on a 64-unit grid. */
const inF = (u, v) => (u >= 17 && u < 27 && v >= 13 && v < 55) || (u >= 17 && u < 47 && v >= 13 && v < 22) || (u >= 27 && u < 43 && v >= 31 && v < 40);

function make(size, { maskable = false }) {
  const pad = maskable ? 0.18 : 0; // maskable icons keep content inside the safe zone
  const radius = maskable ? 0 : size * 14 / 64;
  return png(size, (x, y) => {
    // rounded-rect background
    const dx = Math.max(radius - x, x - (size - 1 - radius), 0), dy = Math.max(radius - y, y - (size - 1 - radius), 0);
    if (!maskable && Math.hypot(dx, dy) > radius) return [0, 0, 0, 0];
    const u = ((x / size) - pad) / (1 - 2 * pad) * 64, v = ((y / size) - pad) / (1 - 2 * pad) * 64;
    return inF(u, v) ? [...FG, 255] : [...BG, 255];
  });
}

writeFileSync(join(out, 'icon-192.png'), make(192, {}));
writeFileSync(join(out, 'icon-512.png'), make(512, {}));
writeFileSync(join(out, 'icon-512-maskable.png'), make(512, { maskable: true }));
console.log('icons written to', out);
