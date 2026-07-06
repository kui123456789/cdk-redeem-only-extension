# Codebase Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce large-file concentration so future fixes can target small modules instead of editing `background.js`, `sidepanel/sidepanel.js`, `account-records-manager.js`, `upi-credential-membership-checker.js`, and `content/signup-page.js` directly.

**Architecture:** Keep the existing Chrome MV3 no-bundler design. New files must expose globals on `self.*` and be loaded through ordered `importScripts(...)` or ordered `<script>` tags. Each extraction must preserve behavior first; renaming APIs and deleting legacy compatibility happen only after tests prove no caller remains.

**Tech Stack:** Plain JavaScript, Chrome Extension MV3 service worker, side panel DOM scripts, content scripts, Node `--check`, Node `node:test`, existing audit scripts.

---

## Baseline

Current tracked-source pressure points:

| Area | File | Current Size | Problem |
| --- | --- | ---: | --- |
| Background entry | `background.js` | ~16.5k lines | Imports, defaults, state, providers, flow runtime, and message wiring are mixed. |
| Side panel entry | `sidepanel/sidepanel.js` | ~10.9k lines | DOM bindings, settings, workflow controls, log rendering, state sync, and event wiring are mixed. |
| Membership/redeem | `background/upi-credential-membership-checker.js` | ~7.5k lines | Result storage, CDK status sync, AT refresh, manual redeem, and export logic are mixed. |
| Signup content | `content/signup-page.js` | ~6.9k lines | Page detection, localized selectors, form actions, and orchestration are mixed. |
| Membership UI | `sidepanel/account-records-manager.js` | ~5.6k lines | Parsing, grouping, candidate rules, rendering, export, and click handlers are mixed. |

## Execution Results

Implemented on `main` as incremental refactor commits. The pass kept the MV3 no-bundler architecture and added smoke checks for the new ordered script modules.

| Task | Result |
| --- | --- |
| Size guard | Added tracked-source size report and non-fatal smoke warnings for files over 8,000 lines. |
| Sidepanel bindings/log/workflow | Extracted DOM bindings, log panel rendering, and workflow status rendering. |
| Membership UI | Extracted row policy and progress/flow rendering helpers. |
| Background bootstrap | Extracted flow runtime and persisted-settings defaults. |
| Background state store | Extracted service worker state/session-storage wrappers into `background/bootstrap/state-store.js`. |
| Background legacy cleanup | Extracted removed-network/IP-proxy residue cleanup into `background/bootstrap/legacy-cleanup.js`. |
| Background auto-run session | Extracted auto-run session ID state into `background/bootstrap/auto-run-session.js`. |
| Background auto-run timer plan | Extracted timer-plan normalization/status payload helpers into `background/bootstrap/auto-run-timer-plan.js`. |
| Email providers | Extracted provider/generator registry wrappers. |
| Membership helpers | Extracted access-token refresh classifiers and pending redeem status target builder. |
| Signup content | Extracted detector constants/helpers and command orchestration wrappers. |
| Sidepanel toast service | Extracted toast rendering/dismissal into `sidepanel/toast-service.js`. |
| Sidepanel auto-run helpers | Extracted auto-run numeric normalizers and countdown ticker view into `sidepanel/auto-run-normalizers.js` and `sidepanel/auto-run-countdown-view.js`. |

Final size snapshot from `node scripts/module-size-report.mjs`:

| File | Final Lines | Status |
| --- | ---: | --- |
| `background.js` | 15,915 | Still over target; next split should move runtime orchestration, status broadcasting, and remaining provider helpers. |
| `sidepanel/sidepanel.js` | 10,732 | Still over target; next split should move settings/event wiring and state sync managers. |
| `background/upi-credential-membership-checker.js` | 7,497 | Improved but still large; export/import and redeem batch runners remain candidates. |
| `content/signup-page.js` | 6,820 | Improved; further split should move page-specific action bodies. |
| `sidepanel/account-records-manager.js` | 5,481 | Improved via policy/renderer extraction; click handlers and export actions remain candidates. |
| `background/message-router.js` | 4,007 | Reduced by moving pending redeem target selection. |

Non-goals:

- Do not change registration, trial eligibility, Free/Plus grouping, UPI/IDEAL rules, Passkey/2FA routes, exports, or GitHub release behavior.
- Do not introduce a bundler or ES module conversion in this pass.
- Do not delete existing compatibility globals until all consumers are switched.

## Target File Boundaries

Create or extend these focused modules:

- `sidepanel/dom-bindings.js`: all `document.getElementById` and static DOM lookup.
- `sidepanel/log-panel-manager.js`: log rendering, clear/export, previous-round snapshot display.
- `sidepanel/workflow-state-view.js`: flow step status/progress rendering only.
- `sidepanel/membership-row-policy.js`: pure Free/Plus grouping, eligibility, candidate counts.
- `sidepanel/membership-renderer.js`: Free/UPI Plus/IDEAL Plus table rendering only.
- `background/bootstrap/flow-runtime.js`: step definitions, step IDs, node IDs, flow lookup helpers.
- `background/bootstrap/settings-defaults.js`: persistent defaults, legacy key maps, setting schema constants.
- `background/email/provider-registry.js`: provider constants, provider selection, current mailbox metadata.
- `background/membership/redeem-status-sync.js`: remote CDK job refresh and submitted-result synchronization.
- `background/membership/access-token-refresh.js`: Free/Plus AT refill orchestration.
- `content/signup-page-detector.js`: page state detection and localized text matchers.
- `content/signup-page-orchestrator.js`: high-level signup action dispatch.

Existing files remain composition roots:

- `background.js` loads modules and wires dependencies.
- `sidepanel/sidepanel.js` initializes managers and handles top-level messages.
- `content/signup-page.js` attaches content-script API to `self`.

---

### Task 1: Add Size Guard And Baseline Report

**Files:**
- Modify: `scripts/module-size-report.mjs`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Add a tracked-code-only mode to the size report**

Update `scripts/module-size-report.mjs` so it ignores `.git`, `.codegraph`, `.codex-backups`, `_metadata`, and `release-artifacts`, and prints the top 20 tracked JavaScript/HTML/CSS files.

- [ ] **Step 2: Add a smoke warning for files over 8,000 lines**

In `scripts/audit-smoke-tests.mjs`, add a non-fatal warning list for tracked source files over 8,000 lines. This keeps current oversized files visible while allowing incremental refactors.

- [ ] **Step 3: Verify baseline**

Run:

```powershell
node --check scripts/module-size-report.mjs
node --check scripts/audit-smoke-tests.mjs
node scripts/module-size-report.mjs
node scripts/audit-smoke-tests.mjs
```

Expected: commands exit 0; oversized files are reported as warnings, not failures.

- [ ] **Step 4: Commit**

```powershell
git add scripts/module-size-report.mjs scripts/audit-smoke-tests.mjs
git commit -m "chore: track module size pressure"
```

### Task 2: Split Sidepanel DOM Bindings

**Files:**
- Create: `sidepanel/dom-bindings.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`

- [ ] **Step 1: Create DOM binding module**

Move top-level DOM lookup constants from `sidepanel/sidepanel.js` into:

```javascript
self.SidepanelDomBindings = {
  getBindings() {
    return {
      logArea: document.getElementById('log-area'),
      btnAutoRun: document.getElementById('btn-auto-run'),
      btnStop: document.getElementById('btn-stop'),
      btnConfigMenu: document.getElementById('btn-config-menu'),
      // Move every existing DOM lookup here, preserving the original key names.
    };
  },
};
```

The implementation must include every existing lookup, not just the example keys.

- [ ] **Step 2: Load before `sidepanel.js`**

Add this before `sidepanel.js` in `sidepanel/sidepanel.html`:

```html
<script src="dom-bindings.js"></script>
```

- [ ] **Step 3: Replace local declarations**

In `sidepanel/sidepanel.js`, replace the moved declarations with:

```javascript
const dom = self.SidepanelDomBindings.getBindings();
const {
  logArea,
  btnAutoRun,
  btnStop,
  btnConfigMenu,
} = dom;
```

Include all moved binding names in the destructuring so existing references continue to work.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check sidepanel/dom-bindings.js
node --check sidepanel/sidepanel.js
node scripts/audit-smoke-tests.mjs
```

Expected: no `ReferenceError` for DOM names, side panel loads, workflow buttons still render.

- [ ] **Step 5: Commit**

```powershell
git add sidepanel/dom-bindings.js sidepanel/sidepanel.html sidepanel/sidepanel.js
git commit -m "refactor: extract sidepanel DOM bindings"
```

### Task 3: Split Sidepanel Log And Workflow Views

**Files:**
- Create: `sidepanel/log-panel-manager.js`
- Create: `sidepanel/workflow-state-view.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`

- [ ] **Step 1: Move log-only functions**

Move functions that only append, clear, trim, or render logs into `sidepanel/log-panel-manager.js`:

```javascript
self.SidepanelLogPanelManager = {
  create({ logArea, state, sendMessage }) {
    return {
      appendLog,
      clearLog,
      renderLogs,
      renderPreviousRoundSnapshot,
    };
  },
};
```

The module must not read unrelated settings inputs.

- [ ] **Step 2: Move flow-render-only functions**

Move flow progress/status rendering into `sidepanel/workflow-state-view.js`:

```javascript
self.SidepanelWorkflowStateView = {
  create({ stepsProgress, state }) {
    return {
      renderStepList,
      renderCurrentNodeStatus,
      renderProgressCount,
    };
  },
};
```

- [ ] **Step 3: Wire managers from `sidepanel.js`**

Instantiate both modules after DOM bindings and before event handlers. Keep old function names as local wrappers for one commit if many callers still use them.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check sidepanel/log-panel-manager.js
node --check sidepanel/workflow-state-view.js
node --check sidepanel/sidepanel.js
node scripts/audit-smoke-tests.mjs
```

Manual check: start and stop one workflow; logs and progress should still update.

- [ ] **Step 5: Commit**

```powershell
git add sidepanel/log-panel-manager.js sidepanel/workflow-state-view.js sidepanel/sidepanel.html sidepanel/sidepanel.js
git commit -m "refactor: split sidepanel logs and workflow view"
```

### Task 4: Split Membership UI Policy From Rendering

**Files:**
- Create: `sidepanel/membership-row-policy.js`
- Create: `sidepanel/membership-renderer.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Test: `scripts/test-membership-view-model.cjs`

- [ ] **Step 1: Extract pure row policy**

Move pure helpers from `account-records-manager.js` into `sidepanel/membership-row-policy.js`: channel normalization, deleted Plus tombstones, Free/Plus grouping, failure-limit checks, daily-limit checks, and candidate filtering.

Expose:

```javascript
self.SidepanelMembershipRowPolicy = {
  normalizeRedeemChannel,
  getMembershipGroup,
  isRedeemableFreeRowForChannel,
  getNotRedeemableReason,
  summarizeRows,
};
```

- [ ] **Step 2: Add focused tests**

Extend `scripts/test-membership-view-model.cjs` with cases for:

- UPI manual candidate ignores generic failure count.
- `pm-unavailable`/cross-region payment rows are not redeemable.
- Deleted UPI Plus tombstone does not hide IDEAL Plus.
- Missing AT rows are counted as not redeemable.

- [ ] **Step 3: Extract renderer**

Move HTML-building functions for Free, UPI Plus, IDEAL Plus, progress bars, and empty states into `sidepanel/membership-renderer.js`.

Expose:

```javascript
self.SidepanelMembershipRenderer = {
  renderGroups({ rows, policy, actions, state }),
};
```

The renderer receives action callbacks; it must not send Chrome messages itself.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check sidepanel/membership-row-policy.js
node --check sidepanel/membership-renderer.js
node --check sidepanel/account-records-manager.js
node --test scripts/test-membership-view-model.cjs
node scripts/audit-smoke-tests.mjs
```

- [ ] **Step 5: Commit**

```powershell
git add sidepanel/membership-row-policy.js sidepanel/membership-renderer.js sidepanel/account-records-manager.js sidepanel/sidepanel.html scripts/test-membership-view-model.cjs
git commit -m "refactor: split membership row policy and renderer"
```

### Task 5: Split Background Flow Runtime And Settings Defaults

**Files:**
- Create: `background/bootstrap/flow-runtime.js`
- Create: `background/bootstrap/settings-defaults.js`
- Modify: `background.js`

- [ ] **Step 1: Extract flow definition helpers**

Move step-definition constants and helpers from the top of `background.js` into `background/bootstrap/flow-runtime.js`.

Expose:

```javascript
self.MultiPageBackgroundFlowRuntime = {
  create({ defaultActiveFlowId = 'openai' } = {}) {
    return {
      DEFAULT_ACTIVE_FLOW_ID,
      getStepDefinitionsForState,
      getStepIdsForState,
      getNodeDefinitionsForState,
      getNodeTitleForState,
    };
  },
};
```

- [ ] **Step 2: Extract persistent defaults**

Move `PERSISTED_SETTING_DEFAULTS`, legacy setting key maps, schema constants, and setting clamp defaults into `background/bootstrap/settings-defaults.js`.

Expose:

```javascript
self.MultiPageBackgroundSettingsDefaults = {
  getDefaults() {
    return { ...PERSISTED_SETTING_DEFAULTS };
  },
  LEGACY_UPI_REDEEM_SETTING_KEY_MAP,
  SETTINGS_EXPORT_SCHEMA_VERSION,
};
```

- [ ] **Step 3: Wire imports**

Add both files to `importScripts(...)` before `background/persistent-settings.js` consumers are initialized.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check background/bootstrap/flow-runtime.js
node --check background/bootstrap/settings-defaults.js
node --check background.js
node scripts/audit-smoke-tests.mjs
```

Manual check: side panel still shows all workflow routes: full 2FA, no-2FA Free, Passkey Free, and redeem-only.

- [ ] **Step 5: Commit**

```powershell
git add background/bootstrap/flow-runtime.js background/bootstrap/settings-defaults.js background.js
git commit -m "refactor: extract background flow and settings bootstrap"
```

### Task 6: Split Email Provider Registry Out Of `background.js`

**Files:**
- Create: `background/email/provider-registry.js`
- Modify: `background.js`

- [ ] **Step 1: Move provider constants**

Move provider and generator constants such as `ICLOUD_PROVIDER`, `CUSTOM_EMAIL_POOL_GENERATOR`, `HOTMAIL_PROVIDER`, `LUCKMAIL_PROVIDER`, and related mailbox/default constants into `background/email/provider-registry.js`.

- [ ] **Step 2: Move provider selection helpers**

Move functions that pick or normalize provider/generator state, but do not move provider API calls yet.

Expose:

```javascript
self.MultiPageEmailProviderRegistry = {
  constants,
  normalizeProvider,
  normalizeGenerator,
  isCustomEmailPoolGenerator,
  getProviderLabel,
};
```

- [ ] **Step 3: Keep compatibility aliases**

In `background.js`, destructure registry constants back to the existing local names for one commit. This avoids changing every caller in the same task.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check background/email/provider-registry.js
node --check background.js
node scripts/audit-smoke-tests.mjs
```

Manual check: custom email pool, iCloud, Hotmail, Luckmail, and 2925 selectors still show and save.

- [ ] **Step 5: Commit**

```powershell
git add background/email/provider-registry.js background.js
git commit -m "refactor: extract email provider registry"
```

### Task 7: Split Membership Remote Sync And AT Refresh

**Files:**
- Create: `background/membership/redeem-status-sync.js`
- Create: `background/membership/access-token-refresh.js`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `background/message-router.js`
- Test: `scripts/test-redeem-cdkey-usage.cjs`

- [ ] **Step 1: Extract remote submitted-job refresh**

Move logic that refreshes `submitted`, remote failed, canceled, timeout, approve-blocked, and success CDK job states into `background/membership/redeem-status-sync.js`.

Expose:

```javascript
self.MultiPageRedeemStatusSync = {
  create({ getStoredResults, saveResults, redeemApiClient, log }) {
    return {
      refreshSubmittedJobs,
      refreshChannelStatuses,
    };
  },
};
```

- [ ] **Step 2: Extract AT refill orchestration**

Move Free/Plus access-token refill queue logic into `background/membership/access-token-refresh.js`.

Expose:

```javascript
self.MultiPageAccessTokenRefresh = {
  create({ loginExecutor, getStoredResults, saveResults, log }) {
    return {
      refillMissingAccessTokens,
      refillOneAccount,
    };
  },
};
```

- [ ] **Step 3: Preserve message names**

Existing messages such as `REFRESH_UPI_REDEEM_CDKEY_STATUSES` and Free AT refill actions must keep the same external names. Only their internals should delegate to the new modules.

- [ ] **Step 4: Verify**

Run:

```powershell
node --check background/membership/redeem-status-sync.js
node --check background/membership/access-token-refresh.js
node --check background/upi-credential-membership-checker.js
node --check background/message-router.js
node --test scripts/test-redeem-cdkey-usage.cjs
node scripts/audit-smoke-tests.mjs
```

Manual check: refresh CDK statuses and one-key AT refill still work.

- [ ] **Step 5: Commit**

```powershell
git add background/membership/redeem-status-sync.js background/membership/access-token-refresh.js background/upi-credential-membership-checker.js background/message-router.js scripts/test-redeem-cdkey-usage.cjs
git commit -m "refactor: split membership sync and AT refresh"
```

### Task 8: Split Signup Content Detector And Orchestrator

**Files:**
- Create: `content/signup-page-detector.js`
- Create: `content/signup-page-orchestrator.js`
- Modify: `content/signup-page.js`
- Modify: `manifest.json`

- [ ] **Step 1: Extract page detection**

Move page-state detection, localized button text matchers, Hindi/English/Japanese/Chinese labels, and diagnostic snapshot builders into `content/signup-page-detector.js`.

Expose:

```javascript
self.SignupPageDetector = {
  detectPageState,
  findSignupEntryAction,
  findContinueButton,
  findResendButton,
  buildDiagnosticSnapshot,
};
```

- [ ] **Step 2: Extract high-level orchestration**

Move high-level action dispatch into `content/signup-page-orchestrator.js`:

```javascript
self.SignupPageOrchestrator = {
  create({ detector, domUtils, passwordPage, verificationPage, profilePage }) {
    return {
      submitEmail,
      submitPassword,
      fetchVerificationState,
      fillProfile,
      recoverAuthPage,
    };
  },
};
```

- [ ] **Step 3: Keep `signup-page.js` as API adapter**

After extraction, `content/signup-page.js` should mostly attach message handlers and delegate to detector/orchestrator modules.

- [ ] **Step 4: Update script order**

In `manifest.json`, load the new files after `content/signup-dom-utils.js` and before `content/signup-page.js`.

- [ ] **Step 5: Verify**

Run:

```powershell
node --check content/signup-page-detector.js
node --check content/signup-page-orchestrator.js
node --check content/signup-page.js
node --check manifest.json
node scripts/audit-smoke-tests.mjs
```

Manual check: step 2 email entry, step 4 verification, step 5 profile, and step 6 password page still work on English and Hindi pages.

- [ ] **Step 6: Commit**

```powershell
git add content/signup-page-detector.js content/signup-page-orchestrator.js content/signup-page.js manifest.json
git commit -m "refactor: split signup page detection and orchestration"
```

### Task 9: Final Cleanup And Size Gate

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: `docs/superpowers/plans/2026-07-06-codebase-decomposition-plan.md`

- [ ] **Step 1: Turn new files into expected structure checks**

Add smoke checks that confirm these files are loaded:

- `sidepanel/dom-bindings.js`
- `sidepanel/log-panel-manager.js`
- `sidepanel/membership-renderer.js`
- `background/bootstrap/flow-runtime.js`
- `background/email/provider-registry.js`
- `background/membership/redeem-status-sync.js`
- `content/signup-page-detector.js`

- [ ] **Step 2: Record final sizes**

Run:

```powershell
node scripts/module-size-report.mjs
```

Update this plan with a final size table. Target reductions:

- `background.js` under 9,000 lines.
- `sidepanel/sidepanel.js` under 6,000 lines.
- `account-records-manager.js` under 3,500 lines.
- `content/signup-page.js` under 4,000 lines.
- `upi-credential-membership-checker.js` under 5,000 lines.

- [ ] **Step 3: Full verification**

Run:

```powershell
node --check background.js
node --check background/message-router.js
node --check background/upi-credential-membership-checker.js
node --check background/steps/upi-redeem.js
node --check content/signup-page.js
node --check sidepanel/sidepanel.js
node --check sidepanel/account-records-manager.js
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands pass.

- [ ] **Step 4: Commit**

```powershell
git add scripts/audit-smoke-tests.mjs docs/superpowers/plans/2026-07-06-codebase-decomposition-plan.md
git commit -m "docs: record codebase decomposition results"
```

## Execution Notes

- Work one task per commit. If a task becomes too large, stop after creating a compatibility wrapper and commit that safe checkpoint.
- Do not combine behavior fixes with extraction commits. If a bug is found, commit the behavior fix separately before continuing the refactor.
- After every background-file extraction, reload the extension from `chrome://extensions`; refreshing the side panel alone is not enough for MV3 service worker code.
- Prefer moving pure functions to `shared/` only when both background and side panel need them. Otherwise keep files close to their owner directory.
- Keep old global names for at least one task after extraction, then remove them only when `rg "oldName"` proves no caller remains.

## Self-Review

- Spec coverage: the plan covers side panel, background entry, membership/redeem, signup content, and guard scripts.
- Placeholder scan: no task relies on "TBD" or unnamed files; every task names exact files and verification commands.
- Type consistency: all new modules expose `self.*` namespaces because this project uses ordered scripts, not imports.
- Scope check: this is a refactor-only plan; feature removals, version release, and behavior changes are intentionally excluded.
