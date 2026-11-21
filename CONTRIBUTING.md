# Contributing to DealerFlow

Thank you for helping small distributors keep clearer records. Bug fixes, accessibility improvements, accounting edge cases and better Bangla translations are welcome.

## Development

1. Fork and clone the repository. Create a branch describing the change.
2. Use Node.js 22 or newer. No dependency installation is needed.
3. Run `npm start` and open http://127.0.0.1:4173.
4. Use **Explore demo** or a disposable local workspace with fictional records. Never commit real dealer data or backups.
5. Run `npm run check`, `npm test` and `npm run build` before opening a pull request.
6. Follow [the browser checklist](docs/MANUAL_TESTING.md) for affected behavior. State which browser checks you actually completed.

## Design and accounting rules

- Store money as integer paisa. Keep arithmetic in `core.js`; display formatting belongs in `app.js`.
- Preserve the reconciliation invariant: opening + introduced opening balances + sales − collections = closing.
- Keep dealer receivables and credits separate.
- Validate the whole next workspace before writing it; invalid imports must not partially save.
- Escape all user text before inserting HTML. Never store secrets or add tracking.
- Add English/Bangla UI strings together in `i18n.js`. Bengali validation-message coverage is a useful improvement.
- Preserve relative asset paths so GitHub project Pages work under a subdirectory.
- If an app-shell file changes, bump the cache version in `sw.js` before releasing.
- Keep new dependencies justified; the current project intentionally has no runtime or development package dependencies.

## Reporting a bug

Use the bug report template. Include expected behavior, actual behavior, browser/version and steps to reproduce. Share only fictional data. For security reports follow [SECURITY.md](SECURITY.md), not a public issue.

## Pull requests

Explain the user-facing problem and the resulting behavior. Include tests for accounting, import, validation or persistence changes and describe browser checks honestly. For a small text-only edit, syntax checks and review are enough. Keep changes focused and avoid reformatting unrelated files.

By contributing, you agree that your contribution may be distributed under this repository's MIT license. Keep discussions respectful, useful and focused on the work.
