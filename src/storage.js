/* Guarded localStorage access. Corrupted or blocked storage never breaks the app. */
const PREFIX = 'forge-tools:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}

export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* quota or privacy mode: ignore */ }
}

export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export function allKeys() {
  try { return Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).map(k => k.slice(PREFIX.length)); } catch { return []; }
}

export function exportAll() {
  const out = {};
  for (const k of allKeys()) out[k] = load(k, null);
  return out;
}

export function importAll(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid settings file');
  for (const [k, v] of Object.entries(obj)) save(k, v);
}

export function clearAll() {
  for (const k of allKeys()) remove(k);
}

/* Legacy key from v1.x */
export function migrateLegacy() {
  try {
    const old = localStorage.getItem('forge-tools-favorites');
    if (old && load('favorites', null) === null) { save('favorites', JSON.parse(old)); localStorage.removeItem('forge-tools-favorites'); }
  } catch { /* ignore */ }
}
