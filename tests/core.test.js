import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney, moneyInput, isDate, monthEnd, shiftMonth, emptyData, validateData, monthlyReport, summary, balanceAt, parseCSV, toCSV, csvCell, prepareImport, parseBackup, makeDemo } from '../core.js';
const dealer = (overrides = {}) => ({ id: 'd1', name: 'Test Dealer', area: 'Central', phone: '', fridges: 2, openingBalance: 10000, openingDate: '2026-01-01', ...overrides });
const tx = (overrides = {}) => ({ id: 't1', dealerId: 'd1', date: '2026-02-05', type: 'sale', amount: 20000, reference: 'INV-1', note: '', ...overrides });
const workspace = (transactions = [], dealers = [dealer()], targets = []) => validateData({ ...emptyData(), dealers, transactions, targets });

test('money: exact paisa, Bengali digits, zero rules and round trip', () => {
  assert.equal(parseMoney('0.10') + parseMoney('0.20'), 30);
  assert.equal(parseMoney('১২৩৪.৫৬'), 123456);
  assert.equal(parseMoney('0', { allowZero: true }), 0);
  assert.equal(parseMoney('1000000000.00'), 100000000000);
  assert.equal(moneyInput(123456), '1234.56');
  for (const value of ['', '-1', '0', '1.234', '1e3', '1,000', 'NaN', 'Infinity', '1000000000.01']) assert.throws(() => parseMoney(value));
});
test('calendar: leap years, impossible dates and month boundaries', () => {
  assert.equal(isDate('2024-02-29'), true);
  assert.equal(isDate('2026-02-29'), false);
  assert.equal(isDate('2026-04-31'), false);
  assert.equal(isDate('2026-1-01'), false);
  assert.equal(isDate('1899-12-31'), false);
  assert.equal(monthEnd('2024-02'), '2024-02-29');
  assert.equal(monthEnd('2026-12'), '2026-12-31');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('monthly balance carries prior transactions and excludes future ones', () => {
  const data = workspace([tx({ id: 'a', date: '2026-01-10', amount: 5000 }), tx(), tx({ id: 'b', type: 'collection', amount: 7000, date: '2026-02-28' }), tx({ id: 'c', amount: 999999, date: '2026-03-01' })]);
  const row = monthlyReport(data, '2026-02')[0];
  assert.equal(row.opening, 15000); assert.equal(row.sales, 20000); assert.equal(row.collections, 7000); assert.equal(row.closing, 28000);
  assert.equal(balanceAt(data, 'd1', '2026-02-28'), 28000);
});
test('mid-month opening is shown separately and always reconciles', () => {
  const data = workspace([tx({ date: '2026-02-20', amount: 30000 })], [dealer({ openingDate: '2026-02-15' })]);
  const row = monthlyReport(data, '2026-02')[0];
  assert.equal(row.opening, 0); assert.equal(row.introduced, 10000); assert.equal(row.closing, 40000);
  assert.equal(balanceAt(data, 'd1', '2026-02-14'), 0);
  assert.equal(monthlyReport(data, '2026-01')[0].closing, 0);
  assert.equal(monthlyReport(data, '2026-03')[0].opening, 40000);
});
test('opening on first day, month end and a future month is applied once', () => {
  for (const openingDate of ['2026-02-01', '2026-02-28', '2026-03-01']) {
    const data = workspace([], [dealer({ openingDate })]);
    const r = monthlyReport(data, '2026-02')[0];
    assert.equal(r.closing, openingDate <= '2026-02-28' ? 10000 : 0);
    assert.equal(r.opening + r.introduced, r.closing);
  }
});
test('overpayments remain dealer credits; they do not cancel another dealer’s due', () => {
  const data = workspace([tx({ type: 'collection', amount: 15000 })], [dealer(), dealer({ id: 'd2', name: 'Other', openingBalance: 7000 })]);
  const s = summary(data, '2026-02');
  assert.equal(s.credit, 5000); assert.equal(s.outstanding, 7000); assert.equal(s.net, 2000);
});
test('targets are specific to dealer and month; zero targets are valid', () => {
  const data = workspace([tx()], [dealer()], [{ dealerId: 'd1', month: '2026-02', amount: 25000 }, { dealerId: 'd1', month: '2026-03', amount: 0 }]);
  assert.equal(summary(data, '2026-02').target, 25000);
  assert.equal(summary(data, '2026-01').target, 0);
});
test('financial invariant across a deterministic multi-month dataset', () => {
  const data = makeDemo('2026-11');
  for (const month of ['2026-05', '2026-06', '2026-07', '2026-11', '2026-12']) {
    for (const row of monthlyReport(data, month)) {
      assert.equal(row.closing, row.opening + row.introduced + row.sales - row.collections);
      assert.equal(row.closing, balanceAt(data, row.dealer.id, monthEnd(month)));
      assert.equal(Number.isSafeInteger(row.closing), true);
    }
  }
});
test('validation rejects orphan transactions, duplicate names/IDs and bad numeric types', () => {
  assert.throws(() => workspace([tx({ dealerId: 'missing' })]));
  assert.throws(() => workspace([tx(), tx()]));
  assert.throws(() => workspace([], [dealer(), dealer({ id: 'd2', name: '  TEST   DEALER  ' })]));
  assert.throws(() => workspace([], [dealer({ fridges: 1.5 })]));
  assert.throws(() => workspace([tx({ amount: '20000' })]));
  assert.throws(() => workspace([tx({ date: '2025-12-31' })]));
  assert.throws(() => workspace([tx({ type: '__proto__' })]));
  assert.throws(() => workspace([], [dealer({ openingBalance: -1 })]));
  assert.throws(() => workspace([], [dealer()], [{ dealerId: 'd1', month: '2026-02', amount: 1 }, { dealerId: 'd1', month: '2026-02', amount: 2 }]));
});
test('import whitelists properties and does not mutate the source', () => {
  const raw = { ...emptyData(), dealers: [dealer({ unexpected: 'drop me' })], hidden: 'drop me' };
  const result = validateData(raw);
  assert.equal('unexpected' in result.dealers[0], false); assert.equal('hidden' in result, false);
  assert.equal(raw.dealers[0].unexpected, 'drop me');
});
test('CSV parses BOM, CRLF, quoted commas, escaped quotes and multiline cells', () => {
  assert.deepEqual(parseCSV('\uFEFFa,b\r\n"hello, world","a ""quote""\nnext"\r\n'), [['a', 'b'], ['hello, world', 'a "quote"\nnext']]);
  assert.throws(() => parseCSV('a,b\n"never closed,b'));
  assert.throws(() => parseCSV('a,b\n"closed"junk,b'));
  assert.throws(() => parseCSV('a,b\nbad"quote,b'));
});
test('CSV export preserves text and neutralises spreadsheet formulas', () => {
  for (const value of ['=SUM(A1:A3)', '+123', '-123', '@SUM(1)', ' \t=1+1', '\t123']) assert.ok(csvCell(value).startsWith("'"));
  const text = toCSV([['name', 'note'], ['ডিলার', 'comma, newline\n"quote"']]);
  assert.deepEqual(parseCSV(text), [['name', 'note'], ['ডিলার', 'comma, newline\n"quote"']]);
});
test('CSV import: valid rows, duplicate detection, Bengali amounts and no partial mutation', () => {
  const data = workspace([tx()]); let sequence = 0;
  const csv = 'dealer,date,type,amount,reference,note\nTest Dealer,2026-02-05,sale,200.00,INV-1,\nTest Dealer,2026-02-06,collection,৫০.২৫,R1,Payment\nTest Dealer,2026-02-06,collection,৫০.২৫,R1,Payment\nMissing Dealer,2026-02-06,sale,100,X,\n';
  const result = prepareImport(data, csv, () => `new-${++sequence}`);
  assert.equal(result.transactions.length, 1); assert.equal(result.transactions[0].amount, 5025);
  assert.equal(result.skipped, 2); assert.equal(result.errors.length, 1); assert.equal(result.errors[0].row, 5);
  assert.equal(data.transactions.length, 1);
});
test('CSV rejects missing/duplicate headers, bad column count and pre-opening dates', () => {
  const data = workspace();
  assert.throws(() => prepareImport(data, 'dealer,amount\nTest Dealer,1', () => 'n'));
  assert.throws(() => prepareImport(data, 'dealer,date,type,amount,note,note\na,b,c,d,e,f', () => 'n'));
  const result = prepareImport(data, 'dealer,date,type,amount,reference,note\nTest Dealer,2025-12-01,sale,1,x,\nTest Dealer,2026-02-01,sale,1', () => 'n');
  assert.equal(result.errors.length, 2); assert.equal(result.transactions.length, 0);
});
test('JSON backup round trip preserves all accounting records and rejects foreign versions', () => {
  const data = makeDemo('2026-11');
  assert.deepEqual(parseBackup(JSON.stringify({ app: 'DealerFlow', exportedAt: '2026-11-21', data })), data);
  assert.throws(() => parseBackup('{invalid'));
  assert.throws(() => parseBackup(JSON.stringify({ app: 'Other', data })));
  assert.throws(() => parseBackup(JSON.stringify({ app: 'DealerFlow', data: { ...data, schemaVersion: 9 } })));
});
