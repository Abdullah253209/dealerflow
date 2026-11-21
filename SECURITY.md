# Security and data handling

DealerFlow is an early-stage browser-local tracker. It is not an encrypted financial database or a multi-user accounting system.

## Reporting a vulnerability

Do not include real business records, tokens or personal information in a public issue. If the repository owner enables GitHub **Private vulnerability reporting**, use **Security → Report a vulnerability**. Otherwise use a private contact method published by the repository maintainer. The initial package does not invent a maintainer contact address or promise a response time.

Maintainers: enable Private vulnerability reporting in repository settings and publish a monitored private security contact before inviting production usage. Use only fictional reproduction data.

## Current protections

- Imported JSON is validated and whitelisted before replacement; orphan references and invalid money/date values are rejected.
- User-provided HTML is escaped before rendering.
- CSV export prefixes potentially executable spreadsheet text with an apostrophe.
- CSV import is previewed and confirmed as an atomic batch.
- The service worker caches only an explicit list of public app assets.
- No third-party scripts, remote fonts, analytics, credentials or API keys are required.
- The entry page has a Content Security Policy. Inline styles are permitted for chart/progress values; inline scripts and object embeds are not.
- The development server binds to `127.0.0.1` and is intended for local preview only.

## Known boundaries

Browser profile access, same-origin scripts, malicious extensions and physical device access can expose localStorage. JSON backups and CSV reports are plain text. Browser clearing can delete records. Cross-tab checks reduce accidental stale writes but do not provide a database transaction or concurrent editing guarantee. Keep a trusted browser profile and regular backups. Do not upload business backups to a public repository.

There has been no independent security audit. Only the current 1.x line is maintained by this starter package; the repository owner must define their own support commitments after publication.
