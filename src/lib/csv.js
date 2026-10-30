/* CSV <-> JSON with RFC 4180 quoting. */
export function parseCsv(text, { delimiter = ',', header = true } = {}) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const s = String(text).replace(/\r\n/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (inQuotes) throw new Error('Unterminated quoted field');
  const nonEmpty = rows.filter(r => r.some(x => x !== ''));
  if (!nonEmpty.length) throw new Error('No data found');
  if (!header) return nonEmpty;
  const [head, ...body] = nonEmpty;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, coerce(r[i] ?? '')])));
}

function coerce(v) {
  if (v === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

export function toCsv(data, { delimiter = ',' } = {}) {
  const rows = Array.isArray(data) ? data : [data];
  if (!rows.length) throw new Error('Empty array');
  const objects = rows.every(r => r && typeof r === 'object' && !Array.isArray(r));
  const quote = v => { const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n\r]/.test(s) || s.includes(delimiter) ? `"${s.replace(/"/g, '""')}"` : s; };
  if (objects) {
    const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
    return [keys.map(quote).join(delimiter), ...rows.map(r => keys.map(k => quote(r[k])).join(delimiter))].join('\n');
  }
  return rows.map(r => (Array.isArray(r) ? r : [r]).map(quote).join(delimiter)).join('\n');
}

export function detectDelimiter(text) {
  const first = String(text).split('\n')[0] || '';
  const counts = [',', ';', '\t', '|'].map(d => [d, first.split(d).length - 1]);
  return counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ',';
}
