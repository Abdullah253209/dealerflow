# Pre-publication browser review — 2026-11-21

Environment: Windows in-app browser, served from the built `dist/` files. Exact browser engine/version was not captured. All test records were fictional. Results apply to this reviewed build, not every browser or deployment environment.

## Problems found and corrected

1. **Forms navigated instead of saving.** The hidden `name="id"` input shadowed the form's `.id` property, so the document submit handler returned before calling `preventDefault()`. The handler now reads `getAttribute('id')`. The automated form harness models a shadowed `.id`, and actual dealer and transaction saves were repeated successfully in the browser.
2. **Narrow-screen clipping.** A fixed 320 px body minimum overflowed a 320 px window with a non-overlay scrollbar. Removing that minimum corrected the page width. KPI cards switch to one column below 361 px so Bengali amounts are readable.

## Verified in the browser

| Check | Observed result |
| --- | --- |
| Empty workspace and demo | Real workspace starts empty; demo has fictional records and stays separate |
| Dealer creation | Opening Tk 100.10, November target Tk 500 and 2 fridges saved without navigation |
| Sale and collection saves | Tk 200.20 sale and Tk 350.30 collection produced Tk 50.00 dealer credit |
| Reconciliation | Opening 100.10 + sales 200.20 − collections 350.30 = closing −50.00 |
| CSV import | Two identical input rows previewed as 1 new row and 1 skipped duplicate; confirmation added one record |
| Invalid import | Unknown dealer produced an error and disabled import; existing records stayed intact |
| Opening date guard | Moving opening date after an existing sale was rejected |
| Persistence | Records and Bengali language preference survived reload |
| Search, filters and pagination | Demo month had 30 records; page 2 had 10; sale + dealer + reference filters returned the expected one record |
| Actual CSV download | Downloaded CSV parsed into the header and one matching sale: Meghna Traders, 2026-11-21, Tk 105655.00, INV-0155 |
| Actual JSON backup download | Downloaded demo JSON passed `parseBackup`: 5 dealers, 180 transactions and 30 targets |
| Responsive layouts | Default desktop, 390 px and 320 px checked; final 320 px page width matched its 305 px content viewport and all four KPI values fitted |
| Modal keyboard close | Escape closed the transaction modal |
| Project path | App, styles, scripts, icon and service worker loaded under `/dealerflow/` |
| Offline reload | After both local servers were stopped, root and project-path app shells reloaded from cache; saved records remained |

After importing the extra Tk 12.34 sale, saved sales were Tk 212.54, collections Tk 350.30 and credit Tk 37.66. Those values were still present after stopping the server and reloading offline.

The downloaded demo backup's November figures, in integer paisa, were sales 99,117,500; collections 90,617,000; receivables 65,367,200; credits 1,778,700. They matched the demo dashboard.

## Automated verification

The Node suite has 21 tests covering financial calculations, validation, CSV, backups, corrupt-storage protection, demo isolation, stale writes and form submission with a shadowed ID property. JavaScript syntax checks and the static build also pass. Documentation links, bilingual strings, JSON files, package contents and source/build parity are checked during packaging.

## Not yet verified

- Actual Print / Save as PDF output and pagination.
- Full Tab/Shift+Tab focus coverage, 200% zoom and screen-reader behavior.
- UI-driven backup restoration into a separate browser profile; parser round-trip is automated.
- Firefox, Safari and real mobile-device browsers.
- GitHub-hosted Actions runs and deployment; these require the owner to publish the repository first.

Use `MANUAL_TESTING.md` for remaining release checks. These limitations are not a claim that the features are broken; they identify the bounds of this review.
