# Trial Eligibility API Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align local trial-eligibility handling with the backend `POST /api/v1/check` contract so Free entry is gated by coupon eligibility, while UPI/IDEAL channel availability controls only the redeem candidates.

**Architecture:** Add one focused shared adapter for `/api/v1/check` responses, then wire background step 7, stored result rows, and sidepanel candidate filters to the same decision model. Keep Free membership eligibility separate from UPI/IDEAL channel eligibility to avoid dropping accounts that are coupon-eligible but only redeemable through IDEAL or temporarily not redeemable through UPI.

Network instability is modeled as a retryable check state, not as account ineligibility. Users get explicit single-row and batch manual check controls so they can retry `/api/v1/check` after a proxy/backend fluctuation without re-running the whole registration flow.

**Tech Stack:** MV3 extension service worker, plain JavaScript globals/CommonJS-compatible helper, Node built-in test runner, existing `node --check` syntax checks.

---

## Backend Contract Summary

The backend `/api/v1/check` response fields from the API page are:

- `token_ok: boolean` means the ChatGPT access token is valid.
- `eligible: boolean` means the account has coupon/trial eligibility.
- `reason: string` is one of `eligible`, `not-eligible`, `token-401`, `jwt-expired`, `empty-token`, `fetch-error`, `http-error`, `unknown-coupon-state`.
- `upi_eligible: boolean` means the account can submit through UPI.
- `upi_eligible_reason: string|null` explains UPI denial, e.g. `account-not-phone`, `email-not-whitelisted`, `feature-disabled`.
- `ideal_eligible: boolean` means the account can submit through IDEAL.
- `ideal_eligible_reason: string|null` explains IDEAL denial.
- `reg_type`, `phone_number`, `phone_verified`, `coupon_state`, `email`, `account_id`, `plan_type`, `jwt_expired`, `jwt_exp_in_sec` are metadata.

Important local policy:

- Free entry should require `token_ok === true` and `eligible === true`.
- `upi_eligible === false` must not block Free entry; it should only block UPI candidate selection.
- `ideal_eligible === false` must not block Free entry; it should only block IDEAL candidate selection.
- Missing required backend booleans must be treated as an incomplete/failed check, not as "no trial eligibility".
- `fetch-error`, `http-error`, `unknown-coupon-state`, request timeout, HTTP 429, and HTTP 5xx are network/backend fluctuation states. They must be saved as retryable check failures, not as "无试用资格".
- Retryable failures should preserve the account/email, show a clear retry reason, and expose manual check buttons.
- Only `token_ok === true && eligible === false` or equivalent explicit `reason=not-eligible` should mark the source mailbox as no trial eligibility.

## File Structure

- Create: `shared/trial-eligibility-api.js`
  - Single responsibility: normalize `/api/v1/check` payloads into a strict local decision.
  - Exports globals on `self.MultiPageTrialEligibilityApi` and `module.exports` for Node tests.
- Create: `scripts/test-trial-eligibility-api.cjs`
  - Unit tests for strict decision behavior and channel metadata.
- Modify: `background.js`
  - Load `shared/trial-eligibility-api.js` before `background/steps/upi-redeem.js` and `background/upi-credential-membership-checker.js`.
- Modify: `sidepanel/sidepanel.html`
  - Load `shared/trial-eligibility-api.js` before `sidepanel/account-records-manager.js`.
- Modify: `background/steps/upi-redeem.js`
  - Replace local ad-hoc eligibility failure logic with the shared adapter.
  - Step 7 writes Free only when coupon eligibility is true.
  - Step 7 stores UPI/IDEAL channel eligibility fields on the result item.
- Modify: `background/upi-credential-membership-checker.js`
  - Preserve channel eligibility fields in `normalizeResultItem()` and `upsertTrialEligibleFreeCredential()`.
  - Filter auto-continuation and background redeem candidates by channel eligibility.
  - Provide a manual trial-eligibility check method that can reuse existing AT or login to refresh AT.
- Modify: `background/message-router.js`
  - Route single-row and batch manual eligibility check messages to the checker.
- Modify: `sidepanel/account-records-manager.js`
  - Filter UPI/IDEAL button counts by channel eligibility.
  - Update Free row reason/skip reason so "eligible but UPI unavailable" is visible.
  - Allow manual trial-eligibility check for rows with AT, Passkey, no-2FA route, or password-only login fallback.
  - Add row-level and batch manual trial-eligibility check controls.

---

### Task 1: Add Strict Backend API Adapter

**Files:**
- Create: `shared/trial-eligibility-api.js`
- Create: `scripts/test-trial-eligibility-api.cjs`

- [ ] **Step 1: Create failing tests for backend response decisions**

Create `scripts/test-trial-eligibility-api.cjs`:

```javascript
const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeTrialEligibilityApiItem,
  isTrialEligibilityAccountIneligibleDecision,
  isTrialEligibilityTokenInvalidDecision,
  isTrialEligibilityEligibleDecision,
  isTrialEligibilityChannelAllowed,
} = require('../shared/trial-eligibility-api.js');

test('eligible coupon enters Free even when UPI channel is denied', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: true,
    reason: 'eligible',
    upi_eligible: false,
    upi_eligible_reason: 'account-not-phone',
    ideal_eligible: true,
    ideal_eligible_reason: null,
    reg_type: 'email',
    email: 'a@example.com',
  });

  assert.equal(isTrialEligibilityEligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'eligible');
  assert.equal(decision.upiChannelEligibilityStatus, 'ineligible');
  assert.equal(decision.upiChannelEligibilityReason, 'account-not-phone');
  assert.equal(decision.idealChannelEligibilityStatus, 'eligible');
  assert.equal(isTrialEligibilityChannelAllowed(decision, 'upi'), false);
  assert.equal(isTrialEligibilityChannelAllowed(decision, 'ideal'), true);
});

test('eligible coupon enters Free even when both channels are denied', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: true,
    reason: 'eligible',
    upi_eligible: false,
    upi_eligible_reason: 'feature-disabled',
    ideal_eligible: false,
    ideal_eligible_reason: 'email-not-whitelisted',
  });

  assert.equal(isTrialEligibilityEligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'eligible');
  assert.equal(decision.upiChannelEligibilityStatus, 'ineligible');
  assert.equal(decision.idealChannelEligibilityStatus, 'ineligible');
});

test('not eligible coupon is account ineligible and should not enter Free', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: false,
    reason: 'not-eligible',
    message: '账号没有试用资格',
  });

  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'ineligible');
  assert.match(decision.trialEligibilityReason, /账号没有试用资格|not-eligible/);
});

test('token invalid is not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: false,
    reason: 'jwt-expired',
    message: 'JWT 已过期',
  });

  assert.equal(isTrialEligibilityTokenInvalidDecision(decision), true);
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityStatus, 'failed');
});

test('missing eligible field is incomplete check, not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'eligible',
    upi_eligible: true,
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.match(decision.trialEligibilityReason, /缺少 eligible/);
});

test('missing token_ok field is incomplete check, not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    eligible: true,
    reason: 'eligible',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.match(decision.trialEligibilityReason, /缺少 token_ok/);
});

test('unknown coupon state without explicit eligible false is failed check', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'unknown-coupon-state',
    message: 'OpenAI 优惠状态未知',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityRetryable, true);
  assert.equal(decision.trialEligibilityTransientFailure, true);
});

test('fetch-error is retryable network fluctuation and not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'fetch-error',
    message: '后端请求 OpenAI 失败',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityRetryable, true);
  assert.equal(decision.trialEligibilityTransientFailure, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node --test scripts/test-trial-eligibility-api.cjs
```

Expected: FAIL because `shared/trial-eligibility-api.js` does not exist.

- [ ] **Step 3: Implement the shared adapter**

Create `shared/trial-eligibility-api.js`:

```javascript
(function attachTrialEligibilityApi(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageTrialEligibilityApi = api;
})(typeof self !== 'undefined' ? self : globalThis, function createTrialEligibilityApi() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    const normalized = normalizeString(value).toLowerCase();
    return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(normalized);
  }

  function readOwnBoolean(source = {}, keys = []) {
    for (const key of keys) {
      if (hasOwn(source, key)) {
        return {
          present: true,
          value: normalizeBoolean(source[key]),
          raw: source[key],
          key,
        };
      }
    }
    return {
      present: false,
      value: false,
      raw: undefined,
      key: '',
    };
  }

  function pickMessage(source = {}, fallback = '') {
    return normalizeString(
      source.message
      || source.error
      || source.reason
      || fallback
    );
  }

  function isTransientFailureReason(reason = '') {
    return /^(?:fetch-error|http-error|unknown-coupon-state)$/i.test(normalizeString(reason));
  }

  function normalizeChannelStatus(source = {}, channel = 'upi') {
    const normalizedChannel = normalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    const keys = normalizedChannel === 'ideal'
      ? ['ideal_eligible', 'idealEligible']
      : ['upi_eligible', 'upiEligible'];
    const reasonKeys = normalizedChannel === 'ideal'
      ? ['ideal_eligible_reason', 'idealEligibleReason']
      : ['upi_eligible_reason', 'upiEligibleReason'];
    const field = readOwnBoolean(source, keys);
    let reason = '';
    for (const key of reasonKeys) {
      if (hasOwn(source, key)) {
        reason = normalizeString(source[key]);
        break;
      }
    }
    if (!field.present) {
      return {
        status: 'unknown',
        reason,
      };
    }
    return {
      status: field.value ? 'eligible' : 'ineligible',
      reason: field.value ? '' : (reason || `${normalizedChannel.toUpperCase()} 渠道不可用`),
    };
  }

  function normalizeTrialEligibilityApiItem(item = {}) {
    const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    const reasonCode = normalizeString(source.reason).toLowerCase();
    const tokenOk = readOwnBoolean(source, ['token_ok', 'tokenOk']);
    const eligible = readOwnBoolean(source, ['eligible']);
    const upi = normalizeChannelStatus(source, 'upi');
    const ideal = normalizeChannelStatus(source, 'ideal');
    const base = {
      trialEligibilityStatus: 'failed',
      trialEligibilityReason: '',
      trialEligibilityReasonCode: reasonCode,
      trialEligibilityCheckedByApi: true,
      trialEligibilityTransientFailure: isTransientFailureReason(reasonCode),
      trialEligibilityRetryable: false,
      couponState: normalizeString(source.coupon_state || source.couponState),
      registrationType: normalizeString(source.reg_type || source.regType),
      phoneNumber: normalizeString(source.phone_number || source.phoneNumber),
      phoneVerified: readOwnBoolean(source, ['phone_verified', 'phoneVerified']).value,
      accountId: normalizeString(source.account_id || source.accountId),
      planType: normalizeString(source.plan_type || source.planType),
      responseEmail: normalizeString(source.email).toLowerCase(),
      jwtExpired: readOwnBoolean(source, ['jwt_expired', 'jwtExpired']).value,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(source.jwt_exp_in_sec || source.jwtExpInSec) || 0)),
      upiChannelEligibilityStatus: upi.status,
      upiChannelEligibilityReason: upi.reason,
      idealChannelEligibilityStatus: ideal.status,
      idealChannelEligibilityReason: ideal.reason,
    };

    if (!tokenOk.present) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickMessage(source, '资格检查接口返回不完整：缺少 token_ok。'),
        trialEligibilityRetryable: true,
      };
    }
    if (!tokenOk.value) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickMessage(source, 'ChatGPT accessToken 无效或已过期。'),
        tokenInvalid: true,
      };
    }
    if (!eligible.present) {
      return {
        ...base,
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: pickMessage(source, '资格检查接口返回不完整：缺少 eligible。'),
        trialEligibilityRetryable: true,
      };
    }
    if (!eligible.value) {
      return {
        ...base,
        trialEligibilityStatus: 'ineligible',
        trialEligibilityReason: pickMessage(source, '账号无试用资格。'),
      };
    }
    return {
      ...base,
      trialEligibilityStatus: 'eligible',
      trialEligibilityReason: pickMessage(source, '账号有试用资格。'),
    };
  }

  function isTrialEligibilityEligibleDecision(decision = {}) {
    return normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'eligible';
  }

  function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
    return normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'ineligible';
  }

  function isTrialEligibilityTokenInvalidDecision(decision = {}) {
    return decision.tokenInvalid === true;
  }

  function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
    const normalizedChannel = normalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    const field = normalizedChannel === 'ideal'
      ? 'idealChannelEligibilityStatus'
      : 'upiChannelEligibilityStatus';
    const status = normalizeString(item[field]).toLowerCase();
    return !status || status === 'unknown' || status === 'eligible';
  }

  function buildTrialEligibilityResultPatch(decision = {}) {
    return {
      trialEligibilityStatus: normalizeString(decision.trialEligibilityStatus),
      trialEligibilityReason: normalizeString(decision.trialEligibilityReason),
      trialEligibilityReasonCode: normalizeString(decision.trialEligibilityReasonCode),
      trialEligibilityCheckedByApi: decision.trialEligibilityCheckedByApi === true,
      trialEligibilityTransientFailure: decision.trialEligibilityTransientFailure === true,
      trialEligibilityRetryable: decision.trialEligibilityRetryable === true,
      couponState: normalizeString(decision.couponState),
      registrationType: normalizeString(decision.registrationType),
      phoneNumber: normalizeString(decision.phoneNumber),
      phoneVerified: decision.phoneVerified === true,
      accountId: normalizeString(decision.accountId),
      responseEmail: normalizeString(decision.responseEmail).toLowerCase(),
      jwtExpired: decision.jwtExpired === true,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(decision.jwtExpiresInSeconds) || 0)),
      upiChannelEligibilityStatus: normalizeString(decision.upiChannelEligibilityStatus),
      upiChannelEligibilityReason: normalizeString(decision.upiChannelEligibilityReason),
      idealChannelEligibilityStatus: normalizeString(decision.idealChannelEligibilityStatus),
      idealChannelEligibilityReason: normalizeString(decision.idealChannelEligibilityReason),
    };
  }

  return {
    normalizeTrialEligibilityApiItem,
    isTrialEligibilityEligibleDecision,
    isTrialEligibilityAccountIneligibleDecision,
    isTrialEligibilityTokenInvalidDecision,
    isTrialEligibilityChannelAllowed,
    buildTrialEligibilityResultPatch,
  };
});
```

- [ ] **Step 4: Run tests and syntax checks**

Run:

```powershell
node --test scripts/test-trial-eligibility-api.cjs
node --check shared/trial-eligibility-api.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add shared/trial-eligibility-api.js scripts/test-trial-eligibility-api.cjs
git commit -m "test: add trial eligibility api adapter"
```

---

### Task 2: Load Adapter in Background and Sidepanel

**Files:**
- Modify: `background.js:3-45`
- Modify: `sidepanel/sidepanel.html:1401-1425`

- [ ] **Step 1: Load shared adapter in the service worker**

In `background.js`, add the shared script before `background/steps/upi-redeem.js`:

```javascript
  'background/passkey-login-core.js',
  'background/passkey-api-login-executor.js',
  'shared/trial-eligibility-api.js',
  'background/generated-email-helpers.js',
```

- [ ] **Step 2: Load shared adapter in the sidepanel**

In `sidepanel/sidepanel.html`, add the shared script before `account-records-manager.js`:

```html
  <script src="../shared/flow-capabilities.js"></script>
  <script src="../shared/trial-eligibility-api.js"></script>
  <script src="../data/step-definitions.js"></script>
```

- [ ] **Step 3: Run syntax checks**

```powershell
node --check background.js
node --check shared/trial-eligibility-api.js
```

Expected: no syntax errors.

- [ ] **Step 4: Commit**

```powershell
git add background.js sidepanel/sidepanel.html
git commit -m "chore: load trial eligibility adapter"
```

---

### Task 3: Align Step 7 Eligibility Decisions with Backend Contract

**Files:**
- Modify: `background/steps/upi-redeem.js:1806-1878`
- Modify: `background/steps/upi-redeem.js:2456-2471`
- Modify: `background/steps/upi-redeem.js:3128-3282`

- [ ] **Step 1: Replace ad-hoc failure helpers with adapter calls**

In `background/steps/upi-redeem.js`, add local accessors near the existing helper functions:

```javascript
    function getTrialEligibilityApiHelpers() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageTrialEligibilityApi || {};
    }

    function normalizeTrialEligibilityApiItem(item = {}) {
      const helper = getTrialEligibilityApiHelpers().normalizeTrialEligibilityApiItem;
      if (typeof helper === 'function') {
        return helper(item);
      }
      return {
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: '资格检查适配器未加载。',
      };
    }

    function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityAccountIneligibleDecision;
      return typeof helper === 'function'
        ? helper(decision)
        : normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'ineligible';
    }

    function isTrialEligibilityTokenInvalidDecision(decision = {}) {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityTokenInvalidDecision;
      return typeof helper === 'function' ? helper(decision) : decision.tokenInvalid === true;
    }

    function buildTrialEligibilityResultPatch(decision = {}) {
      const helper = getTrialEligibilityApiHelpers().buildTrialEligibilityResultPatch;
      return typeof helper === 'function' ? helper(decision) : {};
    }
```

Replace `getEligibilityFailureMessage()` and `isEligibilityAccountIneligibleItem()` with wrappers that preserve existing call sites:

```javascript
    function getEligibilityFailureMessage(item) {
      const decision = normalizeTrialEligibilityApiItem(item);
      return decision.trialEligibilityStatus === 'eligible'
        ? ''
        : normalizeString(decision.trialEligibilityReason || 'UPI 资格检查失败。');
    }

    function isEligibilityTokenInvalidItem(item = {}) {
      return isTrialEligibilityTokenInvalidDecision(normalizeTrialEligibilityApiItem(item));
    }

    function isEligibilityAccountIneligibleItem(item = {}) {
      return isTrialEligibilityAccountIneligibleDecision(normalizeTrialEligibilityApiItem(item));
    }
```

- [ ] **Step 2: Return both raw item and normalized decision from the check function**

Change `checkUPIAccessTokenEligibility()`:

```javascript
    async function checkUPIAccessTokenEligibility({ checkUrl, externalApiKey, clientId, cdkey, session, accessToken }) {
      const payload = await postEligibilityCheckJson({
        apiUrl: checkUrl,
        token: accessToken || getChatGptSessionAccessToken(session),
      });
      const item = getEligibilityItem(payload, cdkey);
      const decision = normalizeTrialEligibilityApiItem(item);
      const failureMessage = getEligibilityFailureMessage(item);
      if (failureMessage) {
        const accountIneligible = isTrialEligibilityAccountIneligibleDecision(decision);
        const tokenInvalid = isTrialEligibilityTokenInvalidDecision(decision);
        const prefix = accountIneligible
          ? UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX
          : (tokenInvalid ? UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX : '');
        const error = new Error(`${prefix}UPI 资格检查失败：${failureMessage}`);
        error.trialEligibilityDecision = decision;
        throw error;
      }
      return {
        ...item,
        trialEligibilityDecision: decision,
      };
    }
```

- [ ] **Step 3: Store channel fields when Step 7 writes Free**

In `checkRegistrationUpiTrialEligibility()`, after a successful check:

```javascript
        const eligibilityDecision = eligibility?.item?.trialEligibilityDecision
          || normalizeTrialEligibilityApiItem(eligibility?.item || {});
        const eligibilityPatch = buildTrialEligibilityResultPatch(eligibilityDecision);
        const reason = normalizeString(eligibilityPatch.trialEligibilityReason)
          || normalizeString(eligibility?.item?.message || eligibility?.item?.reason)
          || '账号有试用资格，已进入 Free 分组';
```

Pass the patch to `upsertTrialEligibleFreeCredential()`:

```javascript
          reason,
          checkedAt,
          ...eligibilityPatch,
          trialEligibilityStatus: 'eligible',
          trialEligibilityReason: reason,
          trialEligibilityCheckedAt: checkedAt,
```

Keep `trialEligibilityStatus: 'eligible'` because this branch only runs after the adapter says the coupon is eligible.

- [ ] **Step 4: Use decision on failed checks**

In the catch block of `checkRegistrationUpiTrialEligibility()`, use the decision if it exists:

```javascript
        const decision = error?.trialEligibilityDecision || null;
        const message = normalizeString(decision?.trialEligibilityReason) || getErrorMessage(error) || 'UPI 试用资格检测失败。';
        const failedAt = toIsoTimestamp();
        const trialEligibilityStatus = isTrialEligibilityAccountIneligibleDecision(decision || {})
          || isUpiAccountIneligibleError(error)
          ? 'ineligible'
          : 'failed';
```

This keeps incomplete responses and token failures out of the "无试用资格" path.

- [ ] **Step 5: Run syntax checks**

```powershell
node --check background/steps/upi-redeem.js
node --test scripts/test-trial-eligibility-api.cjs
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add background/steps/upi-redeem.js
git commit -m "fix: align trial eligibility decisions with backend api"
```

---

### Task 4: Persist Channel Eligibility Fields on Result Rows

**Files:**
- Modify: `background/upi-credential-membership-checker.js:1199-1284`
- Modify: `background/upi-credential-membership-checker.js:2276-2511`
- Modify: `sidepanel/account-records-manager.js`

- [ ] **Step 1: Preserve new fields in background result normalization**

In `normalizeResultItem()`, add these fields after `trialEligibilityCheckedAt`:

```javascript
      trialEligibilityReasonCode: normalizeString(item.trialEligibilityReasonCode),
      trialEligibilityCheckedByApi: item.trialEligibilityCheckedByApi === true,
      trialEligibilityTransientFailure: item.trialEligibilityTransientFailure === true,
      trialEligibilityRetryable: item.trialEligibilityRetryable === true,
      trialEligibilityRetryCount: Math.max(0, Math.floor(Number(item.trialEligibilityRetryCount) || 0)),
      trialEligibilityLastError: normalizeString(item.trialEligibilityLastError),
      couponState: normalizeString(item.couponState || item.coupon_state),
      registrationType: normalizeString(item.registrationType || item.reg_type),
      phoneNumber: normalizeString(item.phoneNumber || item.phone_number),
      phoneVerified: item.phoneVerified === true,
      accountId: normalizeString(item.accountId || item.account_id),
      responseEmail: normalizeEmail(item.responseEmail || item.emailFromApi || item.apiEmail),
      jwtExpired: item.jwtExpired === true,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(item.jwtExpiresInSeconds || item.jwt_exp_in_sec) || 0)),
      upiChannelEligibilityStatus: normalizeString(item.upiChannelEligibilityStatus || item.upiEligibilityStatus),
      upiChannelEligibilityReason: normalizeString(item.upiChannelEligibilityReason || item.upi_eligible_reason || item.upiEligibleReason),
      idealChannelEligibilityStatus: normalizeString(item.idealChannelEligibilityStatus || item.idealEligibilityStatus),
      idealChannelEligibilityReason: normalizeString(item.idealChannelEligibilityReason || item.ideal_eligible_reason || item.idealEligibleReason),
```

- [ ] **Step 2: Preserve fields in `upsertTrialEligibleFreeCredential()`**

Before `nextItems`, compute:

```javascript
      const trialEligibilityReasonCode = normalizeString(input.trialEligibilityReasonCode || credential.trialEligibilityReasonCode || existingItem.trialEligibilityReasonCode);
      const trialEligibilityTransientFailure = input.trialEligibilityTransientFailure === true || credential.trialEligibilityTransientFailure === true;
      const trialEligibilityRetryable = input.trialEligibilityRetryable === true || credential.trialEligibilityRetryable === true || trialEligibilityTransientFailure;
      const trialEligibilityRetryCount = Math.max(0, Math.floor(Number(input.trialEligibilityRetryCount || credential.trialEligibilityRetryCount || existingItem.trialEligibilityRetryCount) || 0));
      const trialEligibilityLastError = normalizeString(input.trialEligibilityLastError || credential.trialEligibilityLastError || existingItem.trialEligibilityLastError);
      const couponState = normalizeString(input.couponState || credential.couponState || existingItem.couponState);
      const registrationType = normalizeString(input.registrationType || credential.registrationType || existingItem.registrationType);
      const phoneNumber = normalizeString(input.phoneNumber || credential.phoneNumber || existingItem.phoneNumber);
      const phoneVerified = input.phoneVerified === true || credential.phoneVerified === true || existingItem.phoneVerified === true;
      const accountId = normalizeString(input.accountId || credential.accountId || existingItem.accountId);
      const responseEmail = normalizeEmail(input.responseEmail || credential.responseEmail || existingItem.responseEmail);
      const jwtExpired = input.jwtExpired === true || credential.jwtExpired === true || existingItem.jwtExpired === true;
      const jwtExpiresInSeconds = Math.max(0, Math.floor(Number(input.jwtExpiresInSeconds || credential.jwtExpiresInSeconds || existingItem.jwtExpiresInSeconds) || 0));
      const upiChannelEligibilityStatus = normalizeString(input.upiChannelEligibilityStatus || credential.upiChannelEligibilityStatus || existingItem.upiChannelEligibilityStatus);
      const upiChannelEligibilityReason = normalizeString(input.upiChannelEligibilityReason || credential.upiChannelEligibilityReason || existingItem.upiChannelEligibilityReason);
      const idealChannelEligibilityStatus = normalizeString(input.idealChannelEligibilityStatus || credential.idealChannelEligibilityStatus || existingItem.idealChannelEligibilityStatus);
      const idealChannelEligibilityReason = normalizeString(input.idealChannelEligibilityReason || credential.idealChannelEligibilityReason || existingItem.idealChannelEligibilityReason);
```

Add them to the item passed into `upsertResultItem()`:

```javascript
        trialEligibilityReasonCode,
        trialEligibilityCheckedByApi: input.trialEligibilityCheckedByApi === true || credential.trialEligibilityCheckedByApi === true || existingItem.trialEligibilityCheckedByApi === true,
        trialEligibilityTransientFailure,
        trialEligibilityRetryable,
        trialEligibilityRetryCount,
        trialEligibilityLastError,
        couponState,
        registrationType,
        phoneNumber,
        phoneVerified,
        accountId,
        responseEmail,
        jwtExpired,
        jwtExpiresInSeconds,
        upiChannelEligibilityStatus,
        upiChannelEligibilityReason,
        idealChannelEligibilityStatus,
        idealChannelEligibilityReason,
```

- [ ] **Step 3: Preserve fields in sidepanel action credentials**

In `buildUpiCredentialMembershipActionCredential(row = {})`, add:

```javascript
        trialEligibilityReasonCode: normalizeUpiCredentialMembershipText(row.trialEligibilityReasonCode),
        trialEligibilityCheckedByApi: row.trialEligibilityCheckedByApi === true,
        trialEligibilityTransientFailure: row.trialEligibilityTransientFailure === true,
        trialEligibilityRetryable: row.trialEligibilityRetryable === true,
        trialEligibilityRetryCount: Math.max(0, Math.floor(Number(row.trialEligibilityRetryCount) || 0)),
        trialEligibilityLastError: normalizeUpiCredentialMembershipText(row.trialEligibilityLastError),
        couponState: normalizeUpiCredentialMembershipText(row.couponState),
        registrationType: normalizeUpiCredentialMembershipText(row.registrationType),
        phoneNumber: normalizeUpiCredentialMembershipText(row.phoneNumber),
        phoneVerified: row.phoneVerified === true,
        accountId: normalizeUpiCredentialMembershipText(row.accountId),
        responseEmail: normalizeUpiCredentialMembershipEmail(row.responseEmail),
        jwtExpired: row.jwtExpired === true,
        jwtExpiresInSeconds: Math.max(0, Math.floor(Number(row.jwtExpiresInSeconds) || 0)),
        upiChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityStatus),
        upiChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityReason),
        idealChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityStatus),
        idealChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityReason),
```

- [ ] **Step 4: Run syntax checks**

```powershell
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
```

Expected: pass.

- [ ] **Step 5: Commit**

```powershell
git add background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
git commit -m "feat: persist trial channel eligibility fields"
```

---

### Task 5: Filter UPI/IDEAL Candidates by Channel Eligibility

**Files:**
- Modify: `background/steps/upi-redeem.js:253-267`
- Modify: `background/upi-credential-membership-checker.js:2568-2582`
- Modify: `sidepanel/account-records-manager.js:2159-2205`
- Modify: `sidepanel/account-records-manager.js:2260-2296`

- [ ] **Step 1: Add channel eligibility helper in background step file**

In `background/steps/upi-redeem.js`, add:

```javascript
    function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityChannelAllowed;
      if (typeof helper === 'function') {
        return helper(item, channel);
      }
      const normalizedChannel = normalizeRedeemChannel(channel);
      const field = normalizedChannel === 'ideal'
        ? 'idealChannelEligibilityStatus'
        : 'upiChannelEligibilityStatus';
      const status = normalizeString(item?.[field]).toLowerCase();
      return !status || status === 'unknown' || status === 'eligible';
    }
```

Change `shouldRedeemItemUseChannel()`:

```javascript
      if (!isTrialEligibilityChannelAllowed(item, channel)) {
        return false;
      }
```

Place it after the `trialEligibilityStatus === 'ineligible'` check.

- [ ] **Step 2: Add channel filter in background membership checker**

In `background/upi-credential-membership-checker.js`, add a local helper near other redeem helpers:

```javascript
  function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    const helper = rootScope.MultiPageTrialEligibilityApi?.isTrialEligibilityChannelAllowed;
    if (typeof helper === 'function') {
      return helper(item, channel);
    }
    const normalizedChannel = normalizeRedeemChannel(channel);
    const field = normalizedChannel === 'ideal'
      ? 'idealChannelEligibilityStatus'
      : 'upiChannelEligibilityStatus';
    const status = normalizeString(item?.[field]).toLowerCase();
    return !status || status === 'unknown' || status === 'eligible';
  }
```

In `buildAutoContinuationRedeemCandidates()`, filter out channel-denied rows:

```javascript
      const normalizedChannel = normalizeRedeemChannel(channel);
```

Then inside the item filter:

```javascript
      if (!isTrialEligibilityChannelAllowed(item, normalizedChannel)) return false;
```

- [ ] **Step 3: Add sidepanel channel filter**

In `sidepanel/account-records-manager.js`, add:

```javascript
    function isTrialEligibilityChannelAllowed(row = {}, channel = 'upi') {
      const helper = (typeof window !== 'undefined' ? window.MultiPageTrialEligibilityApi : null)?.isTrialEligibilityChannelAllowed;
      if (typeof helper === 'function') {
        return helper(row, channel);
      }
      const redeemChannel = normalizeRedeemChannel(channel);
      const field = redeemChannel === 'ideal'
        ? 'idealChannelEligibilityStatus'
        : 'upiChannelEligibilityStatus';
      const status = normalizeUpiCredentialMembershipText(row[field]).toLowerCase();
      return !status || status === 'unknown' || status === 'eligible';
    }
```

In `isRedeemableFreeUpiCredentialMembershipRowForChannel()`, after the `trialEligibilityStatus === 'ineligible'` check:

```javascript
      if (!isTrialEligibilityChannelAllowed(row, redeemChannel)) {
        return false;
      }
```

- [ ] **Step 4: Improve skip reason**

In the function that returns row skip text around `sidepanel/account-records-manager.js:2260`, add before the generic "当前不可兑换":

```javascript
      if (!isTrialEligibilityChannelAllowed(row, 'upi') && !isTrialEligibilityChannelAllowed(row, 'ideal')) {
        return normalizeUpiCredentialMembershipText(row.upiChannelEligibilityReason || row.idealChannelEligibilityReason)
          || '账号有试用资格，但当前 UPI/IDEAL 渠道均不可兑换';
      }
```

Also add channel-specific reasons if this function is later passed a channel-specific context.

- [ ] **Step 5: Run syntax checks**

```powershell
node --check background/steps/upi-redeem.js
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add background/steps/upi-redeem.js background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
git commit -m "fix: filter redeem candidates by channel eligibility"
```

---

### Task 6: Fix Manual Trial Eligibility Recheck Coverage

**Files:**
- Modify: `sidepanel/account-records-manager.js:2299-2308`
- Modify: `sidepanel/account-records-manager.js:3590-3599`

- [ ] **Step 1: Make checkable row logic route-aware**

Replace `isTrialEligibilityCheckableFreeUpiCredentialMembershipRow(row = {})` with:

```javascript
    function isTrialEligibilityCheckableFreeUpiCredentialMembershipRow(row = {}) {
      const status = String(row.status || '').trim().toLowerCase();
      const trialStatus = normalizeTrialEligibilityStatus(row.trialEligibilityStatus);
      const hasAccessToken = Boolean(normalizeUpiCredentialMembershipText(row.accessToken));
      const hasPassword = Boolean(normalizeUpiCredentialMembershipText(row.password));
      const hasTotp = Boolean(normalizeUpiCredentialMembershipTotpSecret(row.totpMfaSecret));
      const hasPasskey = row.passkeyEnabled === true || Boolean(normalizeUpiCredentialMembershipText(row.passkeyCredentialId));
      const hasEmailUrl = Boolean(normalizeUpiCredentialMembershipText(row.verificationUrl || row.emailVerificationUrl || row.url));
      return row?.email
        && row.enabled !== false
        && status === 'free'
        && trialStatus !== 'eligible'
        && (
          hasAccessToken
          || hasTotp
          || hasPasskey
          || row.no2faFreeRoute === true
          || (hasPassword && hasEmailUrl)
          || hasPassword
        );
    }
```

The last `hasPassword` is intentional because row login now supports password-only fallback and will report the real page challenge.

- [ ] **Step 2: Send complete credential payload for rechecks**

Change `getTrialEligibilityCheckableFreeUpiCredentialMembershipRows()` mapping:

```javascript
        .map((row) => buildUpiCredentialMembershipActionCredential(row))
        .filter((row) => row.email);
```

This preserves Passkey, verification URL, no-2FA route, and AT fields.

- [ ] **Step 3: Run syntax checks**

```powershell
node --check sidepanel/account-records-manager.js
```

Expected: pass.

- [ ] **Step 4: Commit**

```powershell
git add sidepanel/account-records-manager.js
git commit -m "fix: broaden trial eligibility recheck routes"
```

---

### Task 7: Add User-Driven Manual Eligibility Checks

**Files:**
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `background/message-router.js`
- Modify: `sidepanel/account-records-manager.js`

- [ ] **Step 1: Add background single/batch manual check method**

In `background/upi-credential-membership-checker.js`, add a method inside `createUpiCredentialMembershipChecker()`:

```javascript
    async function checkUpiCredentialMembershipTrialEligibility(input = {}) {
      if (batchRunning || redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI 账号核验/兑换正在运行，请等待完成或先停止。');
      }
      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      let items = mergeCredentialsIntoResultItems(
        currentResults.items,
        resolveInputCredentials(input).filter((credential) => credential.email)
      );
      const credentials = resolveInputCredentials(input).filter((credential) => credential.email);
      const runtimeState = {
        ...(await getState()),
        ...(input.settings || {}),
      };
      const eligible = [];
      const ineligible = [];
      const retryable = [];
      const failed = [];
      const skipped = [];

      const saveProgress = async (stage = 'trial-eligibility', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: normalizeString(input.source || 'manual-trial-eligibility-check'),
          total: credentials.length,
          completed: eligible.length + ineligible.length + retryable.length + failed.length + skipped.length,
        });
      };

      try {
        await addLog(`UPI 试用资格手动检查：开始处理 ${credentials.length} 个账号。`, 'info');
        for (const rawCredential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(rawCredential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          let credential = normalizeResultItem({
            ...existingItem,
            ...rawCredential,
            email,
            status: existingItem.status || rawCredential.status || 'free',
            planType: existingItem.planType || rawCredential.planType || 'free',
          });
          const backupCredential = await findBackupCredentialByEmail(email);
          if (backupCredential?.email) {
            credential = normalizeResultItem(mergeCredentialAuthMaterial(credential, backupCredential));
          }
          if (!credential.accessToken && !credential.password) {
            const reason = '缺少 AT 且缺少 GPT 密码，无法检查资格';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...credential,
              reason,
              trialEligibilityRetryable: true,
              trialEligibilityLastError: reason,
            });
            await saveProgress('trial-eligibility', email);
            continue;
          }

          try {
            await saveProgress(credential.accessToken ? 'trial-eligibility' : 'token', email);
            let accessToken = normalizeString(credential.accessToken);
            if (!accessToken) {
              const session = await loginAndReadAccessToken(credential, runtimeState, {
                onStage: async (stage) => saveProgress(stage, email),
                throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
              });
              accessToken = normalizeString(session.accessToken || getChatGptSessionAccessToken(session.session || session));
            }
            const response = await checkUpiRedeemAccessTokenEligibility({
              state: runtimeState,
              accessToken,
            });
            const decision = response?.trialEligibilityDecision
              || normalizeTrialEligibilityApiItem(response || {});
            const patch = buildTrialEligibilityResultPatch(decision);
            const checkedAt = new Date().toISOString();
            if (patch.trialEligibilityStatus === 'eligible') {
              currentResults = await upsertTrialEligibleFreeCredential({
                source: 'manual-trial-eligibility-check',
                email,
                credential,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                checkedAt,
                reason: patch.trialEligibilityReason || '账号有试用资格',
                ...patch,
                trialEligibilityRetryCount: 0,
                trialEligibilityLastError: '',
              });
              items = currentResults.items;
              eligible.push({ email, reason: patch.trialEligibilityReason });
            } else if (patch.trialEligibilityStatus === 'ineligible') {
              if (typeof markRegistrationEmailTrialIneligible === 'function') {
                await markRegistrationEmailTrialIneligible({ email, reason: patch.trialEligibilityReason, checkedAt });
              }
              items = upsertResultItem(items, {
                ...credential,
                ...patch,
                checkedAt,
                reason: patch.trialEligibilityReason || '账号无试用资格',
              });
              ineligible.push({ email, reason: patch.trialEligibilityReason });
            } else {
              const reason = patch.trialEligibilityReason || '资格检查失败，可手动重试';
              retryable.push({ email, reason });
              items = upsertResultItem(items, {
                ...credential,
                ...patch,
                checkedAt,
                reason,
                trialEligibilityStatus: 'failed',
                trialEligibilityRetryable: true,
                trialEligibilityRetryCount: normalizeRetryCount(credential.trialEligibilityRetryCount) + 1,
                trialEligibilityLastError: reason,
              });
            }
            await saveProgress('trial-eligibility', email);
          } catch (error) {
            const reason = getErrorMessage(error) || '资格检查失败，可手动重试';
            const retryableCheck = !isUpiTrialIneligibleError(error);
            (retryableCheck ? retryable : failed).push({ email, reason });
            items = upsertResultItem(items, {
              ...credential,
              status: credential.status || 'free',
              planType: credential.planType || 'free',
              checkedAt: new Date().toISOString(),
              reason,
              trialEligibilityStatus: 'failed',
              trialEligibilityReason: reason,
              trialEligibilityRetryable: retryableCheck,
              trialEligibilityTransientFailure: retryableCheck,
              trialEligibilityRetryCount: normalizeRetryCount(credential.trialEligibilityRetryCount) + 1,
              trialEligibilityLastError: reason,
            });
            await saveProgress('trial-eligibility', email);
          }
        }

        const finishedAt = new Date().toISOString();
        const results = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: normalizeString(input.source || 'manual-trial-eligibility-check'),
          total: credentials.length,
          completed: eligible.length + ineligible.length + retryable.length + failed.length + skipped.length,
        });
        await addLog(
          `UPI 试用资格手动检查完成：有资格 ${eligible.length}，无资格 ${ineligible.length}，可重试 ${retryable.length}，失败 ${failed.length}，跳过 ${skipped.length}。`,
          'ok'
        );
        return { results, eligible, ineligible, retryable, failed, skipped };
      } finally {
        batchRunning = false;
      }
    }
```

Add this method to the object returned by `createUpiCredentialMembershipChecker()`:

```javascript
      checkUpiCredentialMembershipTrialEligibility,
```

- [ ] **Step 2: Add message routes**

In `background/message-router.js`, add routes near other UPI credential membership routes:

```javascript
      case 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY': {
        const checker = getUpiCredentialMembershipChecker();
        return checker.checkUpiCredentialMembershipTrialEligibility({
          ...(message.payload || {}),
          source: message.payload?.source || 'manual-trial-eligibility-check',
        });
      }
      case 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY_BATCH': {
        const checker = getUpiCredentialMembershipChecker();
        return checker.checkUpiCredentialMembershipTrialEligibility({
          ...(message.payload || {}),
          source: message.payload?.source || 'manual-trial-eligibility-batch',
        });
      }
```

- [ ] **Step 3: Add sidepanel candidate helper**

In `sidepanel/account-records-manager.js`, add:

```javascript
    function isManualTrialEligibilityCheckableRow(row = {}) {
      const status = String(row.status || '').trim().toLowerCase();
      const trialStatus = normalizeTrialEligibilityStatus(row.trialEligibilityStatus);
      const hasAccessToken = Boolean(normalizeUpiCredentialMembershipText(row.accessToken));
      const hasPassword = Boolean(normalizeUpiCredentialMembershipText(row.password));
      const isRetryable = row.trialEligibilityRetryable === true
        || trialStatus === 'failed'
        || !trialStatus;
      return row?.email
        && row.enabled !== false
        && status === 'free'
        && trialStatus !== 'eligible'
        && trialStatus !== 'ineligible'
        && isRetryable
        && (hasAccessToken || hasPassword);
    }

    function getManualTrialEligibilityCheckRows() {
      return buildUpiCredentialMembershipDisplayRows(getUpiCredentialMembershipCheckResults())
        .filter(isManualTrialEligibilityCheckableRow)
        .map((row) => buildUpiCredentialMembershipActionCredential(row))
        .filter((row) => row.email);
    }
```

- [ ] **Step 4: Add sidepanel actions**

Add a batch action near existing Free group actions:

```javascript
    async function checkAllUpiCredentialMembershipTrialEligibility() {
      const credentials = getManualTrialEligibilityCheckRows();
      if (!credentials.length) {
        helpers.showToast?.('没有可检查的 Free 账号；需要账号有 AT 或 GPT 密码。', 'warn', 2200);
        return;
      }
      try {
        upiCredentialMembershipCheckBusy = true;
        render();
        const response = await runtime.sendMessage({
          type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY_BATCH',
          source: 'sidepanel',
          payload: {
            credentials,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        helpers.showToast?.(
          `试用资格检查完成：有资格 ${response?.eligible?.length || 0}，无资格 ${response?.ineligible?.length || 0}，可重试 ${response?.retryable?.length || 0}，失败 ${response?.failed?.length || 0}，跳过 ${response?.skipped?.length || 0}。`,
          'success',
          3000
        );
      } catch (error) {
        helpers.showToast?.(`试用资格检查失败：${error.message}`, 'error');
      } finally {
        upiCredentialMembershipCheckBusy = false;
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        render();
      }
    }

    async function checkSingleUpiCredentialMembershipTrialEligibility(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      const credential = buildUpiCredentialMembershipActionCredential(row);
      const response = await runtime.sendMessage({
        type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY',
        source: 'sidepanel',
        payload: {
          credentials: [credential],
          settings: getMembershipCheckSettingsPayload(),
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.results) {
        state.syncLatestState({
          upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
        });
      }
      helpers.showToast?.(
        `${normalizedEmail} 资格检查完成：${response?.eligible?.length ? '有资格' : response?.ineligible?.length ? '无资格' : response?.retryable?.length ? '网络波动，可重试' : '检查失败'}`,
        response?.eligible?.length ? 'success' : 'warn',
        2600
      );
    }
```

Add a Free-group button:

```javascript
      createButton(`检查试用资格(${getManualTrialEligibilityCheckRows().length})`, checkAllUpiCredentialMembershipTrialEligibility)
```

Add a row-level button or menu item:

```javascript
      createButton('检查资格', () => checkSingleUpiCredentialMembershipTrialEligibility(row.email))
```

- [ ] **Step 5: Show retryable network state in rows**

Where row reason text is rendered, prefer `trialEligibilityLastError` when retryable:

```javascript
      const trialStatus = normalizeTrialEligibilityStatus(row.trialEligibilityStatus);
      if (trialStatus === 'failed' && row.trialEligibilityRetryable === true) {
        return normalizeUpiCredentialMembershipText(row.trialEligibilityLastError || row.trialEligibilityReason || row.reason)
          || '资格检查失败，可手动重试';
      }
```

Expected visible text examples:

- `资格检查失败，可手动重试：fetch-error`
- `资格检查失败，可手动重试：http-error`
- `资格检查失败，可手动重试：unknown-coupon-state`

- [ ] **Step 6: Run syntax checks**

```powershell
node --check background/upi-credential-membership-checker.js
node --check background/message-router.js
node --check sidepanel/account-records-manager.js
```

Expected: pass.

- [ ] **Step 7: Commit**

```powershell
git add background/upi-credential-membership-checker.js background/message-router.js sidepanel/account-records-manager.js
git commit -m "feat: add manual trial eligibility checks"
```

---

### Task 8: Verification and Regression Checks

**Files:**
- No new code unless a previous task fails.

- [ ] **Step 1: Run full syntax checks**

```powershell
node --check background.js
node --check shared/trial-eligibility-api.js
node --check background/steps/upi-redeem.js
node --check background/upi-credential-membership-checker.js
node --check background/message-router.js
node --check sidepanel/account-records-manager.js
node --check sidepanel/sidepanel.js
```

Expected: all pass.

- [ ] **Step 2: Run focused tests**

```powershell
node --test scripts/test-trial-eligibility-api.cjs
node --test scripts/test-passkey-login-core.cjs
```

Expected: all tests pass.

- [ ] **Step 3: Run project smoke audits**

```powershell
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
git diff --check
```

Expected:

- `audit-smoke-tests.mjs`: `PASS audit smoke checks completed with 0 warning(s).`
- no syntax or whitespace errors.

- [ ] **Step 4: Manual test matrix**

Use controlled backend responses or a local mocked response path:

1. `token_ok=true, eligible=true, upi_eligible=true, ideal_eligible=true`
   - Expected: account enters Free, UPI candidate yes, IDEAL candidate yes.
2. `token_ok=true, eligible=true, upi_eligible=false, ideal_eligible=true`
   - Expected: account enters Free, UPI candidate no, IDEAL candidate yes.
3. `token_ok=true, eligible=true, upi_eligible=true, ideal_eligible=false`
   - Expected: account enters Free, UPI candidate yes, IDEAL candidate no.
4. `token_ok=true, eligible=true, upi_eligible=false, ideal_eligible=false`
   - Expected: account enters Free, neither redeem button selects it, row reason shows channel unavailable.
5. `token_ok=true, eligible=false, reason=not-eligible`
   - Expected: does not enter Free, source mailbox marked no trial eligibility.
6. `token_ok=false, reason=jwt-expired`
   - Expected: does not mark no trial eligibility; reports AT/login failure.
7. `token_ok=true, reason=eligible` but `eligible` missing
   - Expected: reports incomplete check/failed, does not mark no trial eligibility.
8. Network timeout or backend `reason=fetch-error`
   - Expected: does not enter Free, does not mark no trial eligibility, row/mailbox shows retryable check failure.
9. Backend `reason=http-error` or HTTP 429/5xx
   - Expected: retryable failure state is saved, no email is deleted or marked no trial eligibility.
10. Click single-row `检查资格` after a retryable failure
   - Expected: one account is checked again; eligible result enters Free, not-eligible result marks mailbox no trial eligibility, network failure stays retryable.
11. Click batch `检查试用资格(N)`
   - Expected: only rows with AT or login material are selected; toast shows 有资格/无资格/可重试/失败/跳过 counts.

- [ ] **Step 5: Commit verification docs if needed**

If manual test notes are added:

```powershell
git add docs/superpowers/plans/2026-07-06-trial-eligibility-api-alignment.md
git commit -m "docs: document trial eligibility api alignment plan"
```

If no docs changed, skip this commit.

---

## Self-Review

**Spec coverage:** The plan covers the backend API fields in the screenshot, Free entry gating, UPI/IDEAL channel eligibility, incomplete responses, token failures, network fluctuation retry states, manual single/batch eligibility checks, manual recheck routes, and candidate counts.

**Placeholder scan:** No task uses TBD/TODO/later wording. Each code task includes exact file names and concrete snippets.

**Type consistency:** New result fields use one normalized naming scheme:

- `trialEligibilityStatus`
- `trialEligibilityReason`
- `trialEligibilityReasonCode`
- `trialEligibilityTransientFailure`
- `trialEligibilityRetryable`
- `trialEligibilityRetryCount`
- `trialEligibilityLastError`
- `upiChannelEligibilityStatus`
- `upiChannelEligibilityReason`
- `idealChannelEligibilityStatus`
- `idealChannelEligibilityReason`

Existing code can continue reading old fields; new code writes the normalized fields.
