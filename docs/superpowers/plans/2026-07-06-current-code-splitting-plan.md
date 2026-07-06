# Current Code Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current V1.0.6 codebase into focused modules without changing registration, custom email pool, Free/Plus, UPI/IDEAL redeem, Passkey, TXT/JSON export, or fingerprint-browser download behavior.

**Architecture:** Keep the current Chrome MV3 no-bundler architecture. Reuse existing split points first: `MultiPageRedeemChannelState`, `MultiPageRedeemCdkeyUsage`, and `SidepanelSettingsTransferManager` already exist and must be extended or moved, not duplicated. Existing entry files remain compatibility composition roots until their callers are safely switched.

**Tech Stack:** Plain JavaScript, Chrome Extension MV3, ordered `importScripts`, ordered sidepanel `<script>` tags, Node syntax checks, existing audit scripts, Node test runner.

---

## Current Baseline

Measured on 2026-07-06 with `node scripts/module-size-report.mjs`:

| Priority | File | Lines | Bytes | Split Direction |
| --- | --- | ---: | ---: | --- |
| P0 | `background.js` | 16460 | 610746 | Split stable state registries after low-risk shared helpers. |
| P0 | `sidepanel/sidepanel.js` | 10875 | 469939 | Keep as composition root; extract settings/workflow managers after parser and view-model work. |
| P0 | `background/upi-credential-membership-checker.js` | 7488 | 342641 | Extract credential format, results store, and access-token helpers. |
| P1 | `content/signup-page.js` | 6751 | 250241 | Split page-type helpers after background/sidepanel behavior is stable. |
| P1 | `sidepanel/account-records-manager.js` | 5522 | 247511 | Extract parser delegation, view model, then renderer. |
| P1 | `background/steps/upi-redeem.js` | 5065 | 209962 | Extend current CDK helper, then split API client. |
| P1 | `background/message-router.js` | 4048 | 172621 | Move routes only after domain helpers are shared. |

## Corrections To The Previous Draft

- Do not create `shared/redeem-channel-policy.js`; move and extend existing `background/redeem/redeem-channel-state.js`.
- Do not create `background/redeem/cdkey-usage-state.js`; extend existing `background/redeem/redeem-cdkey-usage.js`.
- Do not create `sidepanel/config-transfer-manager.js`; `sidepanel/settings-transfer-manager.js` already owns config import/export.
- Do not remove contextual checks from `shouldRedeemItemUseChannel`; current callers require `trialEligibilityStatus === "eligible"` and `isTrialEligibilityChannelAllowed`.
- Do not parse TXT credential rows with `.filter(Boolean)`; current import uses `line.split(/---+/)` and relies on stable column positions.
- Keep legacy redeem failure behavior: `redeemFailureCount` applies only when the legacy stored channel matches the requested channel.

## File Structure

- Move: `background/redeem/redeem-channel-state.js` -> `shared/redeem-channel-state.js`
  - Pure UPI/IDEAL channel normalization, field names, failure counts, daily-limit blocking, lock patches, and caller-provided eligibility policy.
- Keep and extend: `background/redeem/redeem-cdkey-usage.js`
  - CDK state aliases, pool parsing, usage normalization, selectable CDK filtering, usage updates.
- Create: `shared/membership-credential-format.js`
  - Parse and format Free TXT lines for 2FA, Passkey, and no-2FA rows while preserving current field names.
- Create: `background/redeem/upi-redeem-api-client.js`
  - POST JSON wrappers for redeem and eligibility APIs; no orchestration.
- Create: `background/membership/results-store.js`
  - Membership result storage get/save and deletion-state merge.
- Create: `background/membership/access-token-login.js`
  - Access-token expiry, masking, and login-material helpers.
- Create: `sidepanel/membership-view-model.js`
  - Pure Free/UPI Plus/IDEAL Plus grouping and counts.
- Create: `sidepanel/membership-renderer.js`
  - HTML rendering only; action handlers remain in `account-records-manager.js` for one commit.
- Create: `sidepanel/settings-state-manager.js`
  - Collect/apply settings state by delegating existing `sidepanel.js` helpers.
- Create: `sidepanel/workflow-controls-manager.js`
  - Start/continue/stop/reset/render workflow controls by delegating existing `sidepanel.js` helpers.

## Baseline Verification After Every Task

Run the task-specific commands plus:

```powershell
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-trial-eligibility-api.cjs
node --test scripts/test-passkey-login-core.cjs
```

Expected: all commands pass. `audit-smoke-tests.mjs` warnings are acceptable only when the script exits with code 0.

---

### Task 1: Move And Extend Redeem Channel State

**Files:**
- Move: `background/redeem/redeem-channel-state.js` -> `shared/redeem-channel-state.js`
- Modify: `background.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`
- Create: `scripts/test-redeem-channel-state.cjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/test-redeem-channel-state.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageRedeemChannelState;
const policy = require('../shared/redeem-channel-state.js');

test('legacy failure count applies only when legacy channel matches', () => {
  assert.equal(policy.getRedeemChannelFailureCount({ redeemChannel: 'ideal', redeemFailureCount: 2 }, 'ideal'), 2);
  assert.equal(policy.getRedeemChannelFailureCount({ redeemChannel: 'ideal', redeemFailureCount: 2 }, 'upi'), 0);
});

test('UPI failures do not block an otherwise eligible UPI account', () => {
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'eligible', upiRedeemFailureCount: 9 }, 'upi'), true);
});

test('trial eligibility and channel eligibility are preserved', () => {
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'unknown' }, 'upi'), false);
  assert.equal(policy.shouldRedeemItemUseChannel(
    { trialEligibilityStatus: 'eligible' },
    'ideal',
    { isTrialEligibilityChannelAllowed: () => false }
  ), false);
});

test('IDEAL is locked after three IDEAL failures', () => {
  assert.equal(policy.isRedeemAccountLocked({ idealRedeemFailureCount: 3 }), true);
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'eligible', idealRedeemFailureCount: 3 }, 'ideal'), false);
});

test('daily-limit blocking supports explicit until and legacy reason fields', () => {
  const nowMs = Date.parse('2026-07-06T00:00:00.000Z');
  assert.equal(policy.isRedeemChannelDailyLimitBlocked({
    upiRedeemDailyLimitBlockedUntil: '2026-07-06T01:00:00.000Z',
  }, 'upi', { nowMs }), true);
  assert.equal(policy.isRedeemChannelDailyLimitBlocked({
    redeemChannel: 'ideal',
    redeemReason: '该邮箱在该渠道今日提交次数已达上限 3 次 请 24 小时后再试',
    redeemLastFailedAt: '2026-07-05T23:00:00.000Z',
  }, 'ideal', { nowMs }), true);
});
```

- [ ] **Step 2: Confirm the test fails**

Run:

```powershell
node --test scripts/test-redeem-channel-state.cjs
```

Expected: FAIL because `../shared/redeem-channel-state.js` does not exist.

- [ ] **Step 3: Move the module**

Run:

```powershell
git mv background/redeem/redeem-channel-state.js shared/redeem-channel-state.js
```

- [ ] **Step 4: Extend the moved module**

In `shared/redeem-channel-state.js`, keep the existing IIFE style, add CommonJS export support, and expose these functions:

```javascript
const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;

function normalizeRetryCount(value = 0) {
  const count = Math.floor(Number(value) || 0);
  return count > 0 ? count : 0;
}

function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
  const normalizedChannel = normalizeRedeemChannel(channel);
  const field = getRedeemChannelFailureField(normalizedChannel);
  if (Object.prototype.hasOwnProperty.call(item || {}, field)) {
    return normalizeRetryCount(item?.[field]);
  }
  const legacyChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
    ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
    : '';
  return legacyChannel === normalizedChannel ? normalizeRetryCount(item?.redeemFailureCount) : 0;
}

function isRedeemChannelDailyLimitBlocked(item = {}, channel = 'upi', options = {}) {
  const normalizedChannel = normalizeRedeemChannel(channel);
  const nowMs = Math.max(1, Math.floor(Number(options.nowMs) || Date.now()));
  const blockedUntil = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]));
  if (Number.isFinite(blockedUntil) && blockedUntil > nowMs) return true;
  const blockedAt = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]));
  const storedReason = item?.[getRedeemChannelDailyLimitReasonField(normalizedChannel)];
  if (
    Number.isFinite(blockedAt)
    && blockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs
    && isRedeemChannelDailyLimitReason(storedReason || item?.redeemReason || item?.reason)
  ) {
    return true;
  }
  const itemChannel = normalizeRedeemChannel(item?.redeemChannel || item?.channel || item?.paymentChannel);
  if (itemChannel !== normalizedChannel) return false;
  const legacyReason = item?.redeemReason || item?.reason || item?.remoteMessage;
  if (!isRedeemChannelDailyLimitReason(legacyReason)) return false;
  const legacyBlockedAt = Date.parse(normalizeString(item?.redeemLastFailedAt || item?.redeemAttemptedAt || item?.checkedAt || item?.updatedAt));
  return !Number.isFinite(legacyBlockedAt) || legacyBlockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs;
}

function isRedeemAccountLocked(item = {}) {
  return item?.redeemLocked === true
    || getRedeemChannelFailureCount(item, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT;
}

function shouldRedeemItemUseChannel(item = {}, channel = 'upi', options = {}) {
  const normalizedChannel = normalizeRedeemChannel(channel);
  if (isRedeemAccountLocked(item)) return false;
  if (isRedeemChannelDailyLimitBlocked(item, normalizedChannel, options)) return false;
  if (options.requireTrialEligibility !== false && normalizeString(item?.trialEligibilityStatus).toLowerCase() !== 'eligible') return false;
  if (
    typeof options.isTrialEligibilityChannelAllowed === 'function'
    && !options.isTrialEligibilityChannelAllowed(item, normalizedChannel)
  ) {
    return false;
  }
  if (normalizedChannel === 'upi') return true;
  return getRedeemChannelFailureCount(item, normalizedChannel) < REDEEM_CHANNEL_FAILURE_LIMIT;
}
```

Add these names to the returned API:

```javascript
REDEEM_CHANNEL_FAILURE_LIMIT,
REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS,
normalizeRetryCount,
getRedeemChannelFailureCount,
isRedeemChannelDailyLimitBlocked,
isRedeemAccountLocked,
shouldRedeemItemUseChannel,
```

Add CommonJS export support:

```javascript
(function attachRedeemChannelState(root, factory) {
  const api = factory();
  root.MultiPageRedeemChannelState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemChannelState() {
```

- [ ] **Step 5: Update load order**

In `background.js`, replace:

```javascript
'background/redeem/redeem-channel-state.js',
```

with:

```javascript
'shared/redeem-channel-state.js',
```

In `sidepanel/sidepanel.html`, insert before `cdk-pool-manager.js`:

```html
  <script src="../shared/redeem-channel-state.js"></script>
```

- [ ] **Step 6: Update audit contracts**

In `scripts/audit-smoke-tests.mjs`, update references from `background/redeem/redeem-channel-state.js` to `shared/redeem-channel-state.js`, and add:

```javascript
assertIncludes(background, "'shared/redeem-channel-state.js'", 'background redeem channel state script load');
assertIncludes(sidepanelHtml, 'src="../shared/redeem-channel-state.js"', 'sidepanel redeem channel state script load');
assertIncludes(redeemChannelState, 'getRedeemChannelFailureCount', 'redeem channel failure count helper');
assertIncludes(redeemChannelState, 'shouldRedeemItemUseChannel', 'redeem channel use policy helper');
assertFileLineCountAtMost('shared/redeem-channel-state.js', 700, 'redeem channel state size guard');
```

- [ ] **Step 7: Verify and commit**

Run:

```powershell
node --test scripts/test-redeem-channel-state.cjs
node --check shared/redeem-channel-state.js
node --check background.js
node scripts/audit-smoke-tests.mjs
git add shared/redeem-channel-state.js scripts/test-redeem-channel-state.cjs background.js sidepanel/sidepanel.html scripts/audit-smoke-tests.mjs
git add -u background/redeem/redeem-channel-state.js
git commit -m "refactor: share redeem channel state"
```

Expected: the commit contains one moved channel-state module, not two implementations.

---

### Task 2: Delegate Redeem Channel Consumers

**Files:**
- Modify: `background/steps/upi-redeem.js`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `background/message-router.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/cdk-pool-manager.js`

- [ ] **Step 1: Preserve contextual eligibility in background wrappers**

In `background/steps/upi-redeem.js` and `background/upi-credential-membership-checker.js`, replace `shouldRedeemItemUseChannel` with:

```javascript
function shouldRedeemItemUseChannel(item = {}, channel = 'upi') {
  const helper = getRedeemChannelStateHelpers().shouldRedeemItemUseChannel;
  if (typeof helper === 'function') {
    return helper(item, channel, {
      nowMs: now(),
      isTrialEligibilityChannelAllowed,
    });
  }
  if (isRedeemAccountLocked(item)) return false;
  if (isRedeemChannelDailyLimitBlocked(item, channel)) return false;
  if (normalizeString(item?.trialEligibilityStatus).toLowerCase() !== 'eligible') return false;
  if (!isTrialEligibilityChannelAllowed(item, channel)) return false;
  if (normalizeRedeemChannel(channel) === 'upi') return true;
  return getRedeemChannelFailureCount(item, channel) < REDEEM_CHANNEL_FAILURE_LIMIT;
}
```

- [ ] **Step 2: Delegate repeated field/count/daily-limit helpers**

In `background/steps/upi-redeem.js`, `background/upi-credential-membership-checker.js`, and `background/message-router.js`, keep local function names but delegate these bodies to `getRedeemChannelStateHelpers()`:

```text
normalizeRedeemChannel
getRedeemChannelFailureField
getRedeemChannelFailureCount
getRedeemChannelDailyLimitBlockedAtField
getRedeemChannelDailyLimitBlockedUntilField
getRedeemChannelDailyLimitReasonField
isRedeemChannelDailyLimitReason
isRedeemCrossRegionPaymentUnavailableReason
isRedeemChannelDailyLimitBlocked
isRedeemAccountLocked
```

Each fallback body must remain byte-for-byte equivalent to the current behavior until the task is committed.

- [ ] **Step 3: Add sidepanel helper lookup**

Near the top of `createAccountRecordsManager` in `sidepanel/account-records-manager.js`, add:

```javascript
function getRedeemChannelStateHelpers() {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  return rootScope.MultiPageRedeemChannelState || {};
}
```

Delegate `normalizeRedeemChannel`, failure field/count helpers, daily-limit helpers, and lock helpers through this lookup while keeping their names.

- [ ] **Step 4: Delegate `sidepanel/cdk-pool-manager.js` normalizer**

Keep its local `normalizeRedeemChannel` name:

```javascript
function normalizeRedeemChannel(value = '') {
  const helper = globalScope.MultiPageRedeemChannelState?.normalizeRedeemChannel;
  if (typeof helper === 'function') return helper(value);
  return normalizeText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --test scripts/test-redeem-channel-state.cjs
node --check background/steps/upi-redeem.js
node --check background/upi-credential-membership-checker.js
node --check background/message-router.js
node --check sidepanel/account-records-manager.js
node --check sidepanel/cdk-pool-manager.js
node scripts/audit-smoke-tests.mjs
git add background/steps/upi-redeem.js background/upi-credential-membership-checker.js background/message-router.js sidepanel/account-records-manager.js sidepanel/cdk-pool-manager.js
git commit -m "refactor: delegate redeem channel helpers"
```

---

### Task 3: Add Shared Membership Credential Format

**Files:**
- Create: `shared/membership-credential-format.js`
- Create: `scripts/test-membership-credential-format.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Write failing parser/formatter tests**

Create `scripts/test-membership-credential-format.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const format = require('../shared/membership-credential-format.js');

test('parses full 2FA Free row with URL and access token', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---pw---SECRET---https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt', nowMs: Date.parse('2026-07-06T07:00:00.000Z') }
  );
  assert.equal(row.email, 'a@icloud.com');
  assert.equal(row.password, 'pw');
  assert.equal(row.gptPassword, 'pw');
  assert.equal(row.totpMfaSecret, 'SECRET');
  assert.equal(row.verificationUrl, 'https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5');
  assert.equal(row.accessToken, 'at-token');
  assert.equal(row.accessTokenUpdatedAt, '2026-07-06 15:00:00');
  assert.equal(row.checkedAt, '2026-07-06 15:00:00');
  assert.equal(row.twoFactorEnabled, true);
  assert.equal(row.source, 'txt');
});

test('parses no-2FA Free row without shifting columns', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt' }
  );
  assert.equal(row.password, '');
  assert.equal(row.gptPassword, '');
  assert.equal(row.totpMfaSecret, '');
  assert.equal(row.no2faFreeRoute, true);
  assert.equal(row.twoFactorEnabled, false);
  assert.equal(row.accessToken, 'at-token');
});

test('parses Passkey marker with semicolon metadata', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---pw---PASSKEY:cred-1;signCount=7;alg=-7---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt' }
  );
  assert.equal(row.passkeyEnabled, true);
  assert.equal(row.passkeyCredentialId, 'cred-1');
  assert.equal(row.passkeySignCount, 7);
  assert.equal(row.passkeyAlg, -7);
  assert.equal(row.totpMfaSecret, '');
  assert.equal(row.twoFactorEnabled, true);
});

test('formats current Free export row shapes', () => {
  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    no2faFreeRoute: true,
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00');
});
```

- [ ] **Step 2: Create `shared/membership-credential-format.js`**

The module must attach `MultiPageMembershipCredentialFormat`, support CommonJS exports, and expose:

```javascript
normalizeText,
normalizeEmail,
normalizeTotpSecret,
isLikelyVerificationUrl,
isLikelyTimestamp,
normalizeVerificationUrlForExport,
normalizeRecordedAt,
isPasskeyMarker,
parsePasskeyMarker,
buildPasskeyMarker,
parseCredentialParts,
parseCredentialLine,
formatFreeCredentialLine,
```

Use these exact compatibility rules:

```javascript
function parseCredentialLine(line = '', options = {}) {
  return parseCredentialParts(String(line || '').trim().split(/---+/).map((part) => part.trim()), options);
}

function isPasskeyMarker(value = '') {
  return /^PASSKEY(?::|$)/i.test(normalizeText(value));
}

function parsePasskeyMarker(value = '') {
  const marker = normalizeText(value);
  if (!isPasskeyMarker(marker)) return { credentialId: '' };
  const [credentialIdPart, ...metadataParts] = marker.replace(/^PASSKEY:?/i, '').trim().split(';');
  const metadata = {};
  for (const part of metadataParts) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = normalizeText(part.slice(0, separatorIndex)).toLowerCase();
    const rawValue = normalizeText(part.slice(separatorIndex + 1));
    if (!rawValue) continue;
    if (key === 'signcount' || key === 'sign_count') metadata.signCount = rawValue;
    if (key === 'alg') metadata.alg = rawValue;
  }
  return {
    credentialId: normalizeText(credentialIdPart),
    ...buildPasskeyNumericMetadataPatch(metadata),
  };
}
```

`parseCredentialParts(parts, options)` must return the same field names currently produced by both existing parsers:

```text
email
password
gptPassword
totpMfaSecret
verificationUrl
accessToken
accessTokenUpdatedAt
checkedAt
recordedAt
no2faFreeRoute
twoFactorEnabled
passkeyEnabled
passkeyCredentialId
passkeySignCount
passkeyAlg
source
```

- [ ] **Step 3: Load and audit the shared format**

In `sidepanel/sidepanel.html`, insert before `account-records-manager.js`:

```html
  <script src="../shared/membership-credential-format.js"></script>
```

In `scripts/audit-smoke-tests.mjs`, add the file to `checkCoreFiles()` and add:

```javascript
const membershipCredentialFormat = readText('shared/membership-credential-format.js');
assertIncludes(sidepanelHtml, 'src="../shared/membership-credential-format.js"', 'sidepanel membership credential format script load');
assertIncludes(membershipCredentialFormat, 'MultiPageMembershipCredentialFormat', 'membership credential format global');
assertIncludes(membershipCredentialFormat, 'formatFreeCredentialLine', 'membership Free export formatter');
assertFileLineCountAtMost('shared/membership-credential-format.js', 900, 'membership credential format size guard');
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-membership-credential-format.cjs
node --check shared/membership-credential-format.js
node scripts/audit-smoke-tests.mjs
git add shared/membership-credential-format.js scripts/test-membership-credential-format.cjs sidepanel/sidepanel.html scripts/audit-smoke-tests.mjs
git commit -m "refactor: share membership credential format"
```

---

### Task 4: Delegate Membership Credential Parsing And Free Export Formatting

**Files:**
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `sidepanel/account-records-manager.js`

- [ ] **Step 1: Delegate background parser**

In `background/upi-credential-membership-checker.js`, add:

```javascript
function getMembershipCredentialFormat() {
  const rootScope = typeof self !== 'undefined' ? self : globalThis;
  return rootScope.MultiPageMembershipCredentialFormat || {};
}
```

Replace `parseCredentialBackupParts(parts = [])` with a delegating wrapper:

```javascript
function parseCredentialBackupParts(parts = []) {
  const helper = getMembershipCredentialFormat().parseCredentialParts;
  if (typeof helper === 'function') {
    return helper(parts, { nowMs: Date.now() });
  }
  return parseCredentialBackupPartsFallback(parts);
}
```

Rename the current body to `parseCredentialBackupPartsFallback(parts = [])` for this commit only.

- [ ] **Step 2: Delegate sidepanel parser**

In `sidepanel/account-records-manager.js`, add:

```javascript
function getMembershipCredentialFormat() {
  const rootScope = typeof window !== 'undefined' ? window : globalThis;
  return rootScope.MultiPageMembershipCredentialFormat || {};
}
```

Replace `parseUpiCredentialMembershipParts(parts = [])` with:

```javascript
function parseUpiCredentialMembershipParts(parts = []) {
  const helper = getMembershipCredentialFormat().parseCredentialParts;
  if (typeof helper === 'function') {
    return helper(parts, { source: 'txt', nowMs: Date.now() });
  }
  return parseUpiCredentialMembershipPartsFallback(parts);
}
```

Rename the current body to `parseUpiCredentialMembershipPartsFallback(parts = [])` for this commit only.

- [ ] **Step 3: Delegate Free export formatter**

In `buildResultExportRows`, replace only the `normalizedStatus === 'free'` formatting branch with:

```javascript
if (normalizedStatus === 'free') {
  const formatFreeCredentialLine = getMembershipCredentialFormat().formatFreeCredentialLine;
  if (typeof formatFreeCredentialLine === 'function') {
    return formatFreeCredentialLine({
      ...item,
      checkedAt: formatNo2faFreeExportTime(getNo2faFreeExportTimestamp(item)),
    });
  }
  return buildResultExportRowsFreeFallback(item);
}
```

Move the old Free branch into `buildResultExportRowsFreeFallback(item = {})` for this commit only.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-membership-credential-format.cjs
node --test scripts/test-passkey-login-core.cjs
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
node scripts/audit-smoke-tests.mjs
git add background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
git commit -m "refactor: delegate membership credential format"
```

---

### Task 5: Extend Existing CDK Usage Helper

**Files:**
- Modify: `background/redeem/redeem-cdkey-usage.js`
- Modify: `background/steps/upi-redeem.js`
- Create: `scripts/test-redeem-cdkey-usage.cjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/test-redeem-cdkey-usage.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageRedeemChannelState;
delete globalThis.MultiPageRedeemCdkeyUsage;
require('../shared/redeem-channel-state.js');
const usage = require('../background/redeem/redeem-cdkey-usage.js');

test('reads legacy UPI CDK pool aliases', () => {
  assert.equal(usage.getRedeemChannelPoolText({ cdkPoolText: 'A\nB' }, 'upi'), 'A\nB');
});

test('filters unavailable CDKs from pool text', () => {
  assert.deepEqual(usage.getAvailableCdkeys('A\nB\nC', {
    A: { enabled: false },
    B: { usedAt: '2026-07-06T00:00:00.000Z' },
    C: { remoteStatus: 'failed' },
  }), ['C']);
  assert.deepEqual(usage.getAvailableCdkeys('A\nB', {
    A: { remoteStatus: 'pending' },
    B: { usedAt: '2026-07-06T00:00:00.000Z', recoverable: true },
  }), ['B']);
});
```

- [ ] **Step 2: Extend current module, not a new module**

In `background/redeem/redeem-cdkey-usage.js`, add CommonJS export support and these helpers:

```javascript
function parseCdkeyPoolText(value = '') {
  return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function normalizeCdkeyUsage(rawUsage = {}) {
  return rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage) ? rawUsage : {};
}

function isActiveRemoteStatus(status = '') {
  return /^(submitted|pending|processing|running|审核中)$/i.test(String(status || '').trim());
}

function isSelectableUsageEntry(entry = {}) {
  if (!entry || typeof entry !== 'object') return true;
  if (entry.enabled === false) return false;
  if (entry.usedAt && !entry.recoverable) return false;
  if (isActiveRemoteStatus(entry.remoteStatus)) return false;
  return true;
}

function getAvailableCdkeys(poolText = '', usage = {}) {
  const normalizedUsage = normalizeCdkeyUsage(usage);
  return parseCdkeyPoolText(poolText).filter((cdkey) => isSelectableUsageEntry(normalizedUsage[cdkey]));
}
```

Add all five helper names to the returned API.

- [ ] **Step 3: Delegate CDK selection in `background/steps/upi-redeem.js`**

Add this wrapper:

```javascript
function getAvailableCdkeysForChannel(state = {}, channel = 'upi') {
  const helper = getRedeemCdkeyUsageHelpers().getAvailableCdkeys;
  const poolText = getRedeemChannelPoolText(state, channel);
  const usage = getRedeemChannelUsage(state, channel);
  if (typeof helper === 'function') return helper(poolText, usage);
  return String(poolText || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
```

Use it where the file currently reads pool text and filters usage inline.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-redeem-cdkey-usage.cjs
node --check background/redeem/redeem-cdkey-usage.js
node --check background/steps/upi-redeem.js
node scripts/audit-smoke-tests.mjs
git add background/redeem/redeem-cdkey-usage.js background/steps/upi-redeem.js scripts/test-redeem-cdkey-usage.cjs
git commit -m "refactor: extend redeem CDK usage helper"
```

---

### Task 6: Split UPI Redeem API Client

**Files:**
- Create: `background/redeem/upi-redeem-api-client.js`
- Modify: `background.js`
- Modify: `background/steps/upi-redeem.js`
- Create: `scripts/test-upi-redeem-api-client.cjs`

- [ ] **Step 1: Write API client tests**

Create `scripts/test-upi-redeem-api-client.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const api = require('../background/redeem/upi-redeem-api-client.js');

test('redeemCdkey posts JSON with auth headers', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
    },
  });
  const payload = await client.redeemCdkey({
    apiUrl: 'https://example.test/redeem',
    externalApiKey: 'key',
    clientId: 'client',
    cdkey: 'CDK',
    session: 'session',
    accessToken: 'at',
    channel: 'ideal',
  });
  assert.deepEqual(payload, { ok: true });
  assert.equal(requests[0].options.headers.authorization, 'Bearer key');
  assert.equal(JSON.parse(requests[0].options.body).channel, 'ideal');
});

test('postJson throws payload error on non-OK response', async () => {
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async () => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'bad cdk' }) }),
  });
  await assert.rejects(() => client.postJson({ url: 'https://example.test', body: {} }), /bad cdk/);
});
```

- [ ] **Step 2: Create the client module**

Create `background/redeem/upi-redeem-api-client.js` exposing:

```javascript
createUpiRedeemApiClient
```

The factory must return:

```javascript
postJson
redeemCdkey
checkEligibility
```

The `redeemCdkey` request body must be:

```javascript
{ cdkey, session, accessToken, channel }
```

The headers must include:

```javascript
authorization: `Bearer ${externalApiKey}`,
'x-client-id': clientId,
'content-type': 'application/json'
```

- [ ] **Step 3: Load and wire**

In `background.js`, add after `background/redeem/redeem-cdkey-usage.js`:

```javascript
'background/redeem/upi-redeem-api-client.js',
```

In `background/steps/upi-redeem.js`, instantiate:

```javascript
const upiRedeemApiClient = self.MultiPageUpiRedeemApiClient?.createUpiRedeemApiClient?.({ fetchImpl }) || null;
```

Replace `postUPIJson` and `postEligibilityCheckJson` bodies with calls to the client while keeping their old names as wrappers.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-upi-redeem-api-client.cjs
node --check background/redeem/upi-redeem-api-client.js
node --check background/steps/upi-redeem.js
node --check background.js
node scripts/audit-smoke-tests.mjs
git add background/redeem/upi-redeem-api-client.js background/steps/upi-redeem.js background.js scripts/test-upi-redeem-api-client.cjs
git commit -m "refactor: split UPI redeem API client"
```

---

### Task 7: Split Membership Results Store

**Files:**
- Create: `background/membership/results-store.js`
- Modify: `background.js`
- Modify: `background/upi-credential-membership-checker.js`
- Create: `scripts/test-membership-results-store.cjs`

- [ ] **Step 1: Create store test**

Create `scripts/test-membership-results-store.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const moduleApi = require('../background/membership/results-store.js');

test('saveResults normalizes, merges deletion state, persists, and broadcasts', async () => {
  const stored = {
    upiCredentialMembershipCheckResults: {
      items: [{ email: 'old@example.com' }],
      redeemPlusDeletedEmailsByChannel: { ideal: ['gone@example.com'] },
    },
  };
  const writes = [];
  const broadcasts = [];
  const store = moduleApi.createMembershipResultsStore({
    chromeApi: { storage: { local: { get: async () => stored, set: async (patch) => writes.push(patch) } } },
    storageKey: 'upiCredentialMembershipCheckResults',
    normalizeResultsPayload: (value) => ({
      items: Array.isArray(value?.items) ? value.items : [],
      redeemPlusDeletedEmailsByChannel: value?.redeemPlusDeletedEmailsByChannel || {},
    }),
    mergeRedeemDeletionStateForSave: (previous) => ({
      redeemPlusDeletedEmailsByChannel: previous.redeemPlusDeletedEmailsByChannel,
    }),
    broadcastDataUpdate: (patch) => broadcasts.push(patch),
  });
  const saved = await store.saveResults({ items: [{ email: 'new@example.com' }] });
  assert.equal(saved.items[0].email, 'new@example.com');
  assert.deepEqual(saved.redeemPlusDeletedEmailsByChannel, { ideal: ['gone@example.com'] });
  assert.equal(writes.length, 1);
  assert.equal(broadcasts.length, 1);
});
```

- [ ] **Step 2: Create `background/membership/results-store.js`**

Expose `MultiPageMembershipResultsStore.createMembershipResultsStore(deps)` with:

```javascript
async function getStoredResults() {
  const stored = await chromeApi.storage.local.get([storageKey]).catch(() => ({}));
  return normalizeResultsPayload(stored?.[storageKey]);
}

async function saveResults(results = {}) {
  const stored = await chromeApi.storage.local.get([storageKey]).catch(() => ({}));
  const previousPayload = normalizeResultsPayload(stored?.[storageKey]);
  const payload = normalizeResultsPayload({
    ...results,
    ...mergeRedeemDeletionStateForSave(previousPayload, results),
  });
  await chromeApi.storage.local.set({ [storageKey]: payload });
  if (typeof setState === 'function') await setState({ [storageKey]: payload }).catch(() => {});
  broadcastDataUpdate({ [storageKey]: payload });
  return payload;
}
```

- [ ] **Step 3: Load and wire**

In `background.js`, add before `background/upi-credential-membership-checker.js`:

```javascript
'background/membership/results-store.js',
```

Inside `createUpiCredentialMembershipChecker`, instantiate the store and replace local result get/save storage calls.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-membership-results-store.cjs
node --check background/membership/results-store.js
node --check background/upi-credential-membership-checker.js
node --check background.js
node scripts/audit-smoke-tests.mjs
git add background/membership/results-store.js background/upi-credential-membership-checker.js background.js scripts/test-membership-results-store.cjs
git commit -m "refactor: split membership results store"
```

---

### Task 8: Split Sidepanel Membership View Model

**Files:**
- Create: `sidepanel/membership-view-model.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Create: `scripts/test-membership-view-model.cjs`

- [ ] **Step 1: Create view-model tests**

Create `scripts/test-membership-view-model.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const vm = require('../sidepanel/membership-view-model.js');

test('groups paid rows by redeem channel and keeps free rows separate', () => {
  assert.equal(vm.getGroup({ status: 'paid', redeemChannel: 'ideal' }), 'ideal-plus');
  assert.equal(vm.getGroup({ status: 'paid', redeemChannel: 'upi' }), 'upi-plus');
  assert.equal(vm.getGroup({ status: 'free', redeemChannel: 'ideal' }), 'free');
});

test('buildRows normalizes email and summarize counts groups', () => {
  const rows = vm.buildRows({ items: [
    { email: 'A@icloud.com', status: 'free', accessToken: 'at' },
    { email: 'B@icloud.com', status: 'paid', redeemChannel: 'ideal' },
  ] });
  assert.deepEqual(rows.map((row) => row.email), ['a@icloud.com', 'b@icloud.com']);
  assert.deepEqual(vm.summarize(rows), { total: 2, withAt: 1, free: 1, 'upi-plus': 0, 'ideal-plus': 1 });
});
```

- [ ] **Step 2: Create `sidepanel/membership-view-model.js`**

Expose:

```javascript
buildRows
summarize
getGroup
```

with CommonJS export support for Node tests and `window.SidepanelMembershipViewModel` for the sidepanel.

- [ ] **Step 3: Load and delegate**

In `sidepanel/sidepanel.html`, insert before `account-records-manager.js`:

```html
  <script src="membership-view-model.js"></script>
```

In `sidepanel/account-records-manager.js`, keep old display-row function names and delegate pure grouping/counting to:

```javascript
const membershipViewModel = globalScope.SidepanelMembershipViewModel;
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --test scripts/test-membership-view-model.cjs
node --check sidepanel/membership-view-model.js
node --check sidepanel/account-records-manager.js
node scripts/audit-smoke-tests.mjs
git add sidepanel/membership-view-model.js sidepanel/account-records-manager.js sidepanel/sidepanel.html scripts/test-membership-view-model.cjs
git commit -m "refactor: split membership view model"
```

---

### Task 9: Split Sidepanel Workflow Managers Without Duplicating Settings Transfer

**Files:**
- Create: `sidepanel/settings-state-manager.js`
- Create: `sidepanel/workflow-controls-manager.js`
- Modify: `sidepanel/sidepanel.js`
- Modify: `sidepanel/sidepanel.html`

- [ ] **Step 1: Create `sidepanel/settings-state-manager.js`**

```javascript
(function attachSettingsStateManager(root) {
  function createSettingsStateManager(context = {}) {
    const { helpers = {} } = context;
    return {
      collectSettingsPayload: () => helpers.collectSettingsPayload(),
      applySettingsToForm: (settings = {}) => helpers.applySettingsToForm(settings),
    };
  }
  root.SidepanelSettingsStateManager = { createSettingsStateManager };
})(window);
```

- [ ] **Step 2: Create `sidepanel/workflow-controls-manager.js`**

```javascript
(function attachWorkflowControlsManager(root) {
  function createWorkflowControlsManager(context = {}) {
    const { helpers = {} } = context;
    return {
      startAutoRun: (...args) => helpers.startAutoRun(...args),
      continueAutoRun: (...args) => helpers.continueAutoRun(...args),
      stopCurrentOperation: (...args) => helpers.stopCurrentOperation(...args),
      resetState: (...args) => helpers.resetState(...args),
      renderStepsList: (...args) => helpers.renderStepsList(...args),
      renderStepStatuses: (...args) => helpers.renderStepStatuses(...args),
    };
  }
  root.SidepanelWorkflowControlsManager = { createWorkflowControlsManager };
})(window);
```

- [ ] **Step 3: Load managers**

In `sidepanel/sidepanel.html`, insert after `settings-transfer-manager.js`:

```html
  <script src="settings-state-manager.js"></script>
  <script src="workflow-controls-manager.js"></script>
```

- [ ] **Step 4: Wire managers**

In `sidepanel/sidepanel.js`, instantiate both managers near the existing `settingsTransferManager`. Keep `SidepanelSettingsTransferManager` as the only import/export manager.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/settings-state-manager.js
node --check sidepanel/workflow-controls-manager.js
node --check sidepanel/sidepanel.js
node scripts/audit-smoke-tests.mjs
git add sidepanel/settings-state-manager.js sidepanel/workflow-controls-manager.js sidepanel/sidepanel.js sidepanel/sidepanel.html
git commit -m "refactor: split sidepanel workflow managers"
```

---

### Task 10: Split Background State Registries

**Files:**
- Create: `background/persistent-settings.js`
- Create: `background/custom-email-pool-state.js`
- Create: `background/registration-account-state.js`
- Modify: `background.js`

- [ ] **Step 1: Create `background/persistent-settings.js`**

```javascript
(function attachPersistentSettings(root) {
  function createPersistentSettingsModule(defaults = {}) {
    const keys = Object.keys(defaults);
    function pickPersistedSettings(source = {}) {
      return Object.fromEntries(keys.map((key) => [key, source[key] ?? defaults[key]]));
    }
    return { defaults, keys, pickPersistedSettings };
  }
  root.MultiPagePersistentSettings = { createPersistentSettingsModule };
})(self);
```

- [ ] **Step 2: Create state wrapper modules**

Create `background/custom-email-pool-state.js`:

```javascript
(function attachCustomEmailPoolState(root) {
  function createCustomEmailPoolState(deps = {}) {
    return {
      getCustomEmailPoolEntries: deps.getCustomEmailPoolEntries,
      markCustomEmailPoolEntryTrialEligibility: deps.markCustomEmailPoolEntryTrialEligibility,
      markCurrentCustomEmailPoolEntryUsed: deps.markCurrentCustomEmailPoolEntryUsed,
      markCurrentCustomEmailPoolEntryTrialIneligible: deps.markCurrentCustomEmailPoolEntryTrialIneligible,
    };
  }
  root.MultiPageCustomEmailPoolState = { createCustomEmailPoolState };
})(self);
```

Create `background/registration-account-state.js`:

```javascript
(function attachRegistrationAccountState(root) {
  function createRegistrationAccountState(deps = {}) {
    return {
      markCurrentRegistrationAccountUsed: deps.markCurrentRegistrationAccountUsed,
      markCurrentRegistrationAccountTrialIneligible: deps.markCurrentRegistrationAccountTrialIneligible,
      recordStep7AccountCheckpoint: deps.recordStep7AccountCheckpoint,
    };
  }
  root.MultiPageRegistrationAccountState = { createRegistrationAccountState };
})(self);
```

- [ ] **Step 3: Load and delegate**

In `background.js`, load after `background/registration-email-state.js`:

```javascript
'background/persistent-settings.js',
'background/custom-email-pool-state.js',
'background/registration-account-state.js',
```

Instantiate each module with current local functions as dependencies, then replace callers one group at a time.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --check background/persistent-settings.js
node --check background/custom-email-pool-state.js
node --check background/registration-account-state.js
node --check background.js
node scripts/audit-smoke-tests.mjs
git add background/persistent-settings.js background/custom-email-pool-state.js background/registration-account-state.js background.js
git commit -m "refactor: split background state registries"
```

---

### Task 11: Thin Message Router Into Route Handlers

**Files:**
- Create: `background/routes/membership-routes.js`
- Create: `background/routes/cdkey-routes.js`
- Create: `background/routes/workflow-routes.js`
- Modify: `background/message-router.js`
- Modify: `background.js`

- [ ] **Step 1: Create route factories**

Create `background/routes/membership-routes.js`:

```javascript
(function attachMembershipRoutes(root) {
  function createMembershipRoutes(deps = {}) {
    return {
      async CHECK_UPI_CREDENTIAL_MEMBERSHIP(payload) {
        return deps.checkUpiCredentialMembershipBatch(payload);
      },
      async CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY(payload) {
        return deps.checkUpiCredentialMembershipTrialEligibility(payload);
      },
      async FILL_UPI_CREDENTIAL_MEMBERSHIP_FREE_ACCESS_TOKENS(payload) {
        return deps.fillUpiCredentialMembershipFreeAccessTokens(payload);
      },
    };
  }
  root.MultiPageMembershipRoutes = { createMembershipRoutes };
})(self);
```

Create `background/routes/cdkey-routes.js`:

```javascript
(function attachCdkeyRoutes(root) {
  function createCdkeyRoutes(deps = {}) {
    return {
      async REFRESH_UPI_REDEEM_CDKEY_STATUSES(payload) {
        return deps.refreshPendingUpiCredentialMembershipRedeemStatuses(payload);
      },
      async CANCEL_UPI_REDEEM_CDKEY_JOBS(payload) {
        return deps.cancelPendingUpiCredentialMembershipRedeemJobs(payload);
      },
      async RETRY_UPI_REDEEM_CDKEY_JOBS(payload) {
        return deps.retryFailedUpiRedeemCdkeyJobs(payload);
      },
    };
  }
  root.MultiPageCdkeyRoutes = { createCdkeyRoutes };
})(self);
```

Create `background/routes/workflow-routes.js`:

```javascript
(function attachWorkflowRoutes(root) {
  function createWorkflowRoutes(deps = {}) {
    return {
      async START_AUTO_RUN(payload) {
        return deps.startAutoRun(payload);
      },
      async STOP_CURRENT_OPERATION(payload) {
        return deps.stopCurrentOperation(payload);
      },
      async EXECUTE_NODE(payload) {
        return deps.executeNode(payload);
      },
      async RESET_STATE(payload) {
        return deps.resetState(payload);
      },
    };
  }
  root.MultiPageWorkflowRoutes = { createWorkflowRoutes };
})(self);
```

- [ ] **Step 2: Load and dispatch route table**

In `background.js`, load route files before `background/message-router.js`.

In `background/message-router.js`, build:

```javascript
const routeHandlers = {
  ...self.MultiPageMembershipRoutes.createMembershipRoutes(deps),
  ...self.MultiPageCdkeyRoutes.createCdkeyRoutes(deps),
  ...self.MultiPageWorkflowRoutes.createWorkflowRoutes(deps),
};
```

At the top of `handleMessage`:

```javascript
if (routeHandlers[type]) {
  return routeHandlers[type](payload, rawMessage, sender);
}
```

Remove old switch cases only after each route path passes audit.

- [ ] **Step 3: Verify and commit**

Run:

```powershell
node --check background/routes/membership-routes.js
node --check background/routes/cdkey-routes.js
node --check background/routes/workflow-routes.js
node --check background/message-router.js
node --check background.js
node scripts/audit-smoke-tests.mjs
git add background/routes/membership-routes.js background/routes/cdkey-routes.js background/routes/workflow-routes.js background/message-router.js background.js
git commit -m "refactor: split background message routes"
```

---

### Task 12: Split Remaining Auth Content Page By Page Type

**Files:**
- Create: `content/signup-password-page.js`
- Create: `content/signup-profile-page.js`
- Create: `content/signup-session-page.js`
- Modify: `content/signup-page.js`
- Modify: `manifest.json`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Create page modules**

Create `content/signup-password-page.js`:

```javascript
(function attachSignupPasswordPage(root) {
  function createSignupPasswordPage(deps = {}) {
    return {
      setPassword: deps.setPassword,
      detectPasswordPage: deps.detectPasswordPage,
    };
  }
  root.MultiPageSignupPasswordPage = { createSignupPasswordPage };
})(self);
```

Create `content/signup-profile-page.js`:

```javascript
(function attachSignupProfilePage(root) {
  function createSignupProfilePage(deps = {}) {
    return {
      detectProfilePage: deps.detectProfilePage,
      fillProfileNameAndBirthday: deps.fillProfileNameAndBirthday,
      submitProfilePage: deps.submitProfilePage,
    };
  }
  root.MultiPageSignupProfilePage = { createSignupProfilePage };
})(self);
```

Create `content/signup-session-page.js`:

```javascript
(function attachSignupSessionPage(root) {
  function createSignupSessionPage(deps = {}) {
    return {
      readChatGptSession: deps.readChatGptSession,
      extractAccessToken: deps.extractAccessToken,
      detectLoggedInHome: deps.detectLoggedInHome,
    };
  }
  root.MultiPageSignupSessionPage = { createSignupSessionPage };
})(self);
```

- [ ] **Step 2: Update manifest order**

In `manifest.json`, load new scripts after existing signup helpers and before `content/signup-page.js`:

```json
"content/signup-dom-utils.js",
"content/signup-entry-page.js",
"content/signup-verification-page.js",
"content/signup-password-page.js",
"content/signup-profile-page.js",
"content/signup-session-page.js",
"content/signup-page.js"
```

- [ ] **Step 3: Move real helper bodies**

Move password/profile/session helper bodies from `content/signup-page.js` into their modules. Keep compatibility wrappers in `content/signup-page.js` for this commit.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --check content/signup-password-page.js
node --check content/signup-profile-page.js
node --check content/signup-session-page.js
node --check content/signup-page.js
node scripts/audit-smoke-tests.mjs
git add content/signup-password-page.js content/signup-profile-page.js content/signup-session-page.js content/signup-page.js manifest.json scripts/audit-smoke-tests.mjs
git commit -m "refactor: split signup page handlers"
```

---

## Recommended Execution Order

1. Task 1: move and extend redeem channel state.
2. Task 2: delegate redeem channel consumers.
3. Task 3: add shared membership credential format.
4. Task 4: delegate membership credential parsing and Free export formatting.
5. Task 5: extend existing CDK usage helper.
6. Task 6: split UPI redeem API client.
7. Task 7: split membership results store.
8. Task 8: split sidepanel membership view model.
9. Task 9: split sidepanel workflow managers.
10. Task 10: split background state registries.
11. Task 11: split background message routes.
12. Task 12: split remaining signup page handlers.

Do not start with a wholesale `background.js` split. Start with pure helpers and parser/formatter tests because those protect Free import/export, Passkey, no-2FA Free, UPI/IDEAL channel selection, and CDK auto-redeem behavior.

## Final Verification

Run:

```powershell
node scripts/module-size-report.mjs
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-trial-eligibility-api.cjs
node --test scripts/test-passkey-login-core.cjs
node --test scripts/test-redeem-channel-state.cjs
node --test scripts/test-membership-credential-format.cjs
node --test scripts/test-redeem-cdkey-usage.cjs
node --test scripts/test-upi-redeem-api-client.cjs
node --test scripts/test-membership-results-store.cjs
node --test scripts/test-membership-view-model.cjs
$failed=@()
git ls-files '*.js' '*.mjs' | ForEach-Object {
  node --check $_
  if ($LASTEXITCODE -ne 0) { $failed += $_ }
}
if ($failed.Count) {
  Write-Error ('FAILED: ' + ($failed -join ', '))
  exit 1
}
Write-Output 'All tracked JS/MJS files passed node --check.'
```

Manual smoke:

- Main flow through steps 1-7 with full 2FA route.
- Main flow through Passkey route.
- Main flow through no-2FA Free route.
- Custom email pool row `检查资格` with saved AT.
- Free export/import for full 2FA, Passkey, and no-2FA formats.
- UPI one-click redeem, IDEAL one-click redeem, and all redeem.
- Remote CDK status refresh after failure.
- Delete UPI Plus and IDEAL Plus and confirm deleted Plus rows do not return after refresh.
- Fingerprint browser config export produces a `.json` filename through the current download service.

## Self-Review

- Spec coverage: The plan covers all current hotspots and preserves existing behavior gates for registration, custom email pool, Free/Plus, UPI/IDEAL redeem, Passkey, export, and fingerprint-browser download behavior.
- Placeholder scan: No task creates duplicate modules for existing responsibilities. Every new module has a concrete API, exact load location, exact verification command, and commit message.
- Type consistency: Shared/background globals use `MultiPage*`; sidepanel globals use `Sidepanel*`; CommonJS export fallbacks are added only to modules tested directly by Node.

Plan complete and saved to `docs/superpowers/plans/2026-07-06-current-code-splitting-plan.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.
