# Module Map

This extension is split around Chrome MV3 runtime boundaries: the background service worker owns automation and persistence, content scripts own page automation, and `sidepanel/` owns the operator UI.

## Background

- `background.js` is the service-worker entry point and bootstraps shared helpers, routes, and flow steps.
- `background/message-router.js` is now a thin router facade. Route groups live under `background/routes/`, and lower-level dispatch lives in `background/router/`.
- `background/steps/` contains workflow steps such as signup, password setup, 2FA/passkey handling, and UPI redeem.
- `background/membership/` owns membership result storage, credential import/export, redeem retries, Plus verification, and redeem service helpers.
- `shared/` contains format, state, and API utilities that are safe to load from both background and sidepanel code.

## Content Scripts

- `content/signup-page.js` remains the main OpenAI/Auth page automation entry.
- Smaller content helpers such as auth text detectors, signup executors, and recovery scripts should stay in `content/` and expose browser globals instead of importing modules.

## Side Panel

- `sidepanel/account-records-manager.js` is the orchestration layer for account records. It wires state, DOM, renderer, membership actions, pool ops, result ops, and event handlers.
- `sidepanel/account-records-*-helpers.js` files hold focused helpers for export, subscription detection, redeem policy, deletion state, credential parsing, display models, flow rendering, DOM helpers, state sync, trial eligibility, run history, and settings payloads.
- `sidepanel/account-records-renderer.js` renders the panel; action modules such as `account-records-membership-actions.js`, `account-records-redeem-actions.js`, `account-records-membership-pool-ops.js`, and `account-records-membership-result-ops.js` perform side effects through injected context.
- New account-records modules must be loaded in `sidepanel/sidepanel.html` before `account-records-manager.js`, added to `scripts/audit-smoke-tests.mjs`, and loaded in `scripts/test-account-records-manager.cjs` if the manager depends on them.

## Size Guards

`scripts/audit-smoke-tests.mjs` contains module size guards and load-order checks. When splitting new modules, add a guard that reflects the expected steady-state size and keep `account-records-manager.js` as an orchestration file rather than a feature implementation sink.
