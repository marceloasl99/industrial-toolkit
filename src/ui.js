/* Small HTML helpers shared by every tool. Everything returns strings; `mount` wires behaviour. */
import { t } from './i18n.js';

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function attrs(obj = {}) {
  return Object.entries(obj).filter(([, v]) => v !== undefined && v !== false && v !== null).map(([k, v]) => v === true ? ` ${k}` : ` ${k}="${esc(v)}"`).join('');
}

function optionsHtml(options, selected) {
  const list = Array.isArray(options) ? options.map(o => Array.isArray(o) ? o : [o, o]) : Object.entries(options);
  return list.map(([v, label]) => `<option value="${esc(v)}"${String(v) === String(selected) ? ' selected' : ''}>${esc(label)}</option>`).join('');
}

/** Labelled input/select. `type` may be any input type or 'select'. */
export function field({ id, label, type = 'text', value = '', options, selected, placeholder, step = 'any', min, max, hint, persist = true, extra = {}, className = '' }) {
  let control;
  if (type === 'select') control = `<select id="${esc(id)}"${attrs({ 'data-no-persist': !persist, ...extra })}>${optionsHtml(options, selected ?? value)}</select>`;
  else control = `<input id="${esc(id)}" type="${esc(type)}"${attrs({ value, placeholder, step: type === 'number' ? step : undefined, min, max, 'data-no-persist': !persist, autocomplete: 'off', spellcheck: 'false', ...extra })} />`;
  return `<div class="field ${className}"><label for="${esc(id)}">${label}</label>${control}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
}

export function textarea({ id, label, value = '', placeholder, readonly = false, rows, mono = true, persist = true, className = '' }) {
  return `<div class="field ${className}"><label for="${esc(id)}">${label}</label><textarea id="${esc(id)}"${attrs({ placeholder, readonly, rows, 'data-no-persist': !persist || readonly, spellcheck: 'false' })} class="${mono ? 'mono' : ''}">${esc(value)}</textarea></div>`;
}

export function checkbox({ id, label, checked = false, persist = true }) {
  return `<label class="check"><input type="checkbox" id="${esc(id)}"${attrs({ checked, 'data-no-persist': !persist })} /> ${label}</label>`;
}

export function grid(...children) { return `<div class="control-grid">${children.join('')}</div>`; }
export function grid2(...children) { return `<div class="control-grid two">${children.join('')}</div>`; }
export function split(a, b) { return `<div class="split">${a}${b}</div>`; }
export function row(...children) { return `<div class="button-row">${children.join('')}</div>`; }
export function section(title, body) { return `<section class="sub"><h2>${title}</h2>${body}</section>`; }

export function button({ id, label, secondary = false, danger = false, type = 'button', extra = {} }) {
  return `<button type="${type}" class="button${secondary ? ' secondary' : ''}${danger ? ' danger' : ''}"${attrs({ id, ...extra })}>${label}</button>`;
}
export const primary = (id, label = t('calculate')) => button({ id, label, extra: { 'data-primary': true } });
export const copyButton = (target, label = t('copy')) => button({ label, secondary: true, extra: { 'data-copy': target } });
export const downloadButton = (id, label = t('download')) => button({ id, label, secondary: true });

export function result({ id, label = t('result'), value = '—', mono = false, size = '' }) {
  return `<div class="result"><span class="result-label">${label}</span><output class="${mono ? 'mono-result' : 'result-value'} ${size}" id="${esc(id)}">${esc(value)}</output></div>`;
}

export function details(id, cols) { return `<div class="details${cols ? ` cols-${cols}` : ''}" id="${esc(id)}"></div>`; }
export function hint(text, id) { return `<p class="hint"${id ? ` id="${esc(id)}"` : ''}>${text}</p>`; }
export function statusLine(id, text = '') { return `<p class="status" id="${esc(id)}">${esc(text)}</p>`; }
export function pre(id, text = '') { return `<pre class="code" id="${esc(id)}">${esc(text)}</pre>`; }
export function table(id) { return `<div class="table-wrap"><table class="data" id="${esc(id)}"></table></div>`; }

/** Fill a .details container with [label, value, className?] rows. Values are escaped unless {raw:true}. */
export function renderDetails(el, rows, { raw = false } = {}) {
  el.innerHTML = rows.filter(Boolean).map(([label, value, cls = '']) => `<div class="detail ${cls}"><span>${esc(label)}</span><strong>${raw ? value : esc(value)}</strong></div>`).join('');
}

export function renderTable(el, head, rows, { raw = false } = {}) {
  const cell = v => raw ? v : esc(v);
  el.innerHTML = `<thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}

export function setStatus(el, text, level = 'info') {
  el.textContent = text;
  el.className = `status ${level}`;
}

export function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = message; el.setAttribute('role', 'status');
  document.body.append(el);
  setTimeout(() => el.remove(), 2400);
}

export async function copyText(value) {
  const text = String(value ?? '').trim();
  if (!text || text === '—') return toast(t('nothingToCopy'));
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    toast(t('copied'));
  } catch { toast(t('clipboardBlocked')); }
}

export function download(filename, content, mime = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsText(file); });
}

/**
 * Render `html` into `root` and wire a calculation function.
 * - `calc(q)` runs now and on every input/change inside root (unless live:false, then on data-primary click / Ctrl+Enter).
 * - Errors thrown by calc are shown in an error box instead of breaking the page.
 */
export function mount(root, { html, calc, live = true }) {
  root.innerHTML = `<div class="error-box" hidden role="alert"></div>${html}`;
  const q = sel => root.querySelector(sel);
  const errorBox = q('.error-box');
  let pending = null;
  const run = async () => {
    try {
      await calc?.(q);
      errorBox.hidden = true;
    } catch (e) {
      errorBox.hidden = false;
      errorBox.textContent = e?.message || String(e);
    }
  };
  const schedule = () => { clearTimeout(pending); pending = setTimeout(run, 60); };
  if (calc) {
    if (live) { root.addEventListener('input', schedule); root.addEventListener('change', schedule); }
    root.addEventListener('click', e => { if (e.target.closest('[data-primary]')) run(); });
    root.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
  }
  root.addEventListener('click', e => {
    const c = e.target.closest('[data-copy]');
    if (!c) return;
    const target = q(`#${c.dataset.copy}`);
    copyText(target ? ('value' in target && target.tagName !== 'OUTPUT' ? target.value : target.textContent) : '');
  });
  if (calc) run(); // initial render: show results for the default inputs
  return { q, run, root };
}

export const fmt = {
  pct: (x, d = 2) => Number.isFinite(x) ? `${(x * 100).toFixed(d)}%` : '—',
  fixed: (x, d = 3) => Number.isFinite(x) ? x.toFixed(d) : '—',
};
