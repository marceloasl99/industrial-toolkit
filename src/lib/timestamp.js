/* Timestamp conversion helpers. */

/** Accepts seconds, milliseconds, microseconds or nanoseconds and returns a Date plus the detected unit. */
export function parseTimestamp(text) {
  const s = String(text).trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new Error('Enter a numeric timestamp');
  const n = Number(s);
  const abs = Math.abs(n);
  let unit, ms;
  if (abs < 1e11) { unit = 'seconds'; ms = n * 1000; }
  else if (abs < 1e14) { unit = 'milliseconds'; ms = n; }
  else if (abs < 1e17) { unit = 'microseconds'; ms = n / 1000; }
  else { unit = 'nanoseconds'; ms = n / 1e6; }
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) throw new Error('Timestamp is outside the representable date range');
  return { date: d, unit };
}

export function parseDateInput(text) {
  const s = String(text).trim();
  if (!s) throw new Error('Enter a date');
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Unrecognised date format');
  return d;
}

const pad = n => String(n).padStart(2, '0');

/** Local wall-clock value suitable for <input type="datetime-local" step="1">. */
export function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function relativeTime(d, now = new Date()) {
  const diff = (d.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  const units = [['year', 31557600], ['month', 2629800], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  for (const [name, s] of units) {
    if (abs >= s || name === 'second') {
      const v = Math.round(abs / s);
      const label = `${v} ${name}${v === 1 ? '' : 's'}`;
      return diff < 0 ? `${label} ago` : `in ${label}`;
    }
  }
}

export function describeDate(d) {
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const off = `${sign}${pad(Math.floor(Math.abs(offsetMin) / 60))}:${pad(Math.abs(offsetMin) % 60)}`;
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const week = isoWeek(d);
  return {
    unixSeconds: Math.floor(d.getTime() / 1000), unixMs: d.getTime(),
    iso: d.toISOString(), utc: d.toUTCString(), local: d.toLocaleString(), localIsoLike: `${toLocalInputValue(d)}${off}`,
    offset: off, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, dayOfYear, isoWeek: week,
    weekday: d.toLocaleDateString('en-US', { weekday: 'long' }), relative: relativeTime(d),
  };
}

export function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
}

export function durationBetween(a, b) {
  const ms = Math.abs(b - a);
  const days = Math.floor(ms / 86400000), hours = Math.floor(ms / 3600000) % 24, minutes = Math.floor(ms / 60000) % 60, seconds = Math.floor(ms / 1000) % 60;
  return { ms, days, hours, minutes, seconds, text: `${days}d ${hours}h ${minutes}m ${seconds}s` };
}
