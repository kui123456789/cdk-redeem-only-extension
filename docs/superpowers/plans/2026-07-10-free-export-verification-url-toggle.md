# Free Export Verification URL Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent Free export button that includes or removes the email verification URL while keeping every supported TXT format importable.

**Architecture:** A new sidepanel preference module owns the persisted boolean. The UI reads and toggles that preference, the export action sends `includeVerificationUrl` to the background, and the shared credential formatter remains the only place that decides column layout. The parser gains an unambiguous three-field no-2FA branch.

**Tech Stack:** Chrome Manifest V3, plain JavaScript, browser globals, `localStorage`, Node `node:test` and `node:assert/strict`.

## Global Constraints

- The button is shown only in the Free group and defaults to enabled.
- Persist the setting under `localStorage` key `upiFreeExportIncludeVerificationUrl`.
- Only the exact stored string `false` disables the option; missing or invalid values enable it.
- The setting changes exported text only and never removes `verificationUrl` from stored records.
- Missing `includeVerificationUrl` backend parameters must preserve V1.0.10 behavior.
- Plus exports must remain unchanged.
- Do not update the extension version, create a package, or publish GitHub changes as part of implementation.

---

### Task 1: Add The Persistent Free Export Preference

**Files:**
- Create: `sidepanel/account-records-free-export-preferences.js`
- Create: `scripts/test-account-records-free-export-preferences.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `scripts/test-account-records-manager.cjs`

**Interfaces:**
- Produces: `SidepanelAccountRecordsFreeExportPreferences.createFreeExportPreferences(options)`.
- Produces instance methods `getIncludeVerificationUrl(): boolean`, `setIncludeVerificationUrl(value): boolean`, and `toggleIncludeVerificationUrl(): boolean`.
- Consumes optional `options.storage`, defaulting to `globalScope.localStorage`.

- [ ] **Step 1: Write failing preference tests**

```javascript
test('Free export verification URL preference defaults on and persists off', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  };
  const prefs = api.createFreeExportPreferences({ storage });
  assert.equal(prefs.getIncludeVerificationUrl(), true);
  assert.equal(prefs.setIncludeVerificationUrl(false), false);
  assert.equal(values.get('upiFreeExportIncludeVerificationUrl'), 'false');
  assert.equal(prefs.getIncludeVerificationUrl(), false);
  assert.equal(prefs.toggleIncludeVerificationUrl(), true);
});

test('Free export preference falls back on for invalid or unavailable storage', () => {
  const invalid = api.createFreeExportPreferences({ storage: { getItem: () => 'broken' } });
  assert.equal(invalid.getIncludeVerificationUrl(), true);
  const unavailable = api.createFreeExportPreferences({ storage: { getItem: () => { throw new Error('blocked'); } } });
  assert.equal(unavailable.getIncludeVerificationUrl(), true);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test scripts/test-account-records-free-export-preferences.cjs`

Expected: FAIL because `account-records-free-export-preferences.js` does not exist.

- [ ] **Step 3: Implement the focused preference module**

```javascript
(function attachFreeExportPreferences(globalScope) {
  const STORAGE_KEY = 'upiFreeExportIncludeVerificationUrl';

  function createFreeExportPreferences(options = {}) {
    const storage = options.storage || globalScope.localStorage;
    function getIncludeVerificationUrl() {
      try {
        return storage?.getItem(STORAGE_KEY) !== 'false';
      } catch {
        return true;
      }
    }
    function setIncludeVerificationUrl(value) {
      const enabled = value !== false;
      try { storage?.setItem(STORAGE_KEY, String(enabled)); } catch {}
      return enabled;
    }
    function toggleIncludeVerificationUrl() {
      return setIncludeVerificationUrl(!getIncludeVerificationUrl());
    }
    return { getIncludeVerificationUrl, setIncludeVerificationUrl, toggleIncludeVerificationUrl };
  }

  const api = { STORAGE_KEY, createFreeExportPreferences };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsFreeExportPreferences = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

Load the new script before `account-records-manager.js`. In the manager, fail loudly if the factory is missing, create one instance, and expose its getter/toggler to later UI tasks.

- [ ] **Step 4: Run focused tests**

Run: `node --test scripts/test-account-records-free-export-preferences.cjs scripts/test-account-records-manager.cjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add sidepanel/account-records-free-export-preferences.js sidepanel/sidepanel.html sidepanel/account-records-manager.js scripts/test-account-records-free-export-preferences.cjs scripts/test-account-records-manager.cjs
git commit -m "feat: persist Free export address preference"
```

---

### Task 2: Support URL-Free Free Credential Formats

**Files:**
- Modify: `shared/membership-credential-format.js`
- Modify: `scripts/test-membership-credential-format.cjs`
- Modify: `background/membership/result-state.js`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `scripts/test-membership-result-state.cjs`

**Interfaces:**
- Changes: `formatFreeCredentialLine(item, options = {})`, where `options.includeVerificationUrl !== false` preserves the URL.
- Changes: `buildResultExportRows(results, status, channel, emails, options = {})` and its checker wrapper.
- Adds parse support for `email---accessToken---timestamp` when the third field is a recognizable timestamp.

- [ ] **Step 1: Add failing shared formatter and parser tests**

```javascript
test('formats every Free route without verification URL when disabled', () => {
  assert.equal(format.formatFreeCredentialLine({
    email: 'no2fa@example.com', no2faFreeRoute: true,
    verificationUrl: 'https://assurivo.com/console/open.php?id=1',
    accessToken: 'at-no2fa', checkedAt: '2026-07-10 12:00:00',
  }, { includeVerificationUrl: false }), 'no2fa@example.com---at-no2fa---2026-07-10 12:00:00');
  assert.equal(format.formatFreeCredentialLine({
    email: 'twofa@example.com', password: 'pw', totpMfaSecret: 'SECRET',
    verificationUrl: 'https://assurivo.com/console/open.php?id=2',
    accessToken: 'at-2fa', checkedAt: '2026-07-10 12:00:00',
  }, { includeVerificationUrl: false }), 'twofa@example.com---pw---SECRET---at-2fa---2026-07-10 12:00:00');
});

test('parses URL-free no-2FA Free row without mistaking three-field 2FA', () => {
  const row = format.parseCredentialLine('no2fa@example.com---at-token---2026-07-10 12:00:00');
  assert.equal(row.no2faFreeRoute, true);
  assert.equal(row.accessToken, 'at-token');
  assert.equal(row.checkedAt, '2026-07-10 12:00:00');
  const legacy = format.parseCredentialLine('twofa@example.com---pw---SECRET');
  assert.equal(legacy.no2faFreeRoute, undefined);
  assert.equal(legacy.password, 'pw');
  assert.equal(legacy.totpMfaSecret, 'SECRET');
});
```

- [ ] **Step 2: Run shared tests and verify failure**

Run: `node --test scripts/test-membership-credential-format.cjs`

Expected: FAIL because the formatter ignores options and the parser treats the three-field row as password/2FA.

- [ ] **Step 3: Implement formatter and parser branches**

Add this branch before Passkey parsing:

```javascript
if (normalizedParts.length === 3 && isLikelyTimestamp(normalizedParts[2])) {
  return buildCredentialRow({
    email: normalizedParts[0],
    accessToken: normalizedParts[1],
    accessTokenUpdatedAt: normalizedParts[2],
    checkedAt: normalizedParts[2],
    no2faFreeRoute: true,
    twoFactorEnabled: false,
  }, options);
}
```

In `formatFreeCredentialLine`, derive `const includeVerificationUrl = options.includeVerificationUrl !== false`; omit the URL for all three routes when false.

Pass the same option through `buildResultExportRows`. Preserve the default by passing an empty options object from legacy callers.

- [ ] **Step 4: Add and run result-state coverage**

Extend the existing Free export test to call:

```javascript
const rows = resultState.buildResultExportRows(results, 'free', '', [], {
  includeVerificationUrl: false,
});
```

Assert URL-free 2FA and Passkey rows plus `email---AT---time` for no-2FA. Run:

`node --test scripts/test-membership-credential-format.cjs scripts/test-membership-result-state.cjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add shared/membership-credential-format.js background/membership/result-state.js background/upi-credential-membership-checker.js scripts/test-membership-credential-format.cjs scripts/test-membership-result-state.cjs
git commit -m "feat: support URL-free Free credential rows"
```

---

### Task 3: Propagate The Export Option Through The Background

**Files:**
- Modify: `background/membership/import-export-service.js`
- Create: `scripts/test-membership-import-export-service.cjs`

**Interfaces:**
- Consumes: `input.includeVerificationUrl` from the sidepanel message.
- Calls: `buildResultExportRows(results, status, channel, allowedEmails, { includeVerificationUrl })`.
- Produces filename prefix `upi-membership-free-email-at` for all-no-2FA URL-free exports.

- [ ] **Step 1: Write failing service tests**

Build the service with dependency stubs and capture the fifth `buildResultExportRows` argument:

```javascript
function createService({ buildRows, results }) {
  return api.createImportExportService({
    buildRedeemAccountUnlockedPatch: () => ({}),
    buildResultExportRows: buildRows,
    buildTimestampedFileName: (prefix) => `${prefix}-20260710.txt`,
    deleteUpiCredentialMembershipCheckResults: async () => ({ deletedCount: 0 }),
    getActiveRedeemCdkeyUsageEmailSetFromState: () => new Set(),
    getResultItemRedeemChannel: (item) => item.redeemChannel || 'upi',
    getState: async () => ({}),
    getStoredResults: async () => results,
    isActiveUpiCredentialMembershipRedeemResultItem: () => false,
    isBatchRunning: () => false,
    isCdkeyRetryRunning: () => false,
    isLikelyVerificationUrl: (value) => /^https?:\/\//i.test(String(value || '')),
    isPasskeyExportMarker: (value) => /^PASSKEY:/i.test(String(value || '')),
    isRedeemRunning: () => false,
    isResultItemHiddenByPlusDeletion: () => false,
    isResultItemPasskeyExportableForStatus: () => false,
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    normalizeEmailList: (values) => values.map((value) => String(value || '').trim().toLowerCase()),
    normalizeRedeemChannel: (value) => String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi',
    normalizeResultItem: (item) => item,
    normalizeResultsPayload: (value) => value,
    normalizeString: (value) => String(value || '').trim().toLowerCase(),
    resolveInputCredentials: () => [],
    saveResults: async (value) => value,
  });
}

test('Free export forwards disabled URL option and selects URL-free filename', async () => {
  let capturedOptions;
  const service = createService({
    buildRows(_results, _status, _channel, _emails, options) {
      capturedOptions = options;
      return ['a@example.com---at-token---2026-07-10 12:00:00'];
    },
    results: { items: [{ email: 'a@example.com', status: 'free', no2faFreeRoute: true, accessToken: 'at-token' }] },
  });
  const output = await service.exportUpiCredentialMembershipCheckResults({
    status: 'free', emails: ['a@example.com'], includeVerificationUrl: false,
  });
  assert.deepEqual(capturedOptions, { includeVerificationUrl: false });
  assert.match(output.fileName, /^upi-membership-free-email-at-/);
});
```

Add a second assertion that omitting the parameter forwards `{ includeVerificationUrl: true }` and retains `upi-membership-free-email-url-at` for four-field rows.

- [ ] **Step 2: Run the service test and verify failure**

Run: `node --test scripts/test-membership-import-export-service.cjs`

Expected: FAIL because the service currently calls `buildResultExportRows` with four arguments and recognizes only four-field no-2FA rows.

- [ ] **Step 3: Implement option normalization and filename detection**

```javascript
const includeVerificationUrl = input.includeVerificationUrl !== false;
const rows = buildResultExportRows(results, status, channel, allowedEmails, {
  includeVerificationUrl,
});
const allFreeRowsAreNo2faWithUrl = status === 'free' && rows.length > 0
  && rows.every((row) => {
    const parts = String(row || '').split(/---+/).map((part) => part.trim());
    return parts.length === 4 && isLikelyVerificationUrl(parts[1]);
  });
const allFreeRowsAreNo2faWithoutUrl = status === 'free' && rows.length > 0
  && rows.every((row) => {
    const parts = String(row || '').split(/---+/).map((part) => part.trim());
    return parts.length === 3 && !isLikelyVerificationUrl(parts[1]);
  });
```

Select `upi-membership-free-email-at` for the second case. For no-2FA export eligibility, require `verificationUrl` only when `includeVerificationUrl` is true.

- [ ] **Step 4: Run focused backend tests**

Run: `node --test scripts/test-membership-import-export-service.cjs scripts/test-membership-result-state.cjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add background/membership/import-export-service.js scripts/test-membership-import-export-service.cjs
git commit -m "feat: control Free export address columns"
```

---

### Task 4: Add The Free Group Toggle Button And Message Payload

**Files:**
- Modify: `sidepanel/account-records-membership-results-renderer.js`
- Modify: `sidepanel/account-records-panel-events.js`
- Modify: `sidepanel/account-records-membership-result-ops.js`
- Modify: `sidepanel/account-records-manager.js`
- Create: `scripts/test-account-records-free-export-ui.cjs`

**Interfaces:**
- Renderer consumes `getFreeExportIncludeVerificationUrl(): boolean`.
- Panel events consume `toggleFreeExportIncludeVerificationUrl(): boolean`.
- Result operations consume `getFreeExportIncludeVerificationUrl(): boolean`.

- [ ] **Step 1: Write failing UI and payload tests**

Test renderer output in both states:

```javascript
function renderWithPreference(includeVerificationUrl) {
  const container = {
    innerHTML: '',
    querySelector: () => null,
  };
  const renderer = rendererApi.createAccountRecordsMembershipResultsRenderer({
    dom: { upiCredentialMembershipCheckResults: container },
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({ items: [{}], completed: 1, total: 1 }),
    buildUpiCredentialMembershipDisplayRows: () => [{
      email: 'free@example.com', status: 'free', enabled: true, accessToken: 'at-token',
    }],
    getUpiCredentialMembershipUiGroup: () => 'free',
    summarizeMembershipViewModelRows: () => ({ free: 1, 'upi-plus': 0, 'ideal-plus': 0 }),
    getFreeExportIncludeVerificationUrl: () => includeVerificationUrl,
  });
  renderer.renderUpiCredentialMembershipCheckResults();
  return container.innerHTML;
}

assert.match(renderWithPreference(true), /data-upi-membership-toggle-export-verification-url[^>]*is-active/);
assert.match(renderWithPreference(true), /取件地址：开/);
assert.match(renderWithPreference(false), /取件地址：关/);
assert.doesNotMatch(renderWithPreference(false), /toggle-export-verification-url[^>]*is-active/);
```

Test panel click invokes the toggle callback, and test result operations send:

```javascript
assert.equal(message.payload.includeVerificationUrl, false);
```

for Free while the paid payload has no `includeVerificationUrl` property.

- [ ] **Step 2: Run UI tests and verify failure**

Run: `node --test scripts/test-account-records-free-export-ui.cjs`

Expected: FAIL because the button, event branch, and payload field do not exist.

- [ ] **Step 3: Render and bind the button**

Place this button immediately after `导出 Free`:

```javascript
const includeVerificationUrl = getFreeExportIncludeVerificationUrl();
const verificationUrlToggle = `<button
  class="btn btn-ghost btn-xs${includeVerificationUrl ? ' is-active' : ''}"
  type="button"
  data-upi-membership-toggle-export-verification-url
  aria-pressed="${includeVerificationUrl ? 'true' : 'false'}"
  title="控制 Free TXT 导出是否包含邮箱取件地址"
>取件地址：${includeVerificationUrl ? '开' : '关'}</button>`;
```

Handle the dataset action before the normal export branch, toggle the preference, and call `render()`.

- [ ] **Step 4: Add the conditional export payload**

```javascript
const payload = { status: payloadStatus, emails: exportEmails, removeAfterExport: false };
if (normalizedStatus === 'free') {
  payload.includeVerificationUrl = getFreeExportIncludeVerificationUrl();
}
```

Inject the same preference instance from `account-records-manager.js` into renderer, panel events, and result operations.

- [ ] **Step 5: Run focused UI tests**

Run: `node --test scripts/test-account-records-free-export-ui.cjs scripts/test-account-records-manager.cjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add sidepanel/account-records-membership-results-renderer.js sidepanel/account-records-panel-events.js sidepanel/account-records-membership-result-ops.js sidepanel/account-records-manager.js scripts/test-account-records-free-export-ui.cjs
git commit -m "feat: add Free export address toggle"
```

---

### Task 5: Update Static Contracts And Run Full Verification

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Static audit must require the new preference script before `account-records-manager.js`.
- Static audit must verify the new global factory and the `includeVerificationUrl` export contract.

- [ ] **Step 1: Add failing audit contracts**

Add the source loading variable and these exact assertions:

```javascript
const accountRecordsFreeExportPreferences = readText('sidepanel/account-records-free-export-preferences.js');
assertIncludes(sidepanelHtml, 'src="account-records-free-export-preferences.js"', 'Free export preference script load');
assertBefore(sidepanelHtml, 'src="account-records-free-export-preferences.js"', 'src="account-records-manager.js"', 'Free export preferences must load before manager');
assertIncludes(accountRecordsFreeExportPreferences, 'createFreeExportPreferences', 'Free export preference factory');
assertIncludes(accountRecordsMembershipResultOps, 'includeVerificationUrl', 'Free export address payload');
```

- [ ] **Step 2: Run syntax and focused tests**

```powershell
node --check sidepanel/account-records-free-export-preferences.js
node --check sidepanel/account-records-membership-results-renderer.js
node --check sidepanel/account-records-panel-events.js
node --check sidepanel/account-records-membership-result-ops.js
node --check shared/membership-credential-format.js
node --check background/membership/result-state.js
node --check background/membership/import-export-service.js
node --test scripts/test-account-records-free-export-preferences.cjs scripts/test-account-records-free-export-ui.cjs scripts/test-membership-credential-format.cjs scripts/test-membership-result-state.cjs scripts/test-membership-import-export-service.cjs
```

Expected: all commands exit 0.

- [ ] **Step 3: Run the complete regression suite**

Run: `node --test scripts/test-*.cjs`

Expected: all tests pass with zero failures.

- [ ] **Step 4: Run the static audit and compare with baseline**

Run: `node scripts/audit-smoke-tests.mjs`

Expected: no new contract failures. Until the separate decomposition work changes the baseline, the command exits 1 with exactly the existing size-guard failures for `sidepanel/sidepanel-app-controller.js`, `background/steps/upi-redeem/free-entry.js`, and `background/steps/upi-redeem/channel-submission.js`.

- [ ] **Step 5: Inspect final diff and commit audit coverage**

```powershell
git diff --check
git status --short
git diff --stat HEAD~4..HEAD
git add scripts/audit-smoke-tests.mjs
git commit -m "test: cover Free export address toggle"
```

Expected: only intended source, tests, spec, and plan changes are present; no generated exports, credentials, or release artifacts are tracked.
