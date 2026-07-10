# Task 4 Report

Status: completed

Implemented the Free export verification URL toggle from the compact Free
action row through to the export message. The control renders its persisted
state with `aria-pressed`, toggles and re-renders through delegated panel
events, and sends `includeVerificationUrl` only for Free exports. The account
records renderer now forwards the getter required by the membership renderer.

Test-first evidence:
- Red: `node --test scripts/test-account-records-free-export-ui.cjs` exited 1
  with 4 expected failures: missing button, renderer forwarding, click branch,
  and Free payload field.
- Green: `node --test scripts/test-account-records-free-export-ui.cjs
  scripts/test-account-records-manager.cjs` exited 0 with 13 tests passing.
- Syntax: `node --check` exited 0 for all five changed sidepanel files.
- Full suite: `node --test scripts/test-*.cjs` exited 0 with 244 tests passing.

Self-review: no findings. The toggle is immediately after `导出 Free`, retains
the requested accessibility attributes, is handled before the normal export
branch, and paid export payloads omit `includeVerificationUrl`.

Smoke audit note: `node scripts/audit-smoke-tests.mjs` remains blocked by
pre-existing size guards in `sidepanel/sidepanel-app-controller.js`,
`background/steps/upi-redeem/free-entry.js`, and
`background/steps/upi-redeem/channel-submission.js`; Task 4 does not modify
those files.
