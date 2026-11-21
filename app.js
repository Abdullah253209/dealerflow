import { emptyData, validateData, parseMoney, moneyInput, isMonth, monthEnd, shiftMonth, todayLocal, monthlyReport, summary, balanceAt, prepareImport, parseBackup, makeDemo, CSV_HEADERS, toCSV } from './core.js';
import { strings } from './i18n.js';

const STORAGE_KEY = 'dealerflow.workspace.v1';
const LANGUAGE_KEY = 'dealerflow.language';
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const PAGE_SIZE = 20;
let lang = 'en', data = emptyData(), rawSaved = null, storageIssue = false, changedElsewhere = false;
let demo = false, realData = null, route = 'overview', month = todayLocal().slice(0, 7);
let filters = { q: '', type: '', dealer: '', page: 1 }, pendingImport = null, ledgerId = null, toastTimer;
try {
  lang = localStorage.getItem(LANGUAGE_KEY) === 'bn' ? 'bn' : 'en';
  rawSaved = localStorage.getItem(STORAGE_KEY);
  if (rawSaved !== null) data = validateData(JSON.parse(rawSaved));
} catch { storageIssue = true; }
const tr = key => strings[key]?.[lang === 'bn' ? 1 : 0] ?? key;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const locale = () => lang === 'bn' ? 'bn-BD' : 'en-BD';
const num = (v, options = {}) => new Intl.NumberFormat(locale(), options).format(v);
const money = value => (value < 0 ? '−' : '') + '৳ ' + num(Math.abs(value) / 100, { maximumFractionDigits: 2 });
const percent = value => num(value, { maximumFractionDigits: 1 }) + '%';
const dateLabel = date => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
const monthLabel = (m, short = false) => new Intl.DateTimeFormat(locale(), { month: short ? 'short' : 'long', ...(short ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(new Date(m + '-01T00:00:00Z'));
const newId = () => crypto.randomUUID();
const dealerName = id => data.dealers.find(d => d.id === id)?.name ?? '';
const sortedTransactions = list => [...list].sort((a, b) => b.date.localeCompare(a.date));
const thisMonthTransactions = () => data.transactions.filter(t => t.date.slice(0, 7) === month);
const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  ledger: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h8M8 17h4"/>',
  chart: '<path d="M4 3v18h17M9 16v-4m5 4V7m5 9v-6"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bag: '<path d="M4 8h16l1 13H3L4 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  wallet: '<path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M20 12h-5v5h5m-3-2.5h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  monitor: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-3 3 5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
  upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4"/>',
  print: '<path d="M6 9V3h12v6M6 18H3V9h18v9h-3M6 14h12v7H6v-7Zm11-2h.01"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  box: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 4 9-4V8M12 13v9"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.ledger}</svg>`;
const btn = (action, label, ico, cls = '', attrs = '') => `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${ico ? icon(ico) : ''}${esc(label)}</button>`;
const actionButton = (action, label, ico, id) => `<button type="button" class="icon-btn" data-action="${action}" data-id="${esc(id)}" title="${esc(label)}" aria-label="${esc(label)}">${icon(ico)}</button>`;
const errorBox = '<div id="form-error" class="form-error" role="alert"></div>';

function toast(message, error = false) {
  const box = document.querySelector('#toast');
  clearTimeout(toastTimer); box.textContent = message; box.className = 'visible' + (error ? ' error' : '');
  toastTimer = setTimeout(() => box.className = '', error ? 8500 : 3500);
}
function commit(next, force = false) {
  const checked = validateData(next);
  if (!demo) {
    if (!force && (storageIssue || changedElsewhere)) throw new Error(tr(changedElsewhere ? 'multiTab' : 'storageProblem'));
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (!force && current !== rawSaved) { changedElsewhere = true; throw new Error(tr('multiTab')); }
      const encoded = JSON.stringify(checked);
      localStorage.setItem(STORAGE_KEY, encoded); rawSaved = encoded;
    } catch (error) { if (changedElsewhere) throw error; throw new Error(tr('saveFailed')); }
    storageIssue = false; changedElsewhere = false;
  }
  data = checked;
}
function showFormError(error) {
  const box = document.querySelector('#form-error');
  if (box) { box.textContent = tr('errorPrefix') + error.message; box.scrollIntoView({ block: 'nearest' }); }
  else toast(error.message, true);
}
function render() {
  document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
  document.title = `DealerFlow · ${tr(route)}`;
  const nav = [['overview', 'grid'], ['dealers', 'people'], ['transactions', 'ledger'], ['reports', 'chart'], ['tools', 'settings']];
  app.innerHTML = `<div class="shell"><aside class="sidebar">
    <a href="#overview" class="brand" data-action="navigate" data-route="overview"><img src="./assets/logo.svg" alt=""><span>Dealer<span>Flow</span></span></a>
    <p class="tagline">${tr('tagline')}</p><p class="nav-label">${tr('workspace')}</p>
    <nav class="nav" aria-label="${tr('workspace')}">${nav.map(([key, ico]) => `<button type="button" class="${route === key ? 'active' : ''}" data-action="navigate" data-route="${key}" ${route === key ? 'aria-current="page"' : ''}>${icon(ico)}${tr(key)}</button>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="side-note">${icon('shield')}<div>${tr('privacy')}<small>${tr('install')}</small></div></div><div class="version">DEALERFLOW / v1.0.0</div></div>
  </aside><div class="content"><header class="topbar"><div><div class="mobile-brand"><img src="./assets/logo.svg" alt="">DealerFlow</div><div class="business-label">${tr(demo ? 'demo' : 'workspace')}</div><div class="business-name">${esc(data.settings.businessName)}</div></div>
    <div class="top-actions"><span class="device-label">${icon('monitor')}${tr('local')}</span><button type="button" class="language" data-action="language" aria-label="${lang === 'en' ? 'বাংলায় দেখুন' : 'Switch to English'}">${tr('language')}</button><span class="avatar" aria-hidden="true">${esc(initials(data.settings.businessName))}</span></div></header>
    <main id="main" tabindex="-1">${notices()}${heading()}${route !== 'tools' ? periodBar() : ''}<p class="print-only"><strong>${esc(data.settings.businessName)}</strong> · ${esc(monthLabel(month))}${demo ? ' · DEMO' : ''}</p>${pageContent()}<footer class="footer"><span>${icon('shield')}${tr('local')}</span><span>DealerFlow · ${tr('tagline')}</span></footer><p class="print-only print-footer">${tr('reportFooter')}</p></main></div></div>`;
  if (route === 'dealers' || route === 'transactions') renderListing();
}
function initials(value) { return value.trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('').toUpperCase(); }
function notices() {
  let html = '';
  if (demo) html += `<div class="notice"><p><strong>${tr('demo')}</strong>${tr('demoNotice')}</p>${btn('exit-demo', tr('ownWorkspace'), null, 'small')}</div>`;
  if (!demo && storageIssue) html += `<div class="notice error" role="alert"><p>${tr('storageProblem')}</p>${btn('navigate', tr('tools'), 'settings', 'small', 'data-route="tools"')}</div>`;
  if (!demo && changedElsewhere) html += `<div class="notice error" role="alert"><p>${tr('multiTab')}</p>${btn('reload', tr('reload'), null, 'small')}</div>`;
  if (route !== 'tools' && thisMonthTransactions().some(t => t.date > todayLocal())) html += `<p class="inline-note">${tr('future')}</p>`;
  return html;
}
function heading() {
  const titleKey = route === 'tools' ? 'toolsTitle' : route + 'Title';
  const subtitleKey = route === 'tools' ? 'toolsSubtitle' : route + 'Subtitle';
  let actions;
  if (route === 'reports') actions = btn('export-report', tr('exportCSV'), 'download') + btn('print', tr('print'), 'print', 'primary');
  else if (route === 'tools') actions = '';
  else if (route === 'dealers') actions = btn('add-dealer', tr('addDealer'), 'plus', 'primary');
  else actions = (route === 'transactions' ? btn('open-import', tr('importCSV'), 'upload') : '') + btn('add-transaction', tr('newTransaction'), 'plus', 'primary');
  return `<div class="page-heading"><div><h1>${tr(titleKey)}</h1><p>${tr(subtitleKey)}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function periodBar() {
  return `<div class="period-bar"><div class="period"><label for="month">${tr('month')}</label><input type="month" id="month" value="${month}" min="1900-01" max="2100-12" aria-label="${tr('month')}">${btn('this-month', tr('thisMonth'), null, 'small')}</div><span class="eyebrow">${tr(route === 'dealers' ? 'atMonthEnd' : 'inMonth')}</span></div>`;
}
function pageContent() {
  if (route === 'overview') return overview();
  if (route === 'reports') return reports();
  if (route === 'tools') return toolsPage();
  return `<section class="card"><div class="filters" role="search" aria-label="${tr('filter')}"><div class="search-wrap">${icon('search')}<input id="search" type="search" placeholder="${tr(route === 'dealers' ? 'searchDealers' : 'search')}" aria-label="${tr(route === 'dealers' ? 'searchDealers' : 'search')}" value="${esc(filters.q)}"></div>${route === 'transactions' ? `<select id="filter-type" aria-label="${tr('type')}"><option value="">${tr('allTypes')}</option>${['sale', 'collection'].map(v => `<option value="${v}" ${filters.type === v ? 'selected' : ''}>${tr(v)}</option>`).join('')}</select><select id="filter-dealer" aria-label="${tr('dealer')}"><option value="">${tr('allDealers')}</option>${dealerOptions(filters.dealer)}</select>` : ''}${btn('clear-filters', tr('clearFilters'), null, 'small subtle')}${btn(route === 'dealers' ? 'export-dealers' : 'export-transactions', tr('exportCSV'), 'download', 'small')}</div><div id="listing"></div></section>`;
}
function metrics() {
  const s = summary(data, month), ratio = s.target ? s.sales / s.target * 100 : 0;
  const card = (key, value, ico, foot, cls = '') => `<div class="metric ${cls}"><div class="metric-top"><span>${tr(key)}</span><span class="metric-icon">${icon(ico)}</span></div><div class="metric-value num">${value}</div>${cls === 'dark' ? `<div class="progress"><span style="width:${Math.min(100, ratio)}%"></span></div>` : ''}<p class="metric-foot">${foot}</p></div>`;
  return `<section class="metrics" aria-label="${tr('overview')}">${card('sales', money(s.sales), 'bag', monthLabel(month))}${card('collections', money(s.collections), 'wallet', tr('inMonth'))}${card('outstanding', money(s.outstanding), 'clock', s.credit ? `${tr('credit')}: ${money(s.credit)}` : tr('atMonthEnd'))}${card('achievement', s.target ? percent(ratio) : '—', 'target', s.target ? `${tr('ofTarget')} ${money(s.target)}` : tr('noTarget'), 'dark')}</section>`;
}
function empty(title = 'noRows', hint = 'noRowsHint') { return `<div class="empty"><div class="empty-icon">${icon('ledger')}</div><h3>${tr(title)}</h3><p>${tr(hint)}</p></div>`; }
function overview() {
  const welcome = data.dealers.length ? '' : `<section class="welcome"><div><h2>${tr('welcome')}</h2><p>${tr('welcomeSub')}</p></div><div class="heading-actions">${btn('add-dealer', tr('addDealer'), 'plus', 'primary')}${btn('enter-demo', tr('tryDemo'), null)}</div></section>`;
  const rows = monthlyReport(data, month).filter(r => r.sales > 0).sort((a, b) => b.sales - a.sales).slice(0, 5), max = rows[0]?.sales || 1;
  const ranks = rows.length ? `<div class="rank-list">${rows.map(r => `<div class="rank-item"><div class="rank-avatar" aria-hidden="true">${esc(initials(r.dealer.name))}</div><div class="rank-info"><div class="rank-top"><button data-action="ledger" data-id="${esc(r.dealer.id)}">${esc(r.dealer.name)}</button><span class="num">${money(r.sales)}</span></div><div class="progress"><span style="width:${r.sales / max * 100}%"></span></div><p class="rank-target">${r.target ? `${percent(r.sales / r.target * 100)} ${tr('ofTarget')}` : esc(r.dealer.area)}</p></div></div>`).join('')}</div>` : empty('noActivity', 'noRowsHint');
  const recent = sortedTransactions(thisMonthTransactions()).slice(0, 5);
  return welcome + metrics() + `<div class="dashboard-grid"><section class="card"><div class="card-head"><div><h2>${tr('trend')}</h2><p>${tr('sixMonths')}</p></div><div class="legend"><span><i class="swatch"></i>${tr('sales')}</span><span><i class="swatch blue"></i>${tr('collections')}</span></div></div><div class="card-body">${chart()}</div></section><section class="card"><div class="card-head"><div><h2>${tr('topDealers')}</h2><p>${tr('bySales')}</p></div>${btn('navigate', tr('viewAll'), null, 'small subtle', 'data-route="dealers"')}</div><div class="card-body">${ranks}</div></section></div><section class="card"><div class="card-head"><div><h2>${tr('recent')}</h2><p>${tr('recentSub')}</p></div>${btn('navigate', tr('viewAll'), null, 'small subtle', 'data-route="transactions"')}</div>${recent.length ? transactionTable(recent, false) : empty()}</section>`;
}
function chart() {
  const values = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5)).filter(isMonth).map(m => ({ month: m, ...summary(data, m) }));
  const max = Math.max(10000, ...values.flatMap(v => [v.sales, v.collections])) * 1.15;
  const width = 560, height = 225, left = 57, top = 10, plotH = 169, plotW = 490, groupW = plotW / values.length, barW = Math.min(20, groupW * .24);
  const ticks = [0, .25, .5, .75, 1].map(f => `<line x1="${left}" y1="${top + plotH * (1 - f)}" x2="${width - 8}" y2="${top + plotH * (1 - f)}"/><text x="${left - 10}" y="${top + plotH * (1 - f) + 4}" text-anchor="end">${num(max * f / 100, { notation: 'compact', maximumFractionDigits: 1 })}</text>`).join('');
  const bars = values.map((v, i) => {
    const cx = left + groupW * (i + .5), base = top + plotH;
    return `<g><rect class="bar-sales" x="${cx - barW - 2}" y="${base - v.sales / max * plotH}" width="${barW}" height="${v.sales / max * plotH}" rx="3"><title>${esc(monthLabel(v.month))} · ${tr('sales')}: ${money(v.sales)}</title></rect><rect class="bar-collections" x="${cx + 2}" y="${base - v.collections / max * plotH}" width="${barW}" height="${v.collections / max * plotH}" rx="3"><title>${esc(monthLabel(v.month))} · ${tr('collections')}: ${money(v.collections)}</title></rect><text x="${cx}" y="${height - 17}" text-anchor="middle">${esc(monthLabel(v.month, true))}</text></g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${tr('trend')} · ${tr('sixMonths')}">${ticks}${bars}</svg><details class="chart-table"><summary>${tr('chartData')}</summary><table><thead><tr><th scope="col">${tr('month')}</th><th scope="col" class="right">${tr('sales')}</th><th scope="col" class="right">${tr('collections')}</th></tr></thead><tbody>${values.map(v => `<tr><td>${esc(monthLabel(v.month))}</td><td class="right num">${money(v.sales)}</td><td class="right num">${money(v.collections)}</td></tr>`).join('')}</tbody></table></details>`;
}
function dealerOptions(selected = '') { return [...data.dealers].sort((a, b) => a.name.localeCompare(b.name)).map(d => `<option value="${esc(d.id)}" ${selected === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join(''); }
function transactionTable(rows, controls = true) {
  return `<div class="table-wrap"><table class="tx-table"><thead><tr><th scope="col">${tr('dealer')}</th><th scope="col">${tr('date')}</th><th scope="col">${tr('type')}</th><th scope="col">${tr('reference')}</th><th scope="col" class="right">${tr('amount')}</th>${controls ? `<th scope="col" class="right no-print">${tr('actions')}</th>` : ''}</tr></thead><tbody>${rows.map(t => `<tr><td><button type="button" class="dealer-link" data-action="ledger" data-id="${esc(t.dealerId)}">${esc(dealerName(t.dealerId))}</button>${t.note ? `<div class="subline">${esc(t.note)}</div>` : ''}</td><td class="num">${dateLabel(t.date)}</td><td><span class="badge ${t.type}">${tr(t.type)}</span></td><td class="muted">${esc(t.reference) || '—'}</td><td class="right num"><strong>${money(t.amount)}</strong></td>${controls ? `<td class="no-print"><div class="row-actions">${actionButton('edit-transaction', tr('editTransaction'), 'edit', t.id)}${actionButton('delete-transaction', tr('delete') + ' · ' + t.reference, 'trash', t.id)}</div></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
function filteredTransactions() {
  const q = filters.q.trim().toLocaleLowerCase();
  return sortedTransactions(thisMonthTransactions().filter(t => (!filters.type || t.type === filters.type) && (!filters.dealer || t.dealerId === filters.dealer) && (!q || `${dealerName(t.dealerId)} ${t.reference} ${t.note}`.toLocaleLowerCase().includes(q))));
}
function filteredDealers() {
  const q = filters.q.trim().toLocaleLowerCase();
  return monthlyReport(data, month).filter(r => !q || `${r.dealer.name} ${r.dealer.area} ${r.dealer.phone}`.toLocaleLowerCase().includes(q)).sort((a, b) => a.dealer.name.localeCompare(b.dealer.name));
}
function renderListing() {
  const holder = document.querySelector('#listing'); if (!holder) return;
  const rows = route === 'dealers' ? filteredDealers() : filteredTransactions(), pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  filters.page = Math.min(filters.page, pages);
  const slice = rows.slice((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE);
  let content = '';
  if (!rows.length) content = empty();
  else if (route === 'transactions') content = transactionTable(slice);
  else content = `<div class="filter-status">${tr('allTimeDealer')}</div><div class="table-wrap"><table class="dealer-table"><thead><tr><th scope="col">${tr('dealer')}</th><th scope="col">${tr('area')}</th><th scope="col" class="right">${tr('sales')}</th><th scope="col" class="right">${tr('target')}</th><th scope="col" class="right">${tr('balanceEnd')}</th><th scope="col" class="right">${tr('fridges')}</th><th scope="col" class="right no-print">${tr('actions')}</th></tr></thead><tbody>${slice.map(r => `<tr><td><button type="button" class="dealer-link" data-action="ledger" data-id="${esc(r.dealer.id)}">${esc(r.dealer.name)}</button><div class="subline">${esc(r.dealer.phone) || '—'}</div></td><td class="muted">${esc(r.dealer.area) || '—'}</td><td class="right num">${money(r.sales)}</td><td class="right num">${r.target ? money(r.target) : '—'}</td><td class="right num ${r.closing > 0 ? 'balance-due' : ''}">${money(r.closing)}${r.closing < 0 ? `<div><span class="badge credit">${tr('credit')}</span></div>` : ''}</td><td class="right num">${num(r.dealer.fridges)}</td><td class="no-print"><div class="row-actions">${actionButton('edit-dealer', tr('editDealer'), 'edit', r.dealer.id)}${actionButton('delete-dealer', tr('delete') + ' · ' + r.dealer.name, 'trash', r.dealer.id)}</div></td></tr>`).join('')}</tbody></table></div>`;
  holder.innerHTML = content + `<div class="table-foot"><span>${num(rows.length)} ${tr('rows')}</span><div class="pagination">${btn('prev-page', tr('prev'), null, 'small', filters.page <= 1 ? 'disabled' : '')}<span>${num(filters.page)} ${tr('of')} ${num(pages)}</span>${btn('next-page', tr('next'), null, 'small', filters.page >= pages ? 'disabled' : '')}</div></div>`;
}
function reports() {
  const s = summary(data, month), total = key => s.rows.reduce((v, r) => v + r[key], 0);
  const cols = ['opening', 'introduced', 'sales', 'collections', 'closing'];
  const cards = cols.map(key => `<div><p>${tr(key === 'closing' ? 'balanceEnd' : key)}</p><strong class="num">${money(total(key))}</strong></div>`).join('');
  const rows = s.rows.map(r => `<tr><td><strong>${esc(r.dealer.name)}</strong></td>${cols.map(k => `<td class="right num">${money(r[k])}</td>`).join('')}</tr>`).join('');
  return `<section class="report-summary" aria-label="${tr('reconciliation')}">${cards}</section><div class="stack"><section class="card"><div class="card-head"><div><h2>${tr('reconciliation')}</h2><p>${esc(monthLabel(month))} · BDT</p></div></div>${s.rows.length ? `<div class="table-wrap"><table class="table-wide"><thead><tr><th scope="col">${tr('dealer')}</th>${cols.map(k => `<th scope="col" class="right">${tr(k === 'closing' ? 'balanceEnd' : k)}</th>`).join('')}</tr></thead><tbody>${rows}<tr><th scope="row">${tr('total')}</th>${cols.map(k => `<td class="right num"><strong>${money(total(k))}</strong></td>`).join('')}</tr></tbody></table></div>` : empty()}<div class="info-strip">${tr('reconciliationHelp')}<br>${tr('outstanding')}: <strong>${money(s.outstanding)}</strong> · ${tr('credit')}: <strong>${money(s.credit)}</strong></div></section><section class="card"><div class="card-head"><h2>${tr('performance')}</h2></div><div class="table-wrap"><table class="table-wide"><thead><tr><th scope="col">${tr('dealer')}</th><th scope="col" class="right">${tr('target')}</th><th scope="col" class="right">${tr('sales')}</th><th scope="col" class="right">${tr('achievement')}</th><th scope="col" class="right">${tr('fridges')}</th><th scope="col" class="right">${tr('perFridge')}</th></tr></thead><tbody>${s.rows.map(r => `<tr><td>${esc(r.dealer.name)}</td><td class="right num">${r.target ? money(r.target) : '—'}</td><td class="right num">${money(r.sales)}</td><td class="right num">${r.target ? percent(r.sales / r.target * 100) : '—'}</td><td class="right num">${num(r.dealer.fridges)}</td><td class="right num">${r.dealer.fridges ? money(Math.round(r.sales / r.dealer.fridges)) : '—'}</td></tr>`).join('')}</tbody></table></div><p class="info-strip">${tr('exportHelp')}</p></section></div>`;
}
function toolsPage() {
  const card = (title, body, cls = '') => `<section class="card ${cls}"><div class="card-head"><h2>${tr(title)}</h2></div><div class="card-body">${body}</div></section>`;
  return `<div class="settings-grid">${card('business', `<p>${tr('businessHelp')}</p><form id="business-form"><div class="field"><label for="business-name">${tr('business')}</label><input id="business-name" name="businessName" value="${esc(data.settings.businessName)}" maxlength="80" required></div><button class="btn primary" type="submit">${tr('save')}</button></form>`)}${card('backup', `<p>${tr('backupHelp')}</p>${btn('backup', tr('downloadBackup'), 'download')}`)}${card('importCSV', `<p>${tr('importHelp')}</p>${btn('open-import', tr('importCSV'), 'upload')}${btn('template', tr('template'), 'download', 'subtle')}`)}${card('restore', `<p>${tr('restoreHelp')}</p><label class="btn" for="restore-file">${icon('upload')}${tr('chooseBackup')}</label><input type="file" class="sr-only" id="restore-file" accept=".json,application/json" ${demo ? 'disabled' : ''}>${demo ? `<p class="small">${tr('demoRestriction')}</p>` : ''}${storageIssue && rawSaved !== null ? btn('recovery', tr('recovery'), 'download') : ''}`)}${card('privacy', `<p>${tr('privacyHelp')}</p><small>${tr('limit')}</small>`, 'wide')}${card('tryDemo', `<p>${tr('demoNote')}</p>${btn(demo ? 'exit-demo' : 'enter-demo', tr(demo ? 'ownWorkspace' : 'tryDemo'), 'grid')}`)}${card('reset', `<p>${tr('resetHelp')}</p>${btn('reset', tr('reset'), 'trash', 'danger', demo ? 'disabled' : '')}`, 'danger-card')}</div>`;
}

function openModal(title, content, { form = '', submit = 'save', wide = false, footer = '' } = {}) {
  modal.className = wide ? 'wide' : '';
  modal.innerHTML = `${form ? `<form id="${form}">` : '<div>'}<header class="modal-head"><h2 id="modal-title">${esc(title)}</h2>${actionButton('close-modal', tr('close'), 'close', '')}</header><div class="modal-body">${errorBox}${content}</div><footer class="modal-foot">${footer}${btn('close-modal', tr(form ? 'cancel' : 'close'), null)}${form ? `<button class="btn primary" type="submit">${tr(submit)}</button>` : ''}</footer>${form ? '</form>' : '</div>'}`;
  if (!modal.open) modal.showModal();
  modal.querySelector('[autofocus]')?.focus();
}
function field(label, name, value = '', { type = 'text', required = false, max = '', help = '', full = false, extra = '' } = {}) {
  return `<div class="field ${full ? 'full' : ''}"><label for="field-${name}">${tr(label)}${required ? '' : ` <span class="optional">(${tr('optional')})</span>`}</label><input id="field-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${max ? `maxlength="${max}"` : ''} ${extra} ${help ? `aria-describedby="help-${name}"` : ''}>${help ? `<small class="help" id="help-${name}">${esc(help)}</small>` : ''}</div>`;
}
function dealerModal(id) {
  const d = data.dealers.find(d => d.id === id), target = data.targets.find(t => t.dealerId === id && t.month === month)?.amount ?? 0;
  const currentDate = todayLocal();
  const body = `<input type="hidden" name="id" value="${esc(d?.id || '')}"><div class="form-grid">${field('dealerName', 'name', d?.name, { required: true, full: true, max: 100, extra: 'autofocus' })}${field('area', 'area', d?.area, { max: 100 })}${field('phone', 'phone', d?.phone, { type: 'tel', max: 40 })}${field('opening', 'openingBalance', moneyInput(d?.openingBalance ?? 0), { required: true, help: tr('openingHelp'), extra: 'inputmode="decimal"' })}${field('openingDate', 'openingDate', d?.openingDate || (currentDate.startsWith(month) ? currentDate : month + '-01'), { type: 'date', required: true, extra: 'min="1900-01-01" max="2100-12-31"' })}${field('monthlyTarget', 'target', moneyInput(target), { required: true, help: monthLabel(month) + ' · ' + tr('targetHelp'), extra: 'inputmode="decimal"' })}${field('fridges', 'fridges', d?.fridges ?? 0, { type: 'number', required: true, help: tr('zeroHelp'), extra: 'min="0" max="10000" step="1"' })}</div>`;
  openModal(tr(d ? 'editDealer' : 'addDealer'), body, { form: 'dealer-form' });
}
function transactionModal(id) {
  if (!data.dealers.length) { toast(tr('addFirst')); dealerModal(); return; }
  const t = data.transactions.find(t => t.id === id), currentDate = todayLocal();
  const body = `<input type="hidden" name="id" value="${esc(t?.id || '')}"><div class="form-grid"><div class="field full"><label for="tx-dealer">${tr('dealer')}</label><select id="tx-dealer" name="dealerId" required autofocus><option value="">${tr('chooseDealer')}</option>${dealerOptions(t?.dealerId)}</select></div><div class="field"><label for="tx-type">${tr('type')}</label><select id="tx-type" name="type"><option value="sale" ${t?.type !== 'collection' ? 'selected' : ''}>${tr('sale')}</option><option value="collection" ${t?.type === 'collection' ? 'selected' : ''}>${tr('collection')}</option></select></div>${field('date', 'date', t?.date || (currentDate.startsWith(month) ? currentDate : month + '-01'), { type: 'date', required: true, extra: 'min="1900-01-01" max="2100-12-31"' })}${field('amount', 'amount', t ? moneyInput(t.amount) : '', { required: true, help: tr('amountHelp'), extra: 'inputmode="decimal"' })}${field('reference', 'reference', t?.reference, { max: 80 })}<div class="field full"><label for="tx-note">${tr('note')} <span class="optional">(${tr('optional')})</span></label><textarea id="tx-note" name="note" maxlength="300">${esc(t?.note || '')}</textarea><small class="help">${tr('receiptHint')}</small></div></div>`;
  openModal(tr(t ? 'editTransaction' : 'newTransaction'), body, { form: 'transaction-form' });
}
function ledgerRows(id) {
  const dealer = data.dealers.find(d => d.id === id);
  let running = dealer.openingDate <= monthEnd(month) ? dealer.openingBalance : 0;
  return [...data.transactions].filter(t => t.dealerId === id && t.date <= monthEnd(month)).sort((a, b) => a.date.localeCompare(b.date)).map(t => { running += t.type === 'sale' ? t.amount : -t.amount; return { ...t, running }; });
}
function showLedger(id) {
  const d = data.dealers.find(d => d.id === id); if (!d) return;
  ledgerId = id;
  const allRows = ledgerRows(id), rows = [...allRows].reverse().slice(0, 100), balance = balanceAt(data, id, monthEnd(month));
  const smallCard = (key, amount) => `<div class="metric"><div class="metric-top">${tr(key)}</div><div class="metric-value num">${money(amount)}</div></div>`;
  const content = `<p>${esc(d.area)}${d.phone ? ' · ' + esc(d.phone) : ''}</p><p>${tr('ledgerOpening')} ${dateLabel(d.openingDate)}: <strong>${money(d.openingBalance)}</strong><br>${tr('asOf')} ${dateLabel(monthEnd(month))}</p><div class="metrics">${smallCard('sales', allRows.filter(t => t.type === 'sale').reduce((v, t) => v + t.amount, 0))}${smallCard('collections', allRows.filter(t => t.type === 'collection').reduce((v, t) => v + t.amount, 0))}${smallCard(balance < 0 ? 'credit' : 'balance', Math.abs(balance))}</div><p>${tr('endLedger')}${allRows.length > 100 ? ' · ' + (lang === 'bn' ? 'সর্বশেষ ১০০টি দেখানো হচ্ছে। সব রেকর্ড CSV-তে পাবেন।' : 'Showing latest 100. Export CSV for all records.') : ''}</p>${rows.length ? `<div class="table-wrap"><table class="tx-table"><thead><tr><th scope="col">${tr('date')}</th><th scope="col">${tr('reference')}</th><th scope="col">${tr('type')}</th><th scope="col" class="right">${tr('amount')}</th><th scope="col" class="right">${tr('balance')}</th></tr></thead><tbody>${rows.map(t => `<tr><td>${dateLabel(t.date)}</td><td>${esc(t.reference) || '—'}</td><td>${tr(t.type)}</td><td class="right num">${money(t.amount)}</td><td class="right num">${money(t.running)}</td></tr>`).join('')}</tbody></table></div>` : empty()}`;
  openModal(d.name + ' · ' + tr('ledger'), content, { wide: true, footer: btn('export-ledger', tr('exportCSV'), 'download') });
}
function importModal() {
  pendingImport = null;
  openModal(tr('importCSV'), `<p>${tr('importHelp')}</p>${btn('template', tr('template'), 'download', 'small')}<div class="file-picker"><label for="csv-file">${tr('chooseCSV')}</label><input id="csv-file" type="file" accept=".csv,text/csv"></div>`);
}
function importPreview(result) {
  pendingImport = result;
  const body = `<div class="import-stats"><span><strong>${num(result.transactions.length)}</strong> ${tr('valid')}</span><span><strong>${num(result.skipped)}</strong> ${tr('skipped')}</span><span><strong>${num(result.errors.length)}</strong> ${tr('errors')}</span></div><p>${tr(result.errors.length ? 'importInvalid' : 'importReady')}</p>${result.errors.length ? `<ul class="error-list">${result.errors.slice(0, 10).map(e => `<li>${e.row ? `${tr('rows')} ${num(e.row)}: ` : ''}${esc(e.message)}</li>`).join('')}</ul>${result.errors.length > 10 ? `<p class="small">${tr('maxShown')}</p>` : ''}` : transactionTable(result.transactions.slice(0, 8), false)}`;
  openModal(tr('previewImport'), body, { wide: true, footer: btn('confirm-import', tr('confirmImport'), 'upload', 'primary', result.errors.length || !result.transactions.length ? 'disabled' : '') });
}
function download(name, contents, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type })), anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function exportTransactions(rows = filteredTransactions()) {
  download(`dealerflow-${demo ? 'demo-' : ''}transactions-${month}.csv`, toCSV([CSV_HEADERS, ...rows.map(t => [dealerName(t.dealerId), t.date, t.type, moneyInput(t.amount), t.reference, t.note])]));
}
function exportReport() {
  const rows = monthlyReport(data, month);
  download(`dealerflow-${demo ? 'demo-' : ''}report-${month}.csv`, toCSV([['dealer', 'month', 'opening_bdt', 'introduced_opening_bdt', 'sales_bdt', 'collections_bdt', 'closing_bdt', 'target_bdt', 'achievement_percent', 'fridges', 'sales_per_fridge_bdt'], ...rows.map(r => [r.dealer.name, month, moneyInput(r.opening), moneyInput(r.introduced), moneyInput(r.sales), moneyInput(r.collections), moneyInput(r.closing), moneyInput(r.target), r.target ? (r.sales / r.target * 100).toFixed(2) : '', r.dealer.fridges, r.dealer.fridges ? moneyInput(Math.round(r.sales / r.dealer.fridges)) : ''])]));
}
function enterDemo() { if (demo) return; realData = data; data = makeDemo(todayLocal().slice(0, 7)); demo = true; route = 'overview'; month = todayLocal().slice(0, 7); filters = { q: '', type: '', dealer: '', page: 1 }; render(); }
function exitDemo() { if (!demo) return; data = realData; realData = null; demo = false; route = 'overview'; filters = { q: '', type: '', dealer: '', page: 1 }; render(); }

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  event.preventDefault(); const action = button.dataset.action, id = button.dataset.id;
  try {
    switch (action) {
      case 'navigate': route = button.dataset.route; filters = { q: '', type: '', dealer: '', page: 1 }; render(); document.querySelector('#main').focus({ preventScroll: true }); break;
      case 'language': lang = lang === 'en' ? 'bn' : 'en'; try { localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* The language toggle still works in memory. */ } modal.close(); render(); break;
      case 'this-month': month = todayLocal().slice(0, 7); filters.page = 1; render(); break;
      case 'enter-demo': enterDemo(); break;
      case 'exit-demo': exitDemo(); break;
      case 'reload': location.reload(); break;
      case 'add-dealer': dealerModal(); break;
      case 'edit-dealer': dealerModal(id); break;
      case 'add-transaction': transactionModal(); break;
      case 'edit-transaction': transactionModal(id); break;
      case 'close-modal': modal.close(); pendingImport = null; break;
      case 'ledger': showLedger(id); break;
      case 'delete-dealer': {
        if (data.transactions.some(t => t.dealerId === id)) { toast(tr('dealerHasTx'), true); break; }
        if (confirm(tr('deleteDealerConfirm'))) { commit({ ...data, dealers: data.dealers.filter(d => d.id !== id), targets: data.targets.filter(t => t.dealerId !== id) }); render(); toast(tr('deleted')); }
        break;
      }
      case 'delete-transaction': if (confirm(tr('deleteTxConfirm'))) { commit({ ...data, transactions: data.transactions.filter(t => t.id !== id) }); render(); toast(tr('deleted')); } break;
      case 'prev-page': filters.page = Math.max(1, filters.page - 1); renderListing(); break;
      case 'next-page': filters.page++; renderListing(); break;
      case 'clear-filters': filters = { q: '', type: '', dealer: '', page: 1 }; render(); break;
      case 'export-transactions': exportTransactions(); break;
      case 'export-dealers': download(`dealerflow-dealers-${month}.csv`, toCSV([['dealer', 'area', 'phone', 'opening_balance_bdt', 'opening_date', 'fridges', 'balance_at_month_end_bdt'], ...filteredDealers().map(r => [r.dealer.name, r.dealer.area, r.dealer.phone, moneyInput(r.dealer.openingBalance), r.dealer.openingDate, r.dealer.fridges, moneyInput(r.closing)])])); break;
      case 'export-report': exportReport(); break;
      case 'export-ledger': {
        const d = data.dealers.find(d => d.id === ledgerId);
        download(`dealerflow-ledger-${month}.csv`, toCSV([['dealer', 'date', 'type', 'amount_bdt', 'reference', 'note', 'running_balance_bdt'], ...(d.openingDate <= monthEnd(month) ? [[d.name, d.openingDate, 'opening_balance', moneyInput(d.openingBalance), '', '', moneyInput(d.openingBalance)]] : []), ...ledgerRows(ledgerId).map(t => [d.name, t.date, t.type, moneyInput(t.amount), t.reference, t.note, moneyInput(t.running)])])); break;
      }
      case 'print': window.print(); break;
      case 'backup': download(`dealerflow-${demo ? 'demo-' : ''}backup-${todayLocal()}.json`, JSON.stringify({ app: 'DealerFlow', exportedAt: new Date().toISOString(), data }, null, 2), 'application/json'); break;
      case 'recovery': if (rawSaved !== null) download(`dealerflow-recovery-${todayLocal()}.json`, rawSaved, 'application/json'); break;
      case 'open-import': importModal(); break;
      case 'template': download('dealerflow-import-template.csv', toCSV([CSV_HEADERS, [data.dealers[0]?.name || 'ADD THIS DEALER FIRST', month + '-05', 'sale', '12500.50', 'INV-001', 'Example sale'], [data.dealers[0]?.name || 'ADD THIS DEALER FIRST', month + '-08', 'collection', '5000.00', 'RCPT-001', 'Example collection']])); break;
      case 'confirm-import': if (pendingImport && !pendingImport.errors.length && pendingImport.transactions.length) { commit({ ...data, transactions: [...data.transactions, ...pendingImport.transactions] }); pendingImport = null; modal.close(); route = 'transactions'; filters = { q: '', type: '', dealer: '', page: 1 }; render(); toast(tr('importComplete')); } break;
      case 'reset': if (!demo && confirm(tr('resetConfirm'))) { commit(emptyData(), true); render(); toast(tr('saved')); } break;
    }
  } catch (error) { if (modal.open) showFormError(error); else { render(); toast(error.message, true); } }
});
document.addEventListener('input', event => { if (event.target.id === 'search') { filters.q = event.target.value; filters.page = 1; renderListing(); } });
document.addEventListener('change', async event => {
  const target = event.target;
  if (target.id === 'month') { if (isMonth(target.value)) { month = target.value; filters.page = 1; render(); } else target.value = month; return; }
  if (target.id === 'filter-type' || target.id === 'filter-dealer') { filters[target.id === 'filter-type' ? 'type' : 'dealer'] = target.value; filters.page = 1; renderListing(); return; }
  const file = target.files?.[0]; if (!file) return;
  try {
    if (target.id === 'csv-file') {
      if (file.size > 2_000_000) throw new Error(tr('tooLarge'));
      importPreview(prepareImport(data, await file.text(), newId));
    } else if (target.id === 'restore-file') {
      if (demo) return;
      if (file.size > 12_000_000) throw new Error(tr('tooLarge'));
      const restored = parseBackup(await file.text());
      if (confirm(`${tr('restoreConfirm')}\n\n${restored.settings.businessName}\n${restored.dealers.length} ${tr('dealers')} · ${restored.transactions.length} ${tr('transactions')}`)) { commit(restored, true); render(); toast(tr('restoreComplete')); }
    }
  } catch (error) { if (modal.open) showFormError(error); else toast(error.message || tr('readFail'), true); }
  finally { target.value = ''; }
});
document.addEventListener('submit', event => {
  // A hidden input named "id" can shadow HTMLFormElement.id in real browsers.
  // Read the attribute instead of relying on named-property resolution.
  const formId = event.target.getAttribute('id');
  if (!['dealer-form', 'transaction-form', 'business-form'].includes(formId)) return;
  event.preventDefault(); const values = Object.fromEntries(new FormData(event.target));
  try {
    if (formId === 'dealer-form') {
      const id = values.id || newId(), dealer = { id, name: values.name.trim(), area: values.area.trim(), phone: values.phone.trim(), openingDate: values.openingDate, openingBalance: parseMoney(values.openingBalance, { allowZero: true }), fridges: Number(values.fridges) };
      const target = { dealerId: id, month, amount: parseMoney(values.target, { allowZero: true }) };
      commit({ ...data, dealers: values.id ? data.dealers.map(d => d.id === id ? dealer : d) : [...data.dealers, dealer], targets: [...data.targets.filter(t => !(t.dealerId === id && t.month === month)), target] });
      modal.close(); render(); toast(tr('saved'));
    } else if (formId === 'transaction-form') {
      const id = values.id || newId(), tx = { id, dealerId: values.dealerId, date: values.date, type: values.type, amount: parseMoney(values.amount), reference: values.reference.trim(), note: values.note.trim() };
      commit({ ...data, transactions: values.id ? data.transactions.map(t => t.id === id ? tx : t) : [...data.transactions, tx] });
      month = tx.date.slice(0, 7); filters.page = 1; modal.close(); render(); toast(tr('saved'));
    } else { commit({ ...data, settings: { ...data.settings, businessName: values.businessName.trim() } }); render(); toast(tr('saved')); }
  } catch (error) { if (modal.open) showFormError(error); else toast(error.message, true); }
});
window.addEventListener('storage', event => {
  if ((event.key === STORAGE_KEY || event.key === null) && event.newValue !== rawSaved) { changedElsewhere = true; if (!demo && !modal.open) render(); }
});
render();
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* App remains usable online if offline caching is unavailable. */ });
}
