/* ForgeTools shell: navigation, routing, search, favorites, recents, theme, i18n, persistence. */
import { tools, categories } from './tools/index.js';
import { t, setLanguage, getLanguage, localized, detectLanguage, languages } from './i18n.js';
import { esc, toast, mount, download, readFileAsText, field, button, row, hint } from './ui.js';
import * as store from './storage.js';
import { VERSION, RELEASE_DATE } from './version.js';

store.migrateLegacy();

const app = document.querySelector('#app');
const nav = document.querySelector('#tool-nav');
const search = document.querySelector('#tool-search');
const sidebar = document.querySelector('#sidebar');
const crumb = document.querySelector('#crumb');

const state = {
  active: 'home',
  favorites: store.load('favorites', []).filter(id => tools.some(t => t.id === id)),
  recents: store.load('recents', []).filter(id => tools.some(t => t.id === id)),
  theme: store.load('theme', 'auto'),
  lang: store.load('lang', detectLanguage()),
  compact: store.load('compact', false),
};

/* ---------- theme / language ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  const meta = document.querySelector('meta[name=theme-color]');
  const dark = state.theme === 'dark' || (state.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (meta) meta.content = dark ? '#07111f' : '#f4f7fb';
  document.querySelector('#theme-button').title = `${t('theme')}: ${t(state.theme === 'auto' ? 'themeAuto' : state.theme === 'dark' ? 'themeDark' : 'themeLight')}`;
}
function cycleTheme() {
  state.theme = { auto: 'dark', dark: 'light', light: 'auto' }[state.theme];
  store.save('theme', state.theme); applyTheme();
  toast(`${t('theme')}: ${t(state.theme === 'auto' ? 'themeAuto' : state.theme === 'dark' ? 'themeDark' : 'themeLight')}`);
}
function applyLanguage() {
  setLanguage(state.lang);
  search.placeholder = t('search');
  document.querySelector('#sidebar-note').textContent = t('runsLocally');
  document.querySelector('#about-link').textContent = t('about');
  document.querySelector('#about-link').title = t('about');
}
function applyCompact() { document.body.classList.toggle('compact', state.compact); }

/* ---------- favorites / recents ---------- */
const isFavorite = id => state.favorites.includes(id);
function toggleFavorite(id) {
  state.favorites = isFavorite(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id];
  store.save('favorites', state.favorites);
  renderNav(search.value);
  // Update stars in place: never re-render the tool (that would wipe user input).
  document.querySelectorAll(`[data-favorite="${id}"]`).forEach(b => { b.classList.toggle('active', isFavorite(id)); b.textContent = isFavorite(id) ? '★' : '☆'; b.setAttribute('aria-pressed', String(isFavorite(id))); });
}
function pushRecent(id) {
  state.recents = [id, ...state.recents.filter(x => x !== id)].slice(0, 6);
  store.save('recents', state.recents);
}

/* ---------- search ---------- */
function matches(tool, needle) {
  if (!needle) return true;
  const hay = [tool.name, tool.description, tool.category, tool.pt?.name, tool.pt?.description, ...(tool.tags || [])].join(' ').toLowerCase();
  return needle.split(/\s+/).every(w => hay.includes(w));
}

/* ---------- navigation ---------- */
function navItem(tool, icon = tool.icon) {
  return `<a class="nav-item ${state.active === tool.id ? 'active' : ''}" href="#/${tool.id}" ${state.active === tool.id ? 'aria-current="page"' : ''}><span class="nav-icon">${icon}</span>${esc(localized(tool, 'name'))}</a>`;
}
function renderNav(query = '') {
  const needle = query.trim().toLowerCase();
  let html = `<a class="nav-item ${state.active === 'home' ? 'active' : ''}" href="#/"><span class="nav-icon">⌂</span>${t('dashboard')}</a>`;
  if (!needle && state.favorites.length) html += `<div class="nav-label">${t('favorites')}</div>${state.favorites.map(id => tools.find(x => x.id === id)).filter(Boolean).map(x => navItem(x, '<span class="favorite-nav">★</span>')).join('')}`;
  if (!needle && state.recents.length) html += `<div class="nav-label">${t('recent')}</div>${state.recents.map(id => tools.find(x => x.id === id)).filter(Boolean).map(x => navItem(x)).join('')}`;
  let any = false;
  for (const category of categories) {
    const list = tools.filter(x => x.category === category && matches(x, needle));
    if (!list.length) continue;
    any = true;
    html += `<div class="nav-label">${esc(localized({ name: category, pt: { name: categoryPt[category] } }, 'name')).toUpperCase()}</div>${list.map(x => navItem(x)).join('')}`;
  }
  if (!any) html += `<p class="empty">${t('noResults')}</p>`;
  nav.innerHTML = html;
}
const categoryPt = { Engineering: 'Engenharia', 'Science & Math': 'Ciência e Matemática', 'Finance & Planning': 'Finanças e Planejamento', 'IT & Network': 'TI e Redes', Cybersecurity: 'Cibersegurança', 'OT & IoT': 'OT e IoT' };

/* ---------- views ---------- */
function favButton(tool) {
  return `<button class="fav-toggle ${isFavorite(tool.id) ? 'active' : ''}" data-favorite="${tool.id}" aria-label="${t('toggleFavorite')}" aria-pressed="${isFavorite(tool.id)}">${isFavorite(tool.id) ? '★' : '☆'}</button>`;
}
function toolCard(tool) {
  return `<article class="tool-card"><a class="card-link" href="#/${tool.id}"><div class="tool-icon">${tool.icon}</div><h3>${esc(localized(tool, 'name'))}</h3><p>${esc(localized(tool, 'description'))}</p></a>${favButton(tool)}</article>`;
}
function renderHome() {
  state.active = 'home';
  crumb.textContent = t('dashboard');
  document.title = 'ForgeTools | Engineering Utility Suite';
  app.innerHTML = `
    <section class="hero"><div><p class="eyebrow">${t('heroEyebrow')}</p><h1>${t('heroTitle')}</h1><p>${t('heroText')}</p></div>
    <div class="hero-stat"><strong>${tools.length}</strong><span>${t('offlineTools')}</span></div></section>
    <p class="hint tags-hint">${t('tagsHint')}</p>
    ${categories.map(c => { const list = tools.filter(x => x.category === c); return `<section class="category" id="cat-${c.replace(/\W+/g, '-')}"><div class="category-head"><h2>${esc(localized({ name: c, pt: { name: categoryPt[c] } }, 'name'))}</h2><p>${list.length} ${t('utilities')}</p></div><div class="tools-grid">${list.map(toolCard).join('')}</div></section>`; }).join('')}`;
}

function renderTool(tool) {
  state.active = tool.id;
  pushRecent(tool.id);
  crumb.textContent = localized(tool, 'name');
  document.title = `${localized(tool, 'name')} · ForgeTools`;
  app.innerHTML = `<section class="tool-page"><a class="back" href="#/">← ${t('allTools')}</a>
    <div class="tool-heading"><div class="big-icon">${tool.icon}</div><div><h1>${esc(localized(tool, 'name'))} ${favButton(tool)}</h1><p>${esc(localized(tool, 'description'))} ${t('localNote')}</p></div></div>
    <section class="workspace" id="workspace"></section></section>`;
  const root = app.querySelector('#workspace');
  try {
    tool.render(root, { t, lang: getLanguage() });
  } catch (e) {
    root.innerHTML = `<div class="error-box" role="alert">Tool failed to load: ${esc(e.message)}</div>`;
    console.error(e);
  }
  restoreInputs(tool.id, root);
}

function renderAbout() {
  state.active = 'about';
  crumb.textContent = t('about');
  document.title = `${t('about')} · ForgeTools`;
  app.innerHTML = `<section class="tool-page"><a class="back" href="#/">← ${t('allTools')}</a><div class="tool-heading"><div class="big-icon">ⓘ</div><div><h1>ForgeTools</h1><p>${t('aboutText')}</p></div></div><section class="workspace" id="workspace"></section></section>`;
  const root = app.querySelector('#workspace');
  mount(root, {
    html: `<div class="control-grid">
      ${field({ id: 'set-lang', label: t('language'), type: 'select', options: languages, selected: state.lang, persist: false })}
      ${field({ id: 'set-theme', label: t('theme'), type: 'select', options: { auto: t('themeAuto'), dark: t('themeDark'), light: t('themeLight') }, selected: state.theme, persist: false })}
      <div class="field"><label>${t('compact')}</label><label class="check"><input type="checkbox" id="set-compact" ${state.compact ? 'checked' : ''} data-no-persist /> ${t('compact')}</label></div>
    </div>
    ${row(button({ id: 'set-export', label: t('exportSettings'), secondary: true }), `<label class="button secondary file-button">${t('importSettings')}<input type="file" id="set-import" accept="application/json" hidden></label>`, button({ id: 'set-reset', label: t('resetSettings'), danger: true }))}
    ${hint(t('savedInputs'))}
    <div class="details cols-2" style="margin-top:20px">
      <div class="detail"><span>${t('version')}</span><strong>${VERSION} · ${RELEASE_DATE}</strong></div>
      <div class="detail"><span>${t('favorites_lc')} / ${t('recents_lc')}</span><strong>${state.favorites.length} / ${state.recents.length}</strong></div>
      <div class="detail"><span>${t('sourceCode')}</span><strong><a href="https://github.com/marceloasl99/industrial-toolkit" target="_blank" rel="noreferrer">github.com/marceloasl99/industrial-toolkit</a></strong></div>
      <div class="detail"><span>${t('license')}</span><strong>MIT © 2026 Marcelo A. S. L.</strong></div>
    </div>
    <h2 class="sub-title">${t('shortcuts')}</h2>
    <div class="details cols-2">
      <div class="detail"><span>Ctrl/⌘ + K &nbsp;·&nbsp; /</span><strong>${t('shortcutSearch')}</strong></div>
      <div class="detail"><span>Esc</span><strong>${t('shortcutBack')}</strong></div>
      <div class="detail"><span>Ctrl/⌘ + Enter</span><strong>${t('shortcutCalc')}</strong></div>
      <div class="detail"><span>Ctrl/⌘ + Shift + L</span><strong>${t('shortcutTheme')}</strong></div>
    </div>`,
  });
  root.querySelector('#set-lang').onchange = e => { state.lang = e.target.value; store.save('lang', state.lang); applyLanguage(); renderNav(); renderAbout(); };
  root.querySelector('#set-theme').onchange = e => { state.theme = e.target.value; store.save('theme', state.theme); applyTheme(); };
  root.querySelector('#set-compact').onchange = e => { state.compact = e.target.checked; store.save('compact', state.compact); applyCompact(); };
  root.querySelector('#set-export').onclick = () => { download(`forge-tools-settings-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'forge-tools', version: VERSION, data: store.exportAll() }, null, 2), 'application/json'); toast(t('exported')); };
  root.querySelector('#set-import').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const parsed = JSON.parse(await readFileAsText(f)); store.importAll(parsed.data || parsed); toast(t('imported')); location.reload(); }
    catch (err) { toast(`${t('error')}: ${err.message}`); }
  };
  root.querySelector('#set-reset').onclick = () => { if (confirm(t('resetConfirm'))) { store.clearAll(); location.hash = '#/'; location.reload(); } };
}

/* ---------- per-tool input persistence ---------- */
const persistable = root => [...root.querySelectorAll('input[id], select[id], textarea[id]')].filter(el => !el.hasAttribute('data-no-persist') && !el.readOnly && !['file', 'password', 'button', 'submit'].includes(el.type));
function restoreInputs(toolId, root) {
  const saved = store.load(`state:${toolId}`, null);
  if (saved) {
    let changed = false;
    for (const el of persistable(root)) {
      if (!(el.id in saved)) continue;
      if (el.type === 'checkbox') el.checked = !!saved[el.id]; else el.value = saved[el.id];
      changed = true;
    }
    // Selects may drive label changes; fire change first, then input to recalc.
    if (changed) { root.querySelectorAll('select').forEach(s => s.dispatchEvent(new Event('change', { bubbles: true }))); root.dispatchEvent(new Event('input', { bubbles: true })); }
  }
  let timer;
  const saveNow = () => {
    const data = {};
    for (const el of persistable(root)) data[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    store.save(`state:${toolId}`, data);
  };
  root.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(saveNow, 300); });
  root.addEventListener('change', () => { clearTimeout(timer); timer = setTimeout(saveNow, 300); });
}

/* ---------- routing ---------- */
function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  sidebar.classList.remove('open');
  if (!hash || hash === 'home') renderHome();
  else if (hash === 'about') renderAbout();
  else {
    const tool = tools.find(x => x.id === hash);
    if (tool) renderTool(tool); else { location.replace('#/'); return; }
  }
  renderNav(search.value);
  window.scrollTo({ top: 0 });
}

/* ---------- global events ---------- */
document.addEventListener('click', e => {
  const fav = e.target.closest('[data-favorite]');
  if (fav) { e.preventDefault(); toggleFavorite(fav.dataset.favorite); }
});
search.addEventListener('input', () => renderNav(search.value));
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.focus(); search.select(); }
  else if (e.key === '/' && !typing) { e.preventDefault(); search.focus(); }
  else if (e.key === 'Escape') { if (document.activeElement === search && search.value) { search.value = ''; renderNav(); } else if (sidebar.classList.contains('open')) sidebar.classList.remove('open'); else if (state.active !== 'home') location.hash = '#/'; }
  else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); cycleTheme(); }
});
document.querySelector('#menu-button').onclick = () => sidebar.classList.toggle('open');
document.querySelector('#theme-button').onclick = cycleTheme;
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
window.addEventListener('hashchange', route);

/* ---------- PWA install + updates ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = document.querySelector('#install-button'); b.hidden = false; b.textContent = t('installApp'); });
document.querySelector('#install-button').onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; document.querySelector('#install-button').hidden = true; };

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw?.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          const bar = document.querySelector('#update-bar');
          bar.hidden = false;
          bar.querySelector('span').textContent = t('updateAvailable');
          bar.querySelector('button').textContent = t('reload');
          bar.querySelector('button').onclick = () => location.reload();
        }
      });
    });
  }).catch(() => { /* offline or unsupported */ });
}

/* ---------- boot ---------- */
applyLanguage(); applyTheme(); applyCompact();
route();
