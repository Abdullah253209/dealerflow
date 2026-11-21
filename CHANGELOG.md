# Changelog

## 1.0.0 — 2026-11-21

Initial source release.

- English/Bangla browser-local workspace with separate fictional demo.
- Dealer opening balances, month-specific targets and fridge counts.
- Sales/collection CRUD, filtering, pagination and dealer ledgers.
- Monthly reconciliation, receivables, credits and performance reporting.
- Validated CSV import, duplicate skipping, exports and JSON backups.
- Responsive and print styles and offline app-shell caching.
- Built-in Node test suite, static build and optional GitHub Pages workflow.
- English/Bangla documentation and contribution/security guidance.

Pre-publication review fixes:

- Read a submitted form's ID with `getAttribute('id')`, preventing a hidden ID input from bypassing the submit handler and navigating instead of saving. The regression harness now models this browser behavior.
- Remove the fixed minimum body width and use single-column KPI cards on the narrowest screens so Bengali amounts remain readable.
- Refresh the app-shell cache version and verify deployment assets under `/dealerflow/`.

Browser review verified saves, calculations, persistence, CSV import/export, backup download, responsive layouts and offline reload. Print/PDF, full keyboard/screen-reader, UI backup restore and other browser engines remain unverified. See `docs/BROWSER_QA.md` and `docs/MANUAL_TESTING.md`.
