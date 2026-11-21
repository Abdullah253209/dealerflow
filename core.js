/** Pure accounting and validation. Money is always integer paisa (BDT x 100). */
export const VERSION = 1;
export const MAX_MONEY = 100_000_000_000;
export const MAX_TRANSACTIONS = 10_000;
export const MAX_DEALERS = 500;
export const CSV_HEADERS = ['dealer', 'date', 'type', 'amount', 'reference', 'note'];
export class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}
function must(condition, message) { if (!condition) throw new ValidationError(message); }
export function digits(value) { return String(value).replace(/[০-৯]/g, ch => String('০১২৩৪৫৬৭৮৯'.indexOf(ch))); }
export function parseMoney(value, { allowZero = false } = {}) {
  const source = digits(value).trim();
  must(/^\d+(?:\.\d{1,2})?$/.test(source), 'Use a positive amount with at most 2 decimal places; omit commas.');
  const [whole, fraction = ''] = source.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  must(Number.isSafeInteger(amount) && amount <= MAX_MONEY && (allowZero ? amount >= 0 : amount > 0), 'Amount must be within Tk 1 billion and greater than zero (except an opening balance or target).');
  return amount;
}
export function moneyInput(amount) { must(Number.isSafeInteger(amount), 'Invalid stored money.'); return (amount / 100).toFixed(2); }
export function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (year < 1900 || year > 2100) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}
export function isMonth(value) { return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value) && isDate(value + '-01'); }
export function monthEnd(month) {
  must(isMonth(month), 'Choose a valid month between 1900 and 2100.');
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
}
export function shiftMonth(month, offset) {
  must(isMonth(month), 'Invalid month.');
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function todayLocal(now = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function emptyData() { return { schemaVersion: VERSION, settings: { businessName: 'My business' }, dealers: [], transactions: [], targets: [] }; }
const text = (v, max, label, required = false) => {
  must(typeof v === 'string' && v.length <= max && (!required || v.trim().length > 0), `${label} is required or exceeds ${max} characters.`);
  must(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v), `${label} contains unsupported control characters.`);
  return v.trim();
};
const validId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
const validMoney = (v, zero = true) => Number.isSafeInteger(v) && v <= MAX_MONEY && (zero ? v >= 0 : v > 0);
export const nameKey = name => name.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
/** Return a whitelisted, validated copy. Imported data is never trusted. */
export function validateData(raw) {
  must(raw && raw.schemaVersion === VERSION, 'Unsupported workspace version. Expected version 1.');
  must(raw.settings && typeof raw.settings === 'object', 'Missing workspace settings.');
  must(Array.isArray(raw.dealers) && raw.dealers.length <= MAX_DEALERS, `Maximum ${MAX_DEALERS} dealers allowed.`);
  must(Array.isArray(raw.transactions) && raw.transactions.length <= MAX_TRANSACTIONS, `Maximum ${MAX_TRANSACTIONS} transactions allowed.`);
  must(Array.isArray(raw.targets) && raw.targets.length <= 60_000, 'Invalid or excessive targets.');
  const data = emptyData(), ids = new Set(), names = new Set();
  data.settings.businessName = text(raw.settings.businessName, 80, 'Business name', true);
  data.dealers = raw.dealers.map(d => {
    must(d && validId(d.id) && !ids.has(d.id), 'Dealer IDs must be valid and unique.');
    ids.add(d.id);
    const name = text(d.name, 100, 'Dealer name', true), key = nameKey(name);
    must(!names.has(key), 'Each dealer needs a unique name.'); names.add(key);
    must(validMoney(d.openingBalance) && isDate(d.openingDate), 'Invalid dealer opening balance or opening date.');
    must(Number.isInteger(d.fridges) && d.fridges >= 0 && d.fridges <= 10_000, 'Fridges must be an integer from 0 to 10,000.');
    return { id: d.id, name, area: text(d.area, 100, 'Area'), phone: text(d.phone, 40, 'Phone'), openingBalance: d.openingBalance, openingDate: d.openingDate, fridges: d.fridges };
  });
  const dealerMap = new Map(data.dealers.map(d => [d.id, d])), transactionIds = new Set();
  data.transactions = raw.transactions.map(t => {
    must(t && validId(t.id) && !transactionIds.has(t.id), 'Transaction IDs must be valid and unique.'); transactionIds.add(t.id);
    const dealer = dealerMap.get(t.dealerId);
    must(dealer, 'A transaction refers to a missing dealer.');
    must(isDate(t.date) && t.date >= dealer.openingDate, 'Transaction date must be on or after the dealer opening date.');
    must(t.type === 'sale' || t.type === 'collection', 'Transaction type must be sale or collection.');
    must(validMoney(t.amount, false), 'Invalid transaction amount.');
    return { id: t.id, dealerId: t.dealerId, date: t.date, type: t.type, amount: t.amount, reference: text(t.reference, 80, 'Reference'), note: text(t.note, 300, 'Note') };
  });
  const targetKeys = new Set();
  data.targets = raw.targets.map(t => {
    must(t && ids.has(t.dealerId) && isMonth(t.month) && validMoney(t.amount), 'Invalid monthly target.');
    const key = `${t.dealerId}|${t.month}`;
    must(!targetKeys.has(key), 'Duplicate dealer target for the same month.'); targetKeys.add(key);
    return { dealerId: t.dealerId, month: t.month, amount: t.amount };
  });
  return data;
}
/** Opening balances apply at the START of openingDate. Negative balances are credit. */
export function balanceAt(data, dealerId, date) {
  const dealer = data.dealers.find(d => d.id === dealerId);
  must(dealer && isDate(date), 'Unknown dealer or invalid balance date.');
  let amount = dealer.openingDate <= date ? dealer.openingBalance : 0;
  for (const t of data.transactions) if (t.dealerId === dealerId && t.date <= date) amount += t.type === 'sale' ? t.amount : -t.amount;
  return amount;
}
export function monthlyReport(data, month) {
  const end = monthEnd(month), start = month + '-01';
  const totals = new Map(data.dealers.map(d => [d.id, { dealer: d, sales: 0, collections: 0, opening: d.openingDate <= start ? d.openingBalance : 0, target: 0 }]));
  for (const t of data.transactions) {
    const row = totals.get(t.dealerId);
    if (t.date < start) row.opening += t.type === 'sale' ? t.amount : -t.amount;
    else if (t.date <= end) row[t.type === 'sale' ? 'sales' : 'collections'] += t.amount;
  }
  for (const row of totals.values()) row.introduced = row.dealer.openingDate > start && row.dealer.openingDate <= end ? row.dealer.openingBalance : 0;
  for (const t of data.targets) if (t.month === month) totals.get(t.dealerId).target = t.amount;
  return [...totals.values()].map(row => ({ ...row, closing: row.opening + row.introduced + row.sales - row.collections }));
}
export function summary(data, month) {
  const rows = monthlyReport(data, month), sum = key => rows.reduce((total, r) => total + r[key], 0);
  return { sales: sum('sales'), collections: sum('collections'), target: sum('target'), outstanding: rows.reduce((v, r) => v + Math.max(0, r.closing), 0), credit: rows.reduce((v, r) => v + Math.max(0, -r.closing), 0), net: sum('closing'), rows };
}
/** RFC-4180 style CSV: BOM, CRLF, quoted commas, escaped quotes and multiline cells. */
export function parseCSV(source) {
  must(typeof source === 'string' && source.length <= 2_000_000, 'CSV must be 2 MB or smaller.');
  source = source.replace(/^\uFEFF/, '');
  const rows = []; let row = [], field = '', quoted = false, closed = false;
  const endField = () => { row.push(field); field = ''; closed = false; };
  const endRow = () => { endField(); if (row.some(v => v.trim() !== '')) rows.push(row); row = []; must(rows.length <= MAX_TRANSACTIONS + 1, 'Too many CSV rows.'); };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"') { if (source[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } }
      else field += c;
    } else if (c === ',') endField();
    else if (c === '\n' || c === '\r') { if (c === '\r' && source[i + 1] === '\n') i++; endRow(); }
    else if (c === '"') { must(!field && !closed, 'Unexpected quote in CSV.'); quoted = true; }
    else { must(!closed, 'Unexpected characters after a closing CSV quote.'); field += c; }
  }
  must(!quoted, 'CSV has an unclosed quoted field.');
  if (field || row.length || closed) endRow();
  return rows;
}
export function csvCell(value) {
  let valueText = String(value ?? '');
  if (/^[\s\uFEFF]*[=+@-]/.test(valueText) || /^[\t\r\n]/.test(valueText)) valueText = "'" + valueText;
  return /[",\r\n]/.test(valueText) ? '"' + valueText.replaceAll('"', '""') + '"' : valueText;
}
export const toCSV = rows => '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
export function transactionKey(t) { return JSON.stringify([t.dealerId, t.date, t.type, t.amount, t.reference, t.note]); }
export function prepareImport(data, source, makeId) {
  const rows = parseCSV(source);
  must(rows.length > 1, 'CSV needs a header and at least one data row.');
  const headers = rows[0].map(h => h.trim().toLowerCase());
  must(headers.length === CSV_HEADERS.length && new Set(headers).size === headers.length && CSV_HEADERS.every(h => headers.includes(h)), `Required CSV columns: ${CSV_HEADERS.join(', ')}.`);
  const names = new Map(data.dealers.map(d => [nameKey(d.name), d])), seen = new Set(data.transactions.map(transactionKey));
  const transactions = [], errors = []; let skipped = 0;
  rows.slice(1).forEach((row, i) => {
    try {
      must(row.length === headers.length, 'Column count does not match the header.');
      const item = Object.fromEntries(headers.map((h, j) => [h, row[j].trim()])), dealer = names.get(nameKey(item.dealer));
      must(dealer, `Unknown dealer: ${item.dealer}. Add the dealer first.`);
      const candidate = { id: makeId(), dealerId: dealer.id, date: item.date, type: item.type.toLowerCase(), amount: parseMoney(item.amount), reference: item.reference, note: item.note };
      const checked = validateData({ ...emptyData(), dealers: [dealer], transactions: [candidate] }).transactions[0], key = transactionKey(checked);
      if (seen.has(key)) skipped++; else { transactions.push(checked); seen.add(key); }
    } catch (error) { errors.push({ row: i + 2, message: error.message }); }
  });
  if (data.transactions.length + transactions.length > MAX_TRANSACTIONS) errors.push({ row: 0, message: `Import would exceed ${MAX_TRANSACTIONS} transactions.` });
  return { transactions, skipped, errors };
}
export function parseBackup(source) {
  must(typeof source === 'string' && source.length <= 12_000_000, 'Backup must be 12 MB or smaller.');
  let raw; try { raw = JSON.parse(source); } catch { throw new ValidationError('This is not a valid JSON backup.'); }
  must(raw && raw.app === 'DealerFlow' && raw.data, 'Choose a DealerFlow JSON backup.');
  return validateData(raw.data);
}
export function makeDemo(month) {
  const data = emptyData(); data.settings.businessName = 'Riverbank Distribution';
  const first = shiftMonth(month, -5) + '-01';
  data.dealers = [
    ['d1', 'Meghna Traders', 'Central market', '01700 000001', 6850000, 18],
    ['d2', 'North Star Store', 'North zone', '01700 000002', 4200000, 12],
    ['d3', 'Green Valley Mart', 'West zone', '01700 000003', 2500000, 9],
    ['d4', 'Sunrise Enterprise', 'East zone', '01700 000004', 1200000, 7],
    ['d5', 'Bluebird Retail', 'South zone', '01700 000005', 0, 4]
  ].map(([id, name, area, phone, openingBalance, fridges]) => ({ id, name, area, phone, openingBalance, fridges, openingDate: first }));
  let sequence = 0;
  for (let m = -5; m <= 0; m++) {
    const current = shiftMonth(month, m);
    data.dealers.forEach((d, i) => {
      data.targets.push({ dealerId: d.id, month: current, amount: [32000000, 24000000, 18000000, 14000000, 10000000][i] });
      for (const day of [4, 12, 21]) {
        const amount = Math.round(([98000, 72500, 54000, 41000, 29000][i] + (m + 5) * 1300 + day * 55) * 100);
        data.transactions.push({ id: `demo${++sequence}`, dealerId: d.id, date: `${current}-${String(day).padStart(2, '0')}`, type: 'sale', amount, reference: `INV-${String(sequence).padStart(4, '0')}`, note: 'Fictional sample record' });
        data.transactions.push({ id: `demo${++sequence}`, dealerId: d.id, date: `${current}-${String(day + 2).padStart(2, '0')}`, type: 'collection', amount: Math.round(amount * (i === 4 ? 1.03 : 0.90) / 100) * 100, reference: `RCPT-${String(sequence).padStart(4, '0')}`, note: 'Fictional sample record' });
      }
    });
  }
  return validateData(data);
}
