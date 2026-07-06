# Repository Guidelines

## Project Structure & Module Organization

This repository is a Chrome Manifest V3 extension for CDK redeem and account status workflows.

- `manifest.json` defines permissions, content scripts, side panel, and the background service worker.
- `background.js` wires the service worker; feature code lives under `background/`, especially `background/steps/` and `background/membership/`.
- `content/` contains page automation scripts injected into OpenAI/Auth/iCloud pages.
- `sidepanel/` contains the extension UI, view models, and managers.
- `shared/` contains reusable parsing, API, and state helpers used by background and side panel code.
- `scripts/` contains smoke audits, Node tests, release helpers, and small maintenance utilities.
- `icons/`, `docs/`, `data/`, and `release-artifacts/` hold extension assets, documentation, fixture data, and packaged releases.

## Build, Test, and Development Commands

There are no npm package scripts. Run checks directly with Node:

```powershell
node --check background.js
node --check sidepanel/sidepanel.js
node --check background/steps/upi-redeem.js
node scripts/audit-smoke-tests.mjs
node --test scripts/test-*.cjs
```

Use `chrome://extensions` with Developer Mode to load this directory as an unpacked extension. After background changes, reload the extension so the MV3 service worker uses the new code.

## Coding Style & Naming Conventions

Use plain JavaScript and existing browser-extension patterns. Keep indentation at two spaces, prefer `const`/`let`, and use `camelCase` for functions and variables. Browser modules expose namespaces such as `self.MultiPage...`; keep new exports consistent with nearby files. Avoid broad rewrites in large files unless they are part of an explicit refactor.

## Testing Guidelines

Tests use Node’s built-in `node:test` and `node:assert/strict`. Put focused unit tests in `scripts/test-*.cjs`; put static integration checks in `scripts/audit-smoke-tests.mjs`. For feature changes, run the relevant `node --check` files plus at least the matching test script. Add regression coverage for import/export formats, redeem state transitions, and trial eligibility decisions.

## Commit & Pull Request Guidelines

Recent history uses concise conventional prefixes such as `fix:`, `refactor:`, and `docs:`, plus release commits like `Prepare v1.0.7 release`. Keep commits small and behavior-focused.

Pull requests should include a short behavior summary, test commands run, screenshots for side panel UI changes, and any configuration or release impact. Never commit real emails, passwords, API keys, access tokens, cookies, proxies, phone numbers, or local runtime logs.

## Security & Configuration Tips

Treat `cha.nerver.cc`, Assurivo/iCloud URLs, CDK pools, and access tokens as sensitive operational data. Keep sample values fake, and check `git diff` before committing generated exports or local backup files.
