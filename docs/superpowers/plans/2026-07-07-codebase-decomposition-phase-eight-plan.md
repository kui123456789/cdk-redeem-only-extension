# Codebase Decomposition Phase Eight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue shrinking `sidepanel/sidepanel.js` by extracting pure settings/state normalization helpers into focused sidepanel modules.

**Architecture:** Keep `sidepanel.js` as the composition root and move low-risk pure functions behind browser globals that also export through CommonJS for Node tests. New modules load before `sidepanel.js` in `sidepanel/sidepanel.html`.

**Tech Stack:** Chrome Manifest V3, plain JavaScript, browser globals, Node `node:test`.

## Global Constraints

- Do not change product behavior, version numbers, packaging, or publishing.
- Prefer pure extraction plus focused regression tests.
- Keep script load order explicit in `sidepanel/sidepanel.html`.
- Run syntax checks and smoke audits before committing.

---

### Task 1: Extract ChatGPT Session Reader Settings

**Files:**
- Create: `sidepanel/chatgpt-session-reader-settings.js`
- Create: `scripts/test-sidepanel-chatgpt-session-reader-settings.cjs`
- Modify: `sidepanel/sidepanel.js`
- Modify: `sidepanel/sidepanel.html`

**Interfaces:**
- Produces: `SidepanelChatgptSessionReaderSettings.createChatgptSessionReaderSettings(context)`
- Consumes: `autoRunNormalizers` and URL/string normalizers supplied by `sidepanel.js`.

- [ ] Move default profile, profile normalization, profile map normalization, legacy patch, and UI state normalization into the new module.
- [ ] Add tests for legacy fallback, JP profile inheritance, URL/key/proxy cleanup, and legacy patch generation.
- [ ] Wire `sidepanel.js` to call the new module API.

### Task 2: Extract RemovedPaymentWorker Settings

**Files:**
- Create or extend: `sidepanel/chatgpt-session-reader-settings.js`
- Create or extend test: `scripts/test-sidepanel-chatgpt-session-reader-settings.cjs`
- Modify: `sidepanel/sidepanel.js`

**Interfaces:**
- Produces: `buildDefaultRemovedPaymentWorkerSettings`, `normalizeRemovedPaymentWorkerSettingsValue`, and the small field normalizers.

- [ ] Move RemovedPaymentWorker defaults and normalization helpers into the same settings module.
- [ ] Keep DOM input synchronization in `sidepanel.js`.
- [ ] Add tests for API base URL cleanup, backend fallback, legacy proxy/profile migration, and attempt bounds.

### Task 3: Extract UPI Info Helper State

**Files:**
- Create: `sidepanel/upi-info-helper-state.js`
- Create: `scripts/test-sidepanel-upi-info-helper-state.cjs`
- Modify: `sidepanel/sidepanel.js`
- Modify: `sidepanel/sidepanel.html`

**Interfaces:**
- Produces: `SidepanelUpiInfoHelperState.createUpiInfoHelperState(context)`
- Consumes: optional `LegacyPayUtils.normalizeUpiInfoRemainingUses`.

- [ ] Move auto-mode permission parsing and payload recursion into the new module.
- [ ] Move pure remaining-use / OTP channel / SMS field parsing only if dependencies stay local and testable.
- [ ] Add tests for boolean/string/number permission values and nested payloads.

### Task 4: Guards, Verification, Commit

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Run checks.

- [ ] Add new modules to core file checks and load-order assertions.
- [ ] Lower `sidepanel/sidepanel.js` growth guard after measuring the new line count.
- [ ] Run:
  - `node --check sidepanel/sidepanel.js`
  - `node --check sidepanel/chatgpt-session-reader-settings.js`
  - `node --check sidepanel/upi-info-helper-state.js`
  - `node scripts/audit-smoke-tests.mjs`
  - `node scripts/audit-no-phone-sms.mjs`
  - `node scripts/audit-no-removed-network.mjs`
  - `node --test scripts/test-*.cjs`
  - `node scripts/module-size-report.mjs`
- [ ] Commit the completed extraction.
