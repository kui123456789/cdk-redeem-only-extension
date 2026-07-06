# Codebase Decomposition Next Steps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue splitting the remaining oversized source files while preserving the current registration, email-pool, Free/Plus, UPI/IDEAL, 2FA, Passkey, AT supplement, and export behavior.

**Architecture:** Keep the current Chrome MV3 no-bundler style: each extracted browser module attaches one explicit `window`/`globalThis` namespace and also exports CommonJS for tests. Split pure policy/format/view-model code first, then move browser side-effect executors after characterization tests protect current behavior.

**Tech Stack:** Plain JavaScript, Chrome extension MV3, global IIFE modules, CommonJS `node:test`, `node --check`, existing smoke and removal audits.

---

## Current Split State

| Area | Current State | Next Risk |
| --- | --- | --- |
| `sidepanel/sidepanel.js` | Workflow button state and status display are already extracted. | Still owns broad page orchestration and event wiring. |
| `sidepanel/account-records-manager.js` | Still mixes Free/Plus row policy, credential import/export, redeem progress, record history UI, and DOM rendering. | Highest sidepanel regression risk. |
| `background/upi-credential-membership-checker.js` | Still mixes result normalization, storage, deletion, login/AT supplement, eligibility, and redeem orchestration. | Highest background behavior risk. |
| `content/signup-page.js` | Still mixes page detection, localized text, actions, and step commands. | Page-change fixes remain hard to isolate. |
| `background.js` | Still too large as a bootstrap/orchestration file. | Should become dependency wiring only after helpers move out. |

## Guardrails

- Do not change user-visible behavior during this decomposition pass.
- Do not remove Free/Plus, UPI/IDEAL, Passkey, no-2FA, 2FA, eligibility, export, or email-pool functionality.
- Do not update version, create release assets, or publish to GitHub as part of this plan.
- Commit after each completed task.
- Every extracted module must have a small CommonJS test if it contains pure logic.

## Preflight

- [ ] **Step 1: Confirm clean workspace**

Run:

```powershell
git status --short
```

Expected: no output. If there is output, inspect it and do not overwrite unrelated user changes.

- [ ] **Step 2: Capture baseline checks**

Run:

```powershell
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`. `audit-smoke-tests.mjs` may continue warning that `background.js` and `sidepanel/sidepanel.js` are over the line-count threshold.

---

### Task 1: Make Sidepanel Free Import/Export Use The Shared Credential Format

**Files:**
- Modify: `sidepanel/account-records-manager.js`
- Modify: `scripts/audit-smoke-tests.mjs`
- Create: `scripts/test-sidepanel-membership-format-compat.cjs`
- Reuse: `shared/membership-credential-format.js`

- [ ] **Step 1: Add compatibility tests for current Free text formats**

Create `scripts/test-sidepanel-membership-format-compat.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const format = require('../shared/membership-credential-format.js');

test('formats full 2FA Free rows with verification URL, AT, and timestamp', () => {
  const line = format.formatFreeCredentialLine({
    email: 'User@Test.com',
    password: 'pw',
    totpMfaSecret: 'abcd efgh',
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=user%40test.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-07 12:00:00',
  });
  assert.equal(
    line,
    'user@test.com---pw---ABCDEFGH---https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5---at-token---2026-07-07 12:00:00',
  );
});

test('formats no-2FA Free rows as email URL AT timestamp', () => {
  const line = format.formatFreeCredentialLine({
    email: 'user@test.com',
    verificationUrl: 'https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-07 12:00:00',
    no2faFreeRoute: true,
  });
  assert.equal(
    line,
    'user@test.com---https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5---at-token---2026-07-07 12:00:00',
  );
});

test('parses Passkey marker rows without shifting AT and timestamp columns', () => {
  const row = format.parseCredentialLine(
    'user@test.com---pw---PASSKEY:cred-1;signCount=7;alg=-7---at-token---2026-07-07 12:00:00',
  );
  assert.equal(row.email, 'user@test.com');
  assert.equal(row.password, 'pw');
  assert.equal(row.passkeyEnabled, true);
  assert.equal(row.passkeyCredentialId, 'cred-1');
  assert.equal(row.passkeySignCount, 7);
  assert.equal(row.passkeyAlg, -7);
  assert.equal(row.accessToken, 'at-token');
  assert.equal(row.checkedAt, '2026-07-07 12:00:00');
});
```

- [ ] **Step 2: Run the new characterization test**

Run:

```powershell
node --test scripts/test-sidepanel-membership-format-compat.cjs
```

Expected: PASS before extraction, proving the shared parser/formatter already covers the sidepanel row shapes.

- [ ] **Step 3: Delegate duplicate sidepanel format helpers**

In `sidepanel/account-records-manager.js`, keep compatibility function names but delegate these local helpers to `window.MultiPageMembershipCredentialFormat`:

```javascript
function getMembershipCredentialFormatHelpers() {
  const helpers = root.MultiPageMembershipCredentialFormat;
  if (!helpers || typeof helpers.parseCredentialLine !== 'function') {
    throw new Error('Membership credential format module is not loaded.');
  }
  return helpers;
}
```

Use that helper for:

- `normalizeUpiCredentialMembershipCredential`
- `parseUpiCredentialMembershipText`
- Free export row construction where the output shape is `email---password---2FA/PASSKEY---url---AT---timestamp` or `email---url---AT---timestamp`.

- [ ] **Step 4: Verify script order remains valid**

Confirm `sidepanel/sidepanel.html` keeps:

```html
<script src="../shared/membership-credential-format.js"></script>
<script src="account-records-manager.js"></script>
```

Add an audit assertion in `scripts/audit-smoke-tests.mjs` that `membership-credential-format.js` appears before `account-records-manager.js`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/account-records-manager.js
node --check shared/membership-credential-format.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-membership-format-compat.cjs
node --test scripts/test-*.cjs
git add sidepanel/account-records-manager.js scripts/audit-smoke-tests.mjs scripts/test-sidepanel-membership-format-compat.cjs
git commit -m "refactor: share membership credential formatting in sidepanel"
```

---

### Task 2: Extract Account Record View Model And Filters

**Files:**
- Create: `sidepanel/account-records-view-model.js`
- Create: `scripts/test-account-records-view-model.cjs`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Add pure view-model module**

Create `sidepanel/account-records-view-model.js` with this public factory:

```javascript
(function attachAccountRecordsViewModel(root, factory) {
  const api = factory();
  root.SidepanelAccountRecordsViewModel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createAccountRecordsViewModelModule() {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function buildRecordId(record = {}) {
    return normalizeText(record.id)
      || normalizeText(record.recordId)
      || normalizeEmail(record.email)
      || normalizeText(record.accountId)
      || normalizeText(record.runId);
  }

  function getRecordEmail(record = {}) {
    return normalizeEmail(record.email || record.accountEmail || record.sessionEmail);
  }

  function getRecordStatus(record = {}) {
    return normalizeText(record.status || record.result || record.state).toLowerCase();
  }

  function summarizeAccountRunHistory(records = []) {
    const summary = { total: 0, success: 0, failed: 0, running: 0, stopped: 0 };
    for (const record of Array.isArray(records) ? records : []) {
      summary.total += 1;
      const status = getRecordStatus(record);
      if (status === 'success' || status === 'completed') summary.success += 1;
      else if (status === 'failed' || status === 'error') summary.failed += 1;
      else if (status === 'running' || status === 'active') summary.running += 1;
      else if (status === 'stopped' || status === 'cancelled') summary.stopped += 1;
    }
    return summary;
  }

  function filterRecords(records = [], filterKey = 'all') {
    const list = Array.isArray(records) ? records : [];
    const normalizedFilter = normalizeText(filterKey).toLowerCase() || 'all';
    if (normalizedFilter === 'all') return list;
    if (normalizedFilter === 'success') {
      return list.filter((record) => ['success', 'completed'].includes(getRecordStatus(record)));
    }
    if (normalizedFilter === 'failed') {
      return list.filter((record) => ['failed', 'error'].includes(getRecordStatus(record)));
    }
    if (normalizedFilter === 'running') {
      return list.filter((record) => ['running', 'active'].includes(getRecordStatus(record)));
    }
    return list;
  }

  return {
    buildRecordId,
    getRecordEmail,
    getRecordStatus,
    summarizeAccountRunHistory,
    filterRecords,
  };
});
```

- [ ] **Step 2: Add unit tests**

Create `scripts/test-account-records-view-model.cjs` covering ID fallback, email normalization, history summary, and status filters:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const viewModel = require('../sidepanel/account-records-view-model.js');

test('buildRecordId falls back to normalized email', () => {
  assert.equal(viewModel.buildRecordId({ email: 'User@Test.com' }), 'user@test.com');
});

test('summarizeAccountRunHistory counts current statuses', () => {
  assert.deepEqual(viewModel.summarizeAccountRunHistory([
    { status: 'success' },
    { status: 'completed' },
    { status: 'failed' },
    { status: 'running' },
    { status: 'stopped' },
  ]), { total: 5, success: 2, failed: 1, running: 1, stopped: 1 });
});

test('filterRecords returns matching status groups', () => {
  const records = [{ status: 'success' }, { status: 'failed' }, { status: 'running' }];
  assert.equal(viewModel.filterRecords(records, 'success').length, 1);
  assert.equal(viewModel.filterRecords(records, 'failed').length, 1);
  assert.equal(viewModel.filterRecords(records, 'running').length, 1);
  assert.equal(viewModel.filterRecords(records, 'all').length, 3);
});
```

- [ ] **Step 3: Delegate pure record helpers from the manager**

In `sidepanel/account-records-manager.js`, create:

```javascript
const accountRecordsViewModel = root.SidepanelAccountRecordsViewModel;
if (!accountRecordsViewModel) {
  throw new Error('Account records view model module is not loaded.');
}
```

Delegate `buildRecordId`, `getRecordEmail`, `summarizeAccountRunHistory`, and filtered-record decisions to this module. Keep DOM rendering, event listeners, pagination state, and modal actions inside `account-records-manager.js`.

- [ ] **Step 4: Load and audit the module**

In `sidepanel/sidepanel.html`, load the new file before `account-records-manager.js`:

```html
<script src="account-records-view-model.js"></script>
<script src="account-records-manager.js"></script>
```

Update `scripts/audit-smoke-tests.mjs` to assert:

- `sidepanel/account-records-view-model.js` exists.
- It contains `SidepanelAccountRecordsViewModel`.
- It is loaded before `account-records-manager.js`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/account-records-view-model.js
node --check sidepanel/account-records-manager.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-account-records-view-model.cjs
node --test scripts/test-*.cjs
git add sidepanel/account-records-view-model.js sidepanel/account-records-manager.js sidepanel/sidepanel.html scripts/audit-smoke-tests.mjs scripts/test-account-records-view-model.cjs
git commit -m "refactor: extract account records view model"
```

---

### Task 3: Extract Membership Redeem Progress View Logic

**Files:**
- Create: `sidepanel/membership-redeem-progress.js`
- Create: `scripts/test-membership-redeem-progress.cjs`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Move progress metadata and HTML generation**

Create `sidepanel/membership-redeem-progress.js` with:

```javascript
(function attachMembershipRedeemProgress(root, factory) {
  const api = factory();
  root.SidepanelMembershipRedeemProgress = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipRedeemProgressModule() {
  function clampPercent(value = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  function getProgressMeta(row = {}) {
    const status = String(row.redeemStatus || row.status || '').trim().toLowerCase();
    if (status === 'submitted' || status === 'pending') return { active: true, percent: 50, label: '兑换中' };
    if (status === 'paid' || status === 'success') return { active: false, percent: 100, label: '已完成' };
    if (status === 'failed') return { active: false, percent: 100, label: '失败' };
    return { active: false, percent: 0, label: '' };
  }

  function renderProgress(row = {}) {
    const meta = getProgressMeta(row);
    if (!meta.label) return '';
    const percent = clampPercent(meta.percent);
    return `<div class="redeem-progress" data-active="${meta.active ? '1' : '0'}"><span class="redeem-progress-bar" style="width:${percent}%"></span><span class="redeem-progress-label">${meta.label}</span></div>`;
  }

  return { clampPercent, getProgressMeta, renderProgress };
});
```

- [ ] **Step 2: Add unit tests**

Create `scripts/test-membership-redeem-progress.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const progress = require('../sidepanel/membership-redeem-progress.js');

test('clampPercent keeps progress between 0 and 100', () => {
  assert.equal(progress.clampPercent(-1), 0);
  assert.equal(progress.clampPercent(48.4), 48);
  assert.equal(progress.clampPercent(101), 100);
});

test('submitted rows render active progress', () => {
  const html = progress.renderProgress({ redeemStatus: 'submitted' });
  assert.match(html, /data-active="1"/);
  assert.match(html, /兑换中/);
});

test('unknown rows render no progress html', () => {
  assert.equal(progress.renderProgress({ status: 'free' }), '');
});
```

- [ ] **Step 3: Delegate progress rendering from account records manager**

Replace local progress helpers in `sidepanel/account-records-manager.js` with calls to `root.SidepanelMembershipRedeemProgress`. Keep row layout and click handlers inside the manager.

- [ ] **Step 4: Load and audit the module**

Load before `account-records-manager.js`:

```html
<script src="membership-redeem-progress.js"></script>
<script src="account-records-manager.js"></script>
```

Add smoke checks for file existence, global namespace, and script order.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/membership-redeem-progress.js
node --check sidepanel/account-records-manager.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-membership-redeem-progress.cjs
node --test scripts/test-*.cjs
git add sidepanel/membership-redeem-progress.js sidepanel/account-records-manager.js sidepanel/sidepanel.html scripts/audit-smoke-tests.mjs scripts/test-membership-redeem-progress.cjs
git commit -m "refactor: extract membership redeem progress view"
```

---

### Task 4: Extract Background Membership Result State

**Files:**
- Create: `background/membership/result-state.js`
- Create: `scripts/test-membership-result-state.cjs`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Extract pure result normalization**

Create `background/membership/result-state.js` and move pure helpers for:

- `normalizeRedeemPlusDeletedEmailsByChannel`
- `addRedeemPlusDeletedEmailsByChannel`
- `buildRedeemDeletionStatePatch`
- `mergeRedeemDeletionStateForSave`
- `normalizeResultItem`
- `dedupeResultItemsByEmail`
- `normalizeResultsPayload`
- `buildResultExportRows`

The module must attach:

```javascript
root.MultiPageMembershipResultState = {
  normalizeRedeemPlusDeletedEmailsByChannel,
  addRedeemPlusDeletedEmailsByChannel,
  buildRedeemDeletionStatePatch,
  mergeRedeemDeletionStateForSave,
  normalizeResultItem,
  dedupeResultItemsByEmail,
  normalizeResultsPayload,
  buildResultExportRows,
};
```

- [ ] **Step 2: Add result-state tests**

Create `scripts/test-membership-result-state.cjs` with tests for:

- deleted UPI Plus tombstones do not hide IDEAL Plus.
- duplicate emails keep the newest updated result.
- Free export rows preserve password, 2FA/Passkey marker, URL, AT, and timestamp.
- `normalizeResultsPayload` preserves `redeemPlusDeletedEmailsByChannel`.

- [ ] **Step 3: Delegate from checker**

In `background/upi-credential-membership-checker.js`, replace local pure implementations with:

```javascript
function getMembershipResultStateHelpers() {
  const helpers = root.MultiPageMembershipResultState;
  if (!helpers || typeof helpers.normalizeResultsPayload !== 'function') {
    throw new Error('Membership result state module is not loaded.');
  }
  return helpers;
}
```

Keep the existing exported checker API unchanged.

- [ ] **Step 4: Load and audit the module**

Ensure `background.js` imports `background/membership/result-state.js` before `background/membership/results-store.js` and before `background/upi-credential-membership-checker.js`.

Update `scripts/audit-smoke-tests.mjs` to assert the new import order.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check background/membership/result-state.js
node --check background/upi-credential-membership-checker.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-membership-result-state.cjs
node --test scripts/test-*.cjs
git add background/membership/result-state.js background/upi-credential-membership-checker.js background.js scripts/audit-smoke-tests.mjs scripts/test-membership-result-state.cjs
git commit -m "refactor: extract membership result state helpers"
```

---

### Task 5: Extract Background Login And AT Supplement Executor

**Files:**
- Create: `background/membership/login-session-executor.js`
- Create: `scripts/test-login-session-executor.cjs`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Move login-session side-effect functions behind one factory**

Create `background/membership/login-session-executor.js` exposing:

```javascript
root.MultiPageMembershipLoginSessionExecutor = {
  createMembershipLoginSessionExecutor,
};
```

The factory receives dependencies explicitly:

```javascript
function createMembershipLoginSessionExecutor({
  addLog,
  chromeApi,
  fetchImpl,
  clearOpenAiCookies,
  ensureContentScriptReadyOnTabUntilStopped,
  fetchVerificationCodeOnly,
  registerTab,
  reuseOrCreateTab,
  sendTabMessageUntilStopped,
  sleepWithStop,
  throwIfStopped,
}) {
  return {
    getLoginEmailCodeForCredential,
    openFreshLoginTab,
    loginAndReadAccessToken,
    loginUpiCredentialMembershipAccount,
  };
}
```

Move browser-login and AT-reading functions from `background/upi-credential-membership-checker.js` into this executor. Keep checker orchestration responsible for choosing which credential to process.

- [ ] **Step 2: Add pure login helper tests**

Create `scripts/test-login-session-executor.cjs` for pure helpers exported by the module:

- `buildLoginFailureReason(snapshot, fallback)`
- `hasLoginVerificationChallenge(snapshot)`
- `isEmailVerificationChallenge(snapshot)`
- `isTotpVerificationChallenge(snapshot)`

Use representative snapshots with Hindi/English labels only as strings; do not require a browser.

- [ ] **Step 3: Wire checker to the executor**

Inside `createUpiCredentialMembershipChecker`, instantiate:

```javascript
const loginSessionExecutor = root.MultiPageMembershipLoginSessionExecutor.createMembershipLoginSessionExecutor({
  addLog,
  chromeApi,
  fetchImpl,
  clearOpenAiCookies,
  ensureContentScriptReadyOnTabUntilStopped,
  fetchVerificationCodeOnly,
  registerTab,
  reuseOrCreateTab,
  sendTabMessageUntilStopped,
  sleepWithStop,
  throwIfStopped,
});
```

Delegate `loginAndReadAccessToken` and `loginUpiCredentialMembershipAccount` calls to `loginSessionExecutor`.

- [ ] **Step 4: Load and audit the module**

Ensure `background.js` imports `background/membership/login-session-executor.js` before `background/upi-credential-membership-checker.js`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check background/membership/login-session-executor.js
node --check background/upi-credential-membership-checker.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-login-session-executor.cjs
node --test scripts/test-*.cjs
git add background/membership/login-session-executor.js background/upi-credential-membership-checker.js background.js scripts/audit-smoke-tests.mjs scripts/test-login-session-executor.cjs
git commit -m "refactor: extract membership login session executor"
```

---

### Task 6: Extract Auth Page Detectors From Content Script

**Files:**
- Create: `content/auth-page-detectors.js`
- Create: `scripts/test-auth-page-detectors.cjs`
- Modify: `content/signup-page.js`
- Modify: `manifest.json` or background injection file list if content scripts are injected manually
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Move text and URL detectors**

Create `content/auth-page-detectors.js` exposing:

```javascript
root.MultiPageAuthPageDetectors = {
  normalizePageText,
  isSignupEntryText,
  isLoginEntryText,
  isContinueText,
  isResendEmailText,
  isPasswordPageText,
  isAboutYouUrl,
  isChatGptHomeUrl,
};
```

Move localized matching tables for English, Chinese, Japanese, and Hindi into this file. Keep DOM clicks and form filling in `content/signup-page.js`.

- [ ] **Step 2: Add detector tests**

Create `scripts/test-auth-page-detectors.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const detectors = require('../content/auth-page-detectors.js');

test('recognizes Hindi login and continue labels', () => {
  assert.equal(detectors.isLoginEntryText('लॉग इन करें'), true);
  assert.equal(detectors.isContinueText('जारी रखें'), true);
});

test('does not treat Hindi plans pricing as signup', () => {
  assert.equal(detectors.isSignupEntryText('प्लान्स और प्राइसिंग देखें'), false);
});

test('recognizes resend email labels', () => {
  assert.equal(detectors.isResendEmailText('Resend email'), true);
  assert.equal(detectors.isResendEmailText('ईमेल दोबारा भेजें'), true);
});
```

- [ ] **Step 3: Delegate from signup-page**

In `content/signup-page.js`, replace local text detector implementations with `root.MultiPageAuthPageDetectors`. Keep public message handlers and DOM operations in `signup-page.js`.

- [ ] **Step 4: Update injection order**

If content scripts are injected through a file list, ensure `content/auth-page-detectors.js` is injected before `content/signup-page.js`.

Update `scripts/audit-smoke-tests.mjs` to assert the file is present in the injection list before `signup-page.js`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check content/auth-page-detectors.js
node --check content/signup-page.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-auth-page-detectors.cjs
node --test scripts/test-*.cjs
git add content/auth-page-detectors.js content/signup-page.js manifest.json background.js scripts/audit-smoke-tests.mjs scripts/test-auth-page-detectors.cjs
git commit -m "refactor: extract auth page text detectors"
```

---

### Task 7: Re-run Size Audit And Set Next Thresholds

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: `docs/superpowers/plans/2026-07-07-codebase-decomposition-next-steps.md`

**Execution Results:**

| File | Current Lines | Guard |
| --- | ---: | ---: |
| `content/signup-page.js` | 6,855 | 7,000 |
| `background/upi-credential-membership-checker.js` | 6,529 | 6,700 |
| `sidepanel/account-records-manager.js` | 5,438 | 5,600 |

The two largest files, `background.js` and `sidepanel/sidepanel.js`, remain above the global smoke warning threshold and should be handled in later focused passes.

- [x] **Step 1: Measure tracked source sizes**

Run:

```powershell
Get-ChildItem -File -Recurse -Include *.js,*.mjs,*.cjs |
  Where-Object { $_.FullName -notmatch '\\.git\\|node_modules|\\.codegraph\\|\\.codex-backups\\' } |
  ForEach-Object {
    $lines = (Get-Content -LiteralPath $_.FullName | Measure-Object -Line).Lines
    [PSCustomObject]@{ Lines = $lines; Path = $_.FullName.Substring((Get-Location).Path.Length + 1) }
  } |
  Sort-Object Lines -Descending |
  Select-Object -First 20 |
  Format-Table -AutoSize
```

- [x] **Step 2: Tighten smoke warning targets only when achieved**

If `sidepanel/account-records-manager.js`, `background/upi-credential-membership-checker.js`, or `content/signup-page.js` drop below a meaningful boundary, add warnings in `scripts/audit-smoke-tests.mjs` to prevent those files from growing back above that boundary.

Applied achieved thresholds:

```javascript
assertFileLineCountAtMost('content/signup-page.js', 7000, 'signup content script growth guard');
assertFileLineCountAtMost('background/upi-credential-membership-checker.js', 6700, 'membership checker growth guard');
assertFileLineCountAtMost('sidepanel/account-records-manager.js', 5600, 'account records manager growth guard');
```

- [x] **Step 3: Run the full verification set**

Run:

```powershell
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`.

- [x] **Step 4: Commit the audit boundary**

Run:

Committed as `test: tighten decomposition size guards`.

---

## Manual Smoke Checklist After The Full Pass

- Load the unpacked extension locally.
- Open sidepanel and confirm the main workflow still shows 7 steps.
- Import one Free TXT with full 2FA format.
- Import one Free TXT with no-2FA format.
- Import one Free TXT with Passkey marker format.
- Confirm Free rows show the same status/counts as before.
- Run one manual eligibility check from the email pool.
- Run one `一键补充 AT` on a row with valid material.
- Confirm UPI/IDEAL buttons still show counts.
- Export Free and verify the row delimiter remains `---`.
- Confirm logs no longer show missing-module errors.

## Self-Review

- Spec coverage: This plan addresses the biggest remaining files by extracting sidepanel record logic, background membership state, background login/AT side effects, and content-page detectors.
- Placeholder scan: No task relies on unspecified files or unnamed helpers.
- Type consistency: All new modules use the existing project pattern of a global namespace plus CommonJS export for tests.
