/* 5-field cron parser (minute hour day-of-month month day-of-week) with next-run calculation. */
const FIELDS = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] },
  { name: 'day of week', min: 0, max: 7, names: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
];
const ALIASES = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseField(text, spec) {
  const set = new Set();
  const toNum = tok => {
    const t = tok.toLowerCase();
    if (spec.names) { const i = spec.names.indexOf(t); if (i !== -1) return spec.min + i; }
    if (!/^\d+$/.test(t)) throw new Error(`"${tok}" is not valid in the ${spec.name} field`);
    return +t;
  };
  for (const part of text.split(',')) {
    const m = part.match(/^(\*|[a-z0-9]+(?:-[a-z0-9]+)?)(?:\/(\d+))?$/i);
    if (!m) throw new Error(`Cannot parse "${part}" in the ${spec.name} field`);
    let lo, hi;
    if (m[1] === '*') { lo = spec.min; hi = spec.max; }
    else if (m[1].includes('-')) { [lo, hi] = m[1].split('-').map(toNum); }
    else { lo = toNum(m[1]); hi = m[2] ? spec.max : lo; }
    const step = m[2] ? +m[2] : 1;
    if (step < 1) throw new Error('Step must be at least 1');
    if (lo < spec.min || hi > spec.max || lo > hi) throw new Error(`Value out of range in the ${spec.name} field (${spec.min}–${spec.max})`);
    for (let v = lo; v <= hi; v += step) set.add(v);
  }
  if (spec.name === 'day of week' && set.has(7)) { set.delete(7); set.add(0); }
  return { set, all: text.startsWith('*') && !text.includes('/') };
}

export function parseCron(expr) {
  let s = String(expr).trim();
  if (ALIASES[s]) s = ALIASES[s];
  const parts = s.split(/\s+/);
  if (parts.length !== 5) throw new Error('Expected 5 fields: minute hour day-of-month month day-of-week');
  return { fields: parts.map((p, i) => parseField(p, FIELDS[i])), raw: parts };
}

export function describeCron(expr) {
  const { fields, raw } = parseCron(expr);
  const [min, hour, dom, mon, dow] = fields;
  const list = (set, fmt = x => x) => [...set].sort((a, b) => a - b).map(fmt).join(', ');
  let when;
  if (min.set.size === 1 && hour.set.size === 1) when = `at ${String([...hour.set][0]).padStart(2, '0')}:${String([...min.set][0]).padStart(2, '0')}`;
  else if (min.all && hour.all) when = 'every minute';
  else if (raw[0].startsWith('*/') && hour.all) when = `every ${raw[0].slice(2)} minutes`;
  else if (min.set.size === 1 && hour.all) when = `at minute ${[...min.set][0]} of every hour`;
  else if (min.set.size === 1 && raw[1].startsWith('*/')) when = `every ${raw[1].slice(2)} hours at minute ${[...min.set][0]}`;
  else when = `at minute(s) ${list(min.set)} past hour(s) ${list(hour.set)}`;
  const parts = [when];
  if (!dom.all) parts.push(`on day(s) ${list(dom.set)} of the month`);
  if (!dow.all) parts.push(`on ${list(dow.set, d => DAYS[d])}`);
  if (!mon.all) parts.push(`in ${list(mon.set, m => MONTHS[m - 1])}`);
  return parts.join(', ');
}

/** Next N occurrences after `from` (Date), evaluated in local time. */
export function nextRuns(expr, count = 5, from = new Date()) {
  const { fields } = parseCron(expr);
  const [min, hour, dom, mon, dow] = fields;
  const out = [];
  const d = new Date(from); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
  const limit = 366 * 24 * 60 * 5; // 5 years of minutes
  for (let i = 0; i < limit && out.length < count; i++) {
    if (!mon.set.has(d.getMonth() + 1)) { d.setMonth(d.getMonth() + 1, 1); d.setHours(0, 0, 0, 0); continue; }
    // standard cron: if both dom and dow are restricted, match either
    const domOk = dom.set.has(d.getDate()), dowOk = dow.set.has(d.getDay());
    const dayOk = dom.all && dow.all ? true : dom.all ? dowOk : dow.all ? domOk : (domOk || dowOk);
    if (!dayOk) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
    if (!hour.set.has(d.getHours())) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
    if (!min.set.has(d.getMinutes())) { d.setMinutes(d.getMinutes() + 1); continue; }
    out.push(new Date(d));
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}
