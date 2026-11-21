<p align="center"><img src="assets/logo.svg" width="64" alt="DealerFlow logo"></p>
<h1 align="center">DealerFlow</h1>
<p align="center"><strong>A clearer view of business.</strong><br>Free, bilingual sales and collection tracking for small distributors.</p>
<p align="center">English · বাংলা · BDT · Local-first · MIT licensed · No runtime dependencies</p>

**[বাংলা নির্দেশনা](README.bn.md)** · **[GitHub publishing guide](PUBLISH_GUIDE_BN.md)** · **[Contributing](CONTRIBUTING.md)** · **[Security](SECURITY.md)**

DealerFlow helps a small distributor answer three daily questions: what did we sell, what did we collect, and how much does each dealer owe? It runs entirely in the browser, without an account, an API key or a backend. The default workspace starts empty; a separate, editable demo contains fictional records.

This is an early-stage open-source project. No user numbers, downloads, stars or production adoption are claimed.

## What it does

| Area | Features |
| --- | --- |
| Overview | Monthly sales, collections, outstanding receivables, dealer credits, target achievement, six-month chart and top dealers |
| Dealer directory | Unique dealer names, phone, area/route, opening balance and date, fridge count, month-specific targets, edit/delete and individual ledgers |
| Transactions | Add, edit and delete sales and collections; search, filter, pagination and CSV export |
| Reports | Opening-to-closing reconciliation, separate mid-month opening balances, target performance and sales per fridge |
| Import | UTF-8 CSV exported from Excel/Sheets, validation preview, exact duplicate skipping and all-or-nothing confirmation |
| Backups | Validated JSON backup/restore; recovery download when existing saved data cannot be read |
| Language | English/Bangla interface, local number/date formatting and Bengali digit amount entry |
| Access | Responsive layouts, keyboard navigation, labelled form controls, chart data table and browser Print / Save as PDF |
| Offline | Service-worker app-shell caching after a successful initial online visit on HTTPS or localhost |

## Run locally

Use **Node.js 22 or newer** (Node 24 recommended). No `npm install` is needed.

```sh
git clone https://github.com/YOUR_USERNAME/dealerflow.git
cd dealerflow
npm start
```

Replace `YOUR_USERNAME` with the account where you publish this project. If you downloaded a ZIP, extract it, open a terminal in the folder containing `package.json`, and run `npm start`.

Open **http://127.0.0.1:4173**. Keep the terminal running; press Ctrl+C to stop. Double-clicking `index.html` is unsupported because browser modules and offline caching need HTTP/HTTPS.

```sh
npm run check       # JavaScript syntax checks
npm test            # Node's built-in accounting/import/backup tests
npm run build       # Static deployable files in dist/
node scripts/serve.mjs --dist  # Preview the built output on the same port
```

All scripts use built-in Node modules. There is no dependency installation, bundler or runtime CDN. To use another local port, set the `PORT` environment variable before starting. Each port has separate browser storage.

## First use

1. Choose **Explore demo** to try sample records. Demo changes are temporary; they never overwrite your real workspace.
2. Choose **Use my workspace**, then **Add dealer**.
3. Enter the amount already owed at the **start** of the opening date. Enter 0 when there is no prior due. All transactions must be on or after this date.
4. Set a target for the selected reporting month. A target for one month does not automatically carry to the next.
5. Add sales and collections. A sale raises the dealer balance; a collection lowers it. Advance collections can create credit.
6. Select a month to view its activity and month-end balances. Future-dated entries are allowed and included when their reporting month is selected; the app does not treat them as cash received today.
7. Open **Reports** for reconciliation or Print / PDF. Download a JSON backup in **Data & settings** after working.

## Accounting rules

Amounts are stored as **integer paisa**, not floating-point BDT. For example, Tk 0.10 + Tk 0.20 is exactly 30 paisa. Entry accepts at most two decimal places, with no thousands separators. Each amount is capped at Tk 1 billion. A workspace supports at most 500 dealers, 10,000 transactions and 60,000 monthly targets.

For each selected month:

```text
Opening + opening balances introduced during the month + sales - collections = closing
```

- An opening balance dated on the first day is part of opening. One dated later in the month is shown separately as a new opening balance.
- Receivables are the sum of **positive** dealer balances. Credits are the absolute sum of **negative** dealer balances. Credits do not hide money owed by other dealers.
- Net closing balance = receivables − credits. It can be negative.
- Target achievement = monthly sales ÷ the selected month's target × 100. No target shows a dash.
- Sales/fridge = monthly sales ÷ the current recorded fridge count, rounded to the nearest paisa. Fridge counts are current metadata, not historical snapshots.
- Changing an opening balance/date recalculates history. An opening date cannot be moved past an existing transaction.
- Ledgers use the opening balance followed by all transactions through the selected month end. Same-day entries keep their stored order. The modal displays the most recent 100; its CSV includes every applicable entry.

This is a dealer balance tracker, not a full accounting, inventory, tax or invoice allocation system. There is no invoice ageing or profit calculation.

## CSV import and export

Add dealers before importing. In **Data & settings**, download a template populated with your first dealer name, or use these headers:

```csv
dealer,date,type,amount,reference,note
Test Dealer,2026-11-05,sale,12500.50,INV-001,Example sale
Test Dealer,2026-11-08,collection,5000.00,RCPT-001,Example collection
```

- Save from Excel as **CSV UTF-8 (comma delimited)**. `.xlsx` and semicolon-separated files are not supported.
- All six headers must be present exactly once; column order may change. `reference` and `note` cells can be blank.
- Dates must be `YYYY-MM-DD`; types must be `sale` or `collection`. Amounts are in BDT, not paisa. English and Bengali digits are accepted for amounts.
- Dealer matching ignores case and repeated whitespace, using Unicode-normalized names. Unknown dealers are rejected.
- CSV supports quoted commas, escaped quotes, CRLF and multiline cells. Maximum file size: 2 MB.
- The preview skips exact duplicates within the file and against existing records, comparing dealer, date, type, amount, reference and note. If two genuinely separate entries have identical values, give them distinct references.
- Any invalid row blocks the entire import. No records are saved until **Import records** is clicked.
- Transaction export follows the selected month and current filters. Dealer export follows the dealer search. Report export covers all dealers in the selected month.
- CSV downloads include a UTF-8 BOM for Bengali text in Excel. Potential spreadsheet formulas in text cells are prefixed with an apostrophe. Negative financial figures also receive this protection and may appear as text in spreadsheets. CSV is for interchange and reporting; **JSON is the lossless backup format**.

## Privacy, persistence and limitations

- Real records are in `localStorage` under `dealerflow.workspace.v1`. Demo records exist only in memory. Language preference has its own key.
- No analytics, cookies, remote fonts, API calls or backend storage are used. Static hosting providers still receive ordinary requests for the app files.
- Records are **not encrypted**. Anyone with access to this browser profile or downloaded backups may read them. Do not use it as a shared multi-user system.
- Browser cleanup, incognito expiry, changing the site URL/port or using another browser can remove or separate saved records. Make regular JSON backups and test restoration.
- JSON restoration replaces the workspace after validation and confirmation. Maximum backup size: 12 MB. Only schema version 1 is accepted.
- Unreadable saved data is not automatically overwritten. Use recovery download before deliberately clearing or replacing it.
- A cross-tab change blocks stale edits until reload; there is no collaborative editing or transactional multi-tab database. Use one editing tab.
- Offline support depends on browser service-worker support and successful initial caching. It is not guaranteed if storage is blocked. After publishing code changes, bump the cache version in `sw.js`.
- Same-origin apps share browser storage. Host unrelated apps under separate origins or change the storage key when intentionally creating another independent workspace.

## Publish on GitHub Pages

For the simplest deployment, publish the source directly from a branch. No local Node installation is required to publish or use the hosted app.

1. Publish the extracted files at the root of a public GitHub repository, with branch `main`.
2. Open **Settings → Pages → Build and deployment → Source → Deploy from a branch**.
3. Choose **main** and **/ (root)**, then **Save**.
4. Wait for a successful Pages deployment. The Pages settings show the live site URL.
5. Later commits to `main` update the site. The separate Checks workflow runs the Node tests on pushes to `main` and pull requests.

All asset URLs are relative, so both `username.github.io/` and `username.github.io/dealerflow/` work. The public site serves app code and fictional demo records; each visitor's records remain in their own browser.

The root `.nojekyll` file allows direct static serving. An optional manual workflow is also included: set Pages Source to **GitHub Actions**, then run **Actions → Deploy demo to GitHub Pages → Run workflow**. This alternative builds `dist/` and deploys only app assets. Use one deployment method at a time. Instructions follow [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Repository map

```text
index.html                 Application entry
app.js                     UI, event handlers, persistence and downloads
core.js                    Pure accounting, validation, CSV and demo data
i18n.js                    English/Bangla interface strings
styles.css                 Responsive and print layouts
sw.js                      Public app-shell offline cache
manifest.webmanifest       Standalone app metadata
assets/logo.svg            Original project mark
scripts/                   Zero-dependency server and static build
tests/                     Accounting and persistence regression tests
.github/                   CI, optional Pages deploy and issue templates
```

## Quality status

The included 21 Node tests and syntax/build commands were run successfully during initial development. Tests cover money precision, calendar boundaries, balance carry-forward, credits, mid-month opening balances, validation, CSV handling, duplicate prevention, backup integrity, demo isolation, corrupt-storage protection and stale-tab writes. UI-state tests use a small DOM-free harness, not a rendered browser. Automated CI reruns them after publication.

Additional browser review found and fixed a real form-submission bug caused by a hidden input shadowing `HTMLFormElement.id`, plus a narrow-screen layout problem. Dealer/transaction saves, report reconciliation, Bengali persistence, filters, pagination, actual CSV import/export and JSON download, 320/390 px layouts, modal Escape, project-subdirectory assets and cached offline loading were verified in the Windows in-app browser. See [the review record](docs/BROWSER_QA.md).

Print/PDF output, full keyboard/screen-reader coverage, backup restoration through the UI and Firefox/Safari checks remain unverified. GitHub Actions and deployment must be verified after publishing to a real repository. The [manual checklist](docs/MANUAL_TESTING.md) distinguishes completed checks from remaining work.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and review expectations and [ROADMAP.md](ROADMAP.md) for useful next steps. Use fictional or anonymized data in issues and pull requests.

## License

[MIT](LICENSE) © 2026 DealerFlow contributors.
