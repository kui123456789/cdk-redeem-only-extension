# Codebase Decomposition Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the next decomposition pass by shrinking the remaining entry files without changing runtime behavior.

**Architecture:** Extract focused helper modules from `background.js` and `sidepanel/sidepanel.js`, then keep the entry files as wiring layers. New modules use the repository's existing IIFE globals plus CommonJS exports for Node tests.

**Tech Stack:** Chrome MV3 extension, plain JavaScript, `importScripts`, sidepanel script globals, Node `node:test`.

## Global Constraints

- Work on branch `codex/codebase-decomposition-finish`.
- No GitHub push, no version bump, no release packaging.
- Preserve behavior and script order.
- Keep new modules small and covered by focused tests.
- Run syntax, smoke, removed-feature audits, and Node tests before completion.

---

### Task 1: Background State Patch Helpers

**Files:**
- Create: `background/bootstrap/state-patch-helpers.js`
- Modify: `background.js`
- Test: `scripts/test-background-state-patch-helpers.cjs`

**Interfaces:**
- Produces: `self.MultiPageBackgroundStatePatchHelpers.createStatePatchHelpers(context)`.
- Consumes: registration email helpers, runtime state helpers, `chrome.storage.local`, storage key names, and logger.

- [ ] Extract registration email fallback helpers, runtime state patch helpers, stale membership-result protection, UPI CDK alias alignment, and state patch comparison.
- [ ] Replace the matching definitions in `background.js` with destructuring from the helper module.
- [ ] Add tests for stale-result protection and alias alignment.
- [ ] Run `node --check background/bootstrap/state-patch-helpers.js` and the new test.
- [ ] Commit `refactor: extract background state patch helpers`.

### Task 2: Background Settings Bundle Transfer

**Files:**
- Create: `background/bootstrap/settings-transfer.js`
- Modify: `background.js`
- Test: `scripts/test-background-settings-transfer.cjs`

**Interfaces:**
- Produces: `self.MultiPageBackgroundSettingsTransfer.createSettingsTransfer(context)`.
- Consumes: persisted settings builders, runtime storage keys, alias state helpers, state setters, and broadcaster callbacks.

- [ ] Extract settings export filename building, runtime data normalization, runtime data export/import, settings bundle export, and settings bundle import.
- [ ] Replace `background.js` functions with destructured functions from the transfer module.
- [ ] Add tests for filename format, membership result normalization, and runtime import update building.
- [ ] Run `node --check background/bootstrap/settings-transfer.js` and the new test.
- [ ] Commit `refactor: extract background settings transfer`.

### Task 3: Sidepanel CDK Pool Pure State

**Files:**
- Create: `sidepanel/cdk-pool-state.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Test: `scripts/test-sidepanel-cdk-pool-state.cjs`

**Interfaces:**
- Produces: `window.SidepanelCdkPoolState.createCdkPoolStateHelpers(context)`.
- Consumes: UPI/IDEAL state objects and channel aliases.

- [ ] Extract pure CDK pool text, usage, channel, job capability, remote status, selectable, and state-patch helpers.
- [ ] Load `cdk-pool-state.js` before `sidepanel.js`.
- [ ] Replace duplicate helper bodies in `sidepanel.js` with module delegates.
- [ ] Add tests for UPI/IDEAL patch aliases and selectable status.
- [ ] Run `node --check sidepanel/cdk-pool-state.js` and the new test.
- [ ] Commit `refactor: extract sidepanel cdk pool state`.

### Task 4: Sidepanel Settings Normalization

**Files:**
- Create: `sidepanel/settings-normalization.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Test: `scripts/test-sidepanel-settings-normalization.cjs`

**Interfaces:**
- Produces: `window.SidepanelSettingsNormalization.createSettingsNormalization(context)`.
- Consumes: constants for bounded fields and provider defaults.

- [ ] Extract the remaining pure sidepanel normalization helpers for auto-run delays, verification resend counts, provider domains, custom email pool entries, and panel mode selection.
- [ ] Load `settings-normalization.js` before `sidepanel.js`.
- [ ] Delegate matching functions in `sidepanel.js` to the module.
- [ ] Add tests for custom pool availability and bounded numeric normalization.
- [ ] Run `node --check sidepanel/settings-normalization.js` and the new test.
- [ ] Commit `refactor: extract sidepanel settings normalization`.

### Task 5: Final Guards and Verification

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: this plan file with final results.

- [ ] Tighten line-count guards for `background.js` and `sidepanel/sidepanel.js`.
- [ ] Add guards for new modules.
- [ ] Run:
  - `node --check background.js`
  - `node --check sidepanel/sidepanel.js`
  - `node scripts/audit-smoke-tests.mjs`
  - `node scripts/audit-no-phone-sms.mjs`
  - `node scripts/audit-no-removed-network.mjs`
  - `node --test scripts/test-*.cjs`
  - `node scripts/module-size-report.mjs`
- [ ] Commit `test: guard final decomposition modules`.

## Execution Notes

- Prefer extracting pure helpers first; if a dependency-heavy function would require broad behavior changes, leave it in the entry file and document the next split target.
- Passing tests and unchanged user-facing behavior are more important than maximizing removed line count in one risky edit.

## Execution Results

- Created `background/bootstrap/state-patch-helpers.js` and moved registration email state fallbacks, runtime state patch wrappers, stale membership result protection, UPI CDK alias alignment, and state-patch comparison.
- Created `background/bootstrap/settings-transfer.js` and moved settings export filename generation plus runtime data export/import normalization and settings bundle import/export.
- Created `sidepanel/cdk-pool-state.js` and moved CDK pool text/usage/channel helpers, remote status normalization, selectability, retry, and cancel policy helpers.
- Created `sidepanel/settings-normalization.js` and moved custom email pool entry normalization plus provider domain/base URL normalizers.
- Added focused Node tests for all four new modules.
- Tightened audit guards: `background.js <= 15400`, `sidepanel/sidepanel.js <= 10100`, and new modules have individual size guards.

Final verification on branch `codex/codebase-decomposition-finish`:

- `node --check background.js`
- `node --check sidepanel/sidepanel.js`
- `node --check background/bootstrap/state-patch-helpers.js`
- `node --check background/bootstrap/settings-transfer.js`
- `node --check sidepanel/cdk-pool-state.js`
- `node --check sidepanel/settings-normalization.js`
- `node scripts/audit-smoke-tests.mjs`
- `node scripts/audit-no-phone-sms.mjs`
- `node scripts/audit-no-removed-network.mjs`
- `node --test scripts/test-*.cjs`
- `node scripts/module-size-report.mjs`

Result: all verification passed; `137/137` Node tests passed. Remaining warnings are the expected tracked-source warnings for `background.js` and `sidepanel/sidepanel.js` still being over 8000 lines.
