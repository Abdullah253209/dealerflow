// DOM-free integration checks exercise the actual UI event handlers and storage.
// They are not a substitute for the browser checklist or visual verification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, validateData } from '../core.js';

const KEY = 'dealerflow.workspace.v1';
async function setup(initial = null) {
  const saved = new Map(initial === null ? [] : [[KEY, initial]]), listeners = {}, windowListeners = {};
  let writes = 0;
  const elements = new Map();
  const element = () => ({ innerHTML: '', textContent: '', className: '', open: false, focus() {}, scrollIntoView() {}, querySelector() { return null; }, showModal() { this.open = true; }, close() { this.open = false; } });
  for (const id of ['#app', '#modal', '#toast', '#main', '#listing', '#form-error']) elements.set(id, element());
  globalThis.document = { documentElement: {}, title: '', querySelector: selector => elements.get(selector) ?? null, addEventListener: (name, handler) => listeners[name] = handler };
  globalThis.window = { addEventListener: (name, handler) => windowListeners[name] = handler };
  globalThis.location = { protocol: 'file:', reload() {} };
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => { writes++; saved.set(key, value); } };
  globalThis.FormData = class { constructor(form) { this.values = Object.entries(form.values); } [Symbol.iterator]() { return this.values[Symbol.iterator](); } };
  globalThis.confirm = () => true;
  await import(`../app.js?test=${crypto.randomUUID()}`);
  const click = (action, other = {}) => listeners.click({ preventDefault() {}, target: { closest: () => ({ dataset: { action, ...other } }) } });
  // HTMLFormElement's named properties may shadow .id with its hidden id input.
  const submit = (id, values) => listeners.submit({ preventDefault() {}, target: { id: { tagName: 'INPUT' }, getAttribute: name => name === 'id' ? id : null, values } });
  return { click, submit, saved, elements, windowListeners, writes: () => writes };
}
test('a new workspace renders empty and does not write on load', async () => {
  const env = await setup();
  assert.match(env.elements.get('#app').innerHTML, /Good business starts/);
  assert.equal(env.writes(), 0);
  assert.equal(env.saved.has(KEY), false);
});
test('editing a real workspace saves validated data', async () => {
  const env = await setup();
  env.submit('business-form', { businessName: 'Example Business' });
  assert.equal(JSON.parse(env.saved.get(KEY)).settings.businessName, 'Example Business');
  assert.equal(env.writes(), 1);
});
test('demo edits never write to or replace an existing real workspace', async () => {
  const real = emptyData(); real.settings.businessName = 'My real business';
  const original = JSON.stringify(real), env = await setup(original);
  env.click('enter-demo');
  assert.match(env.elements.get('#app').innerHTML, /Riverbank Distribution/);
  env.submit('business-form', { businessName: 'Changed demo name' });
  assert.equal(env.saved.get(KEY), original); assert.equal(env.writes(), 0);
  env.click('exit-demo');
  assert.match(env.elements.get('#app').innerHTML, /My real business/);
  assert.doesNotMatch(env.elements.get('#app').innerHTML, /Changed demo name/);
});
test('unreadable saved records are preserved and block accidental writes', async () => {
  const env = await setup('{broken');
  assert.match(env.elements.get('#app').innerHTML, /Saved data could not be loaded/);
  env.submit('business-form', { businessName: 'Must not overwrite' });
  assert.equal(env.saved.get(KEY), '{broken'); assert.equal(env.writes(), 0);
  assert.match(env.elements.get('#toast').textContent, /not been overwritten/);
});
test('stale writes are blocked even before a storage event arrives', async () => {
  const env = await setup(JSON.stringify(emptyData()));
  const other = emptyData(); other.settings.businessName = 'Another tab';
  const encoded = JSON.stringify(other); env.saved.set(KEY, encoded);
  env.submit('business-form', { businessName: 'Stale tab' });
  assert.equal(env.saved.get(KEY), encoded); assert.equal(env.writes(), 0);
  assert.match(env.elements.get('#toast').textContent, /Another tab changed/);
});
test('forms save precise amounts even when a hidden id input shadows form.id', async () => {
  const env = await setup();
  env.submit('dealer-form', { id: '', name: 'Test Dealer', area: 'Central', phone: '', openingDate: '2026-11-01', openingBalance: '100.10', target: '500', fridges: '2' });
  const first = JSON.parse(env.saved.get(KEY)), dealerId = first.dealers[0].id;
  env.submit('transaction-form', { id: '', dealerId, date: '2026-11-05', type: 'sale', amount: '0.20', reference: 'I-1', note: '' });
  const data = validateData(JSON.parse(env.saved.get(KEY)));
  assert.equal(data.dealers[0].openingBalance + data.transactions[0].amount, 10030);
  assert.equal(data.transactions[0].amount, 20);
});
