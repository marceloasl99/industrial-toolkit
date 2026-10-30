/* Transfer time and IoT data budget helpers. */
export const sizeUnits = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 };
export const rateUnits = { 'bit/s': 1, 'kbit/s': 1e3, 'Mbit/s': 1e6, 'Gbit/s': 1e9, 'B/s': 8, 'KB/s': 8e3, 'MB/s': 8e6 };

export function transferTime({ size, sizeUnit, rate, rateUnit, overheadPct = 0 }) {
  if (!(size > 0 && rate > 0)) throw new Error('Size and rate must be positive');
  const bits = size * sizeUnits[sizeUnit] * 8 * (1 + overheadPct / 100);
  const bps = rate * rateUnits[rateUnit];
  const seconds = bits / bps;
  return { seconds, bits, bps, text: formatDuration(seconds) };
}

export function formatDuration(s) {
  if (s < 1) return `${(s * 1000).toFixed(1)} ms`;
  if (s < 60) return `${s.toFixed(2)} s`;
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = Math.round(s % 60);
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h ${m} min`;
  return `${h ? h + ' h ' : ''}${m} min ${sec} s`;
}

/** Monthly data for N devices publishing payload bytes every interval seconds. */
export function iotBudget({ devices, payloadBytes, intervalSec, overheadBytes = 0, daysPerMonth = 30 }) {
  if (!(devices > 0 && payloadBytes >= 0 && intervalSec > 0)) throw new Error('Enter positive values');
  const perMessage = payloadBytes + overheadBytes;
  const perDeviceDay = perMessage * (86400 / intervalSec);
  const perDeviceMonth = perDeviceDay * daysPerMonth;
  return { perMessage, messagesPerDay: 86400 / intervalSec, perDeviceDay, perDeviceMonth, totalMonth: perDeviceMonth * devices, avgBps: perMessage * 8 * devices / intervalSec };
}

export function formatBytes(b) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; }
  return `${b.toFixed(b < 10 ? 2 : 1)} ${u[i]}`;
}
