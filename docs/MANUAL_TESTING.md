# Manual browser verification checklist

Status: **partially completed**, updated 2026-11-21. Checked items below were observed in the Windows in-app browser; other engines and full coverage remain pending. See [the review record](BROWSER_QA.md). Use fictional records and a separate browser profile or dedicated test origin. Do not erase an existing real workspace to test.

## Smoke checks

- [x] Run `npm run check`, `npm test` and `npm run build`, and serve the built output. The in-app preview used a host-side static server because the sandboxed server could not be reached by the browser.
- [ ] Open a current Chrome/Edge and Firefox. Confirm the default workspace is empty and the console contains no application errors.
- [ ] Explore demo; inspect six months, credits, reports and one dealer ledger. Demo overview and credits checked; full ledger interaction still pending.
- [x] Switch to the real workspace and verify demo records were not copied. Reload; confirm no demo data was persisted.
- [x] Switch English/Bangla; reload and confirm language preference remains.

## Accounting workflow

- [ ] Add Test Dealer, opening Tk 100.00 on the first of a test month, target Tk 500.00 and 2 fridges.
- [ ] Add sale Tk 200.10 and collection Tk 50.05 in that month. Verify sales Tk 200.10, collections Tk 50.05, closing Tk 250.05, achievement 40.02% before display rounding, and sales/fridge Tk 100.05.
- [ ] Add another collection Tk 300.05. Verify closing −Tk 50.00, credit Tk 50.00 and outstanding Tk 0.00.
- [ ] Add another dealer with Tk 75.00 due. Verify total outstanding Tk 75.00, credits Tk 50.00 and net Tk 25.00.
- [ ] Edit and delete only these disposable test entries. Verify every affected balance updates.
- [ ] Try to delete a dealer with transactions. Verify the operation is blocked.
- [ ] Add a mid-month opening balance. Verify it is shown as introduced, not included in prior months.
- [ ] Try an invalid amount, duplicate dealer name or transaction before the opening date. Verify it does not save. Automated coverage exists; browser verified moving the opening date after existing transactions is blocked.
- [ ] Move to a future month; ensure prior balances carry forward and next-month transactions do not leak backward.

## Import/export and persistence

- [x] Import a fixture with two identical fictional rows. Verify preview first, then one record saved and one exact duplicate skipped after confirmation. Template download itself remains pending.
- [ ] Re-import the same file. Verify both duplicates are skipped.
- [x] Import an invalid dealer row. Verify import is blocked and existing records stay intact. Mixed valid/invalid atomicity is covered by the automated import tests.
- [ ] Import a UTF-8 Bengali name with a quoted comma and a multiline note. Verify display/export.
- [x] Export a filtered transaction list and confirm its CSV contains exactly those records.
- [ ] Export JSON; restore it into a separate test profile and compare counts, targets and balances.
- [ ] Reject invalid JSON, unsupported schema versions and orphan transactions without losing current records.
- [ ] Edit in a second tab. Verify the first tab blocks stale edits until reloaded.
- [x] Verify search, type/dealer filters and pagination with the demo's 180 transactions across six months.

## Layout, accessibility and offline

- [ ] Complete 1440 px, 1024 px and 768 px checks. Default desktop, 390 px and 320 px were checked. Tables may scroll horizontally; the page itself should not.
- [ ] Complete Tab/Shift+Tab/Enter and focus-return checks. Escape closing the transaction modal was verified.
- [ ] Check at 200% zoom. Read labels, values, errors and focus outlines.
- [ ] Use a screen reader to inspect a modal, financial table and the chart's data table.
- [ ] Reports → Print / PDF: check portrait and landscape previews, repeated table headers, complete totals and no sidebar/navigation.
- [x] Stop the preview servers after service-worker activation; reload root and subdirectory URLs. Verify cached shell loads and saved records persist.
- [x] Serve under `/dealerflow/` and verify relative JS, style, icon and worker paths. Actual GitHub deployment remains pending publication.
- [x] Download CSV and JSON in the test browser and parse their actual contents. Other device download behavior remains pending.

Record browser/version, date, passed items, failures and any workarounds in a release issue before calling this checklist complete.
