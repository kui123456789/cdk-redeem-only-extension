# Passkey AT Login Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize Passkey Free accounts so “一键补充 AT” and row “登录” prefer the Nerver Passkey login API used by `C:/Users/Z1803/Downloads/gpt-login-ext`, then fall back to the existing web login when the API cannot complete.

**Architecture:** Add a small pure helper for Passkey login request/response/cookie normalization, then wire it into `background/upi-credential-membership-checker.js` before the current browser login path. Successful API login stores the returned AT immediately and, when cookies/sessionToken are returned, can inject ChatGPT cookies to make the browser login state available. Existing email-code/TOTP browser login remains the fallback.

**Tech Stack:** Chrome MV3 extension, vanilla JavaScript, `chrome.cookies`, `chrome.tabs`, Nerver `/api/v1/passkey/login`, Node `node:test` smoke tests.

---

## Reference Findings

- Reference folder: `C:/Users/Z1803/Downloads/gpt-login-ext`.
- Reference login endpoint: `https://cha.nerver.cc/api/v1/passkey/login`.
- Reference request body is built from:

```javascript
{
  email,
  deviceId,
  credentialId,
  privateJwk,
  rpId,
  userHandle,
  signCount,
  alg
}
```

- Reference response accepts:
  - `accessToken` / `access_token`
  - `cookies` as object map or array
  - `sessionToken` / `session_token`
- Reference cookie behavior:
  - normalize object cookies to `.chatgpt.com`, `/`, `secure: true`, `sameSite: 'lax'`
  - preserve array cookie attributes when returned by backend
  - support sessionToken fallback when no cookies are returned

## Current Project Findings

- Current補 AT entrypoint: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background/upi-credential-membership-checker.js:4819` `fillUpiCredentialMembershipFreeAccessTokens()`.
- Current login implementation: `background/upi-credential-membership-checker.js:3423` `loginAndReadAccessToken()`.
- Current behavior: clear OpenAI cookies, open ChatGPT login page, fill email/password, handle email code or TOTP, then read session/AT from page.
- Existing Passkey registration persists usable fields in `background/steps/enable-passkey.js:856-878`:
  - `passkeyCredentialId`
  - `passkeyFactorId`
  - `passkeyRpId`
  - `passkeyUserHandle`
  - `passkeyPrivateJwk`
  - `passkeyPublicKeyCose`
  - `passkeyApiPersisted`
- Current worktree already has unrelated local `pm-unavailable` classification changes in:
  - `background/message-router.js`
  - `background/redeem/redeem-channel-state.js`
  - `background/steps/upi-redeem.js`
  - `background/upi-credential-membership-checker.js`

---

### Task 0: Protect Existing Local Changes

**Files:**
- Inspect only: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main`

- [ ] **Step 1: Check current worktree**

Run:

```powershell
git status --short
```

Expected before starting this plan:

```text
 M background/message-router.js
 M background/redeem/redeem-channel-state.js
 M background/steps/upi-redeem.js
 M background/upi-credential-membership-checker.js
```

- [ ] **Step 2: Commit or stash the `pm-unavailable` change first**

Recommended commit:

```powershell
git add background/message-router.js background/redeem/redeem-channel-state.js background/steps/upi-redeem.js background/upi-credential-membership-checker.js
git commit -m "fix: lock accounts on pm-unavailable redeem failure"
```

Expected:

```text
[main <hash>] fix: lock accounts on pm-unavailable redeem failure
```

- [ ] **Step 3: Confirm clean start**

Run:

```powershell
git status --short
```

Expected:

```text
```

---

### Task 1: Add Pure Passkey Login Helper

**Files:**
- Create: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background/passkey-login-core.js`
- Create: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/scripts/test-passkey-login-core.cjs`
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background.js:3-63`

- [ ] **Step 1: Create the helper file**

Create `background/passkey-login-core.js`:

```javascript
(function attachPasskeyLoginCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPagePasskeyLoginCore = api;
})(typeof self !== 'undefined' ? self : globalThis, function createPasskeyLoginCore() {
  const DEFAULT_COOKIE_DOMAIN = '.chatgpt.com';
  const DEFAULT_COOKIE_PATH = '/';
  const OPTIONAL_LOGIN_FIELDS = [
    'deviceId',
    'credentialId',
    'privateJwk',
    'rpId',
    'userHandle',
    'signCount',
    'alg',
  ];
  const FAILURE_MESSAGES = Object.freeze({
    'missing-credential': '没有找到该邮箱的 Passkey 凭据',
    'rate-limited': '请求太频繁，请稍后再试',
    'server-error': '服务器错误，请稍后重试',
  });
  const SAME_SITE_VALUES = Object.freeze({
    lax: true,
    strict: true,
    no_restriction: true,
    unspecified: true,
  });

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function hasProvidedValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function ownValue(object, key) {
    return object && hasOwn(object, key) ? object[key] : undefined;
  }

  function defineOwn(object, key, value) {
    Object.defineProperty(object, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }

  function cleanToken(value = '') {
    return String(value || '').trim().replace(/[\r\n]/g, '');
  }

  function isValidEmail(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function normalizeSameSite(value) {
    if (!hasProvidedValue(value)) return 'lax';
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'none') return 'no_restriction';
    if (hasOwn(SAME_SITE_VALUES, normalized)) return normalized;
    return 'lax';
  }

  function normalizeExpirationDate(value) {
    if (value === undefined || value === null || value === '') return null;
    const expirationDate = Number(value);
    if (!Number.isFinite(expirationDate) || expirationDate <= 0) return null;
    return expirationDate;
  }

  function buildPasskeyLoginRequest(email, options = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new Error('请输入正确的邮箱');
    }
    const body = { email: normalizedEmail };
    OPTIONAL_LOGIN_FIELDS.forEach((key) => {
      if (hasOwn(options, key) && hasProvidedValue(options[key])) {
        body[key] = options[key];
      }
    });
    return body;
  }

  function normalizeCookieEntry(cookie, options = {}) {
    if (!cookie || typeof cookie !== 'object' || Array.isArray(cookie)) return null;
    const name = String(ownValue(cookie, 'name') || '').trim();
    const value = ownValue(cookie, 'value');
    if (!name || value === undefined || value === null) return null;

    const isHostCookie = name.startsWith('__Host-');
    const pathValue = ownValue(cookie, 'path');
    const secureValue = ownValue(cookie, 'secure');
    const entry = {
      name,
      value: String(value),
      path: isHostCookie ? DEFAULT_COOKIE_PATH : (hasProvidedValue(pathValue) ? String(pathValue) : DEFAULT_COOKIE_PATH),
      secure: isHostCookie ? true : (secureValue === undefined ? true : Boolean(secureValue)),
      httpOnly: ownValue(cookie, 'httpOnly') === true,
      sameSite: normalizeSameSite(ownValue(cookie, 'sameSite')),
    };

    if (!isHostCookie) {
      const domainValue = ownValue(cookie, 'domain');
      if (hasProvidedValue(domainValue)) {
        defineOwn(entry, 'domain', String(domainValue));
      } else if (options.defaultDomain === true) {
        defineOwn(entry, 'domain', DEFAULT_COOKIE_DOMAIN);
      }
      if (options.preserveHostOnly === true && ownValue(cookie, 'hostOnly') === true) {
        defineOwn(entry, 'hostOnly', true);
      }
    }

    const expirationDate = normalizeExpirationDate(ownValue(cookie, 'expirationDate'));
    if (expirationDate !== null) {
      defineOwn(entry, 'expirationDate', expirationDate);
    }

    return entry;
  }

  function normalizeCookieEntries(cookies) {
    if (!cookies) return [];
    if (Array.isArray(cookies)) {
      return cookies
        .map((cookie) => normalizeCookieEntry(cookie, { defaultDomain: false, preserveHostOnly: true }))
        .filter(Boolean);
    }
    if (typeof cookies === 'object') {
      return Object.keys(cookies)
        .map((name) => {
          const value = cookies[name];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return normalizeCookieEntry({
              name: hasProvidedValue(ownValue(value, 'name')) ? ownValue(value, 'name') : name,
              value: ownValue(value, 'value'),
              domain: ownValue(value, 'domain'),
              path: ownValue(value, 'path'),
              secure: ownValue(value, 'secure'),
              httpOnly: ownValue(value, 'httpOnly'),
              sameSite: ownValue(value, 'sameSite'),
              expirationDate: ownValue(value, 'expirationDate'),
              hostOnly: ownValue(value, 'hostOnly'),
            }, { defaultDomain: true });
          }
          return normalizeCookieEntry({ name, value }, { defaultDomain: true });
        })
        .filter(Boolean);
    }
    return [];
  }

  function getLoginFailureMessage(data = {}) {
    const reason = hasOwn(data, 'reason') ? String(data.reason || '') : '';
    if (hasOwn(FAILURE_MESSAGES, reason)) return FAILURE_MESSAGES[reason];
    if (hasOwn(data, 'message')) return String(data.message || '');
    if (hasOwn(data, 'error')) return String(data.error || '');
    return '登录失败，请稍后重试';
  }

  function normalizePasskeyLoginResponse(response = {}) {
    const data = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
    if (data.ok !== true) {
      throw new Error(getLoginFailureMessage(data));
    }
    const cookieEntries = normalizeCookieEntries(data.cookies);
    const sessionToken = cleanToken(data.sessionToken || data.session_token);
    if (!cookieEntries.length && !sessionToken && !cleanToken(data.accessToken || data.access_token)) {
      throw new Error('后端未返回可导入的 cookies、sessionToken 或 accessToken');
    }
    const result = {
      email: String(data.email || '').trim().toLowerCase(),
      accessToken: cleanToken(data.accessToken || data.access_token),
      cookieEntries,
    };
    if (sessionToken) {
      result.sessionToken = sessionToken;
      result.sessionRaw = JSON.stringify({ sessionToken });
    }
    return result;
  }

  return {
    buildPasskeyLoginRequest,
    normalizePasskeyLoginResponse,
    normalizeCookieEntries,
    getLoginFailureMessage,
  };
});
```

- [ ] **Step 2: Add tests copied from the reference behavior**

Create `scripts/test-passkey-login-core.cjs`:

```javascript
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildPasskeyLoginRequest,
  normalizePasskeyLoginResponse,
  normalizeCookieEntries,
  getLoginFailureMessage,
} = require('../background/passkey-login-core.js');

test('builds passkey login request with allowed optional fields only', () => {
  const privateJwk = { kty: 'EC', crv: 'P-256', x: 'x', y: 'y', d: 'd' };
  assert.deepEqual(buildPasskeyLoginRequest(' USER@example.com ', {
    deviceId: 'device-1',
    credentialId: 'credential-1',
    privateJwk,
    rpId: 'openai.com',
    userHandle: 'handle-1',
    signCount: 0,
    alg: -7,
    ignored: 'value',
  }), {
    email: 'user@example.com',
    deviceId: 'device-1',
    credentialId: 'credential-1',
    privateJwk,
    rpId: 'openai.com',
    userHandle: 'handle-1',
    signCount: 0,
    alg: -7,
  });
});

test('normalizes object cookies and accessToken from login response', () => {
  const response = {
    ok: true,
    email: 'user@example.com',
    accessToken: `eyJ${'a'.repeat(120)}`,
    cookies: {
      '__Secure-next-auth.session-token': `eyJ${'s'.repeat(120)}`,
      '__Host-next-auth.csrf-token': 'csrf-value',
    },
  };
  const result = normalizePasskeyLoginResponse(response);
  assert.equal(result.email, 'user@example.com');
  assert.equal(result.accessToken, response.accessToken);
  assert.equal(result.cookieEntries.length, 2);
  assert.equal(result.cookieEntries[0].domain, '.chatgpt.com');
  assert.equal(result.cookieEntries[0].path, '/');
  assert.equal(result.cookieEntries[0].secure, true);
});

test('normalizes __Host cookies without domain', () => {
  const entries = normalizeCookieEntries([
    {
      name: '__Host-next-auth.csrf-token',
      value: 'csrf-value',
      domain: '.chatgpt.com',
      path: '/wrong',
      secure: false,
      sameSite: 'none',
    },
  ]);
  assert.deepEqual(entries[0], {
    name: '__Host-next-auth.csrf-token',
    value: 'csrf-value',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'no_restriction',
  });
});

test('falls back to sessionToken without cookies', () => {
  const sessionToken = `eyJ${'s'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({
    ok: true,
    email: 'user@example.com',
    sessionToken,
  });
  assert.equal(result.sessionToken, sessionToken);
  assert.equal(result.sessionRaw, JSON.stringify({ sessionToken }));
});

test('allows accessToken-only response for AT supplement', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({
    ok: true,
    email: 'user@example.com',
    accessToken,
  });
  assert.equal(result.accessToken, accessToken);
  assert.deepEqual(result.cookieEntries, []);
});

test('maps backend failure reasons', () => {
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'missing-credential' }), '没有找到该邮箱的 Passkey 凭据');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'rate-limited' }), '请求太频繁，请稍后再试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'server-error' }), '服务器错误，请稍后重试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: '__proto__' }), '登录失败，请稍后重试');
});
```

- [ ] **Step 3: Run the helper tests**

Run:

```powershell
node --test scripts/test-passkey-login-core.cjs
```

Expected:

```text
# pass
```

- [ ] **Step 4: Load helper in the MV3 service worker**

Modify `background.js` importScripts block:

```javascript
  'background/redeem/redeem-cdkey-usage.js',
  'background/passkey-login-core.js',
  'background/generated-email-helpers.js',
```

- [ ] **Step 5: Run syntax checks**

Run:

```powershell
node --check background/passkey-login-core.js
node --check background.js
node --test scripts/test-passkey-login-core.cjs
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```powershell
git add background/passkey-login-core.js background.js scripts/test-passkey-login-core.cjs
git commit -m "feat: add passkey login core helper"
```

---

### Task 2: Add Passkey API Login Executor

**Files:**
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background/upi-credential-membership-checker.js`

- [ ] **Step 1: Add helper accessors near existing Passkey helpers**

Insert after `hasPasskeyCredential()`:

```javascript
  function getPasskeyLoginCore() {
    return (typeof self !== 'undefined' ? self : globalThis).MultiPagePasskeyLoginCore || {};
  }

  function normalizeNerverPasskeyLoginBaseUrl(value = '') {
    let normalized = normalizeString(value || 'https://cha.nerver.cc').replace(/\/+$/g, '');
    try {
      const parsed = new URL(normalized);
      if (!/^https?:$/i.test(parsed.protocol)) {
        throw new Error('Passkey Login API Base URL 只支持 http/https。');
      }
      parsed.pathname = parsed.pathname
        .replace(/\/api\/v1\/passkey\/(?:enable|login)$/i, '')
        .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
        .replace(/\/+$/g, '');
      parsed.search = '';
      parsed.hash = '';
      normalized = parsed.toString().replace(/\/+$/g, '');
    } catch (error) {
      throw new Error(`Passkey Login API Base URL 格式无效：${normalizeString(error?.message || error) || value}`);
    }
    return normalized || 'https://cha.nerver.cc';
  }

  function buildPasskeyLoginApiUrl(state = {}) {
    const baseUrl = normalizeNerverPasskeyLoginBaseUrl(
      state.passkeyLoginApiBaseUrl
      || state.passkeyApiBaseUrl
      || state.upiCredentialMembershipCheckTotpApiBaseUrl
      || state.totpMfaApiBaseUrl
      || 'https://cha.nerver.cc'
    );
    return `${baseUrl}/api/v1/passkey/login`;
  }

  function buildPasskeyLoginOptionsFromCredential(credential = {}, state = {}) {
    const deviceId = normalizeString(
      credential.passkeyDeviceId
      || credential.deviceId
      || state.passkeyLoginDeviceId
      || state.passkeyDeviceId
      || state.totpMfaDeviceId
    );
    const options = {
      deviceId,
      credentialId: normalizeString(credential.passkeyCredentialId || credential.credentialId || credential.credential_id),
      privateJwk: credential.passkeyPrivateJwk || credential.privateJwk || credential.private_jwk || null,
      rpId: normalizeString(credential.passkeyRpId || credential.rpId || credential.rp_id),
      userHandle: normalizeString(credential.passkeyUserHandle || credential.userHandle || credential.user_handle),
      signCount: Number.isFinite(Number(credential.passkeySignCount ?? credential.signCount))
        ? Math.max(0, Math.floor(Number(credential.passkeySignCount ?? credential.signCount)))
        : undefined,
      alg: Number.isFinite(Number(credential.passkeyAlg ?? credential.alg))
        ? Number(credential.passkeyAlg ?? credential.alg)
        : undefined,
    };
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined || options[key] === null || options[key] === '') {
        delete options[key];
      }
    });
    return options;
  }
```

- [ ] **Step 2: Add cookie injection helpers near `clearOpenAiCookies()` helpers**

Insert before `loginAndReadAccessToken()`:

```javascript
    function buildChatGptCookieUrl(entry = {}) {
      const domain = normalizeString(entry.domain || '.chatgpt.com').replace(/^\./, '') || 'chatgpt.com';
      const path = normalizeString(entry.path || '/');
      return `https://${domain}${path.startsWith('/') ? path : `/${path}`}`;
    }

    async function setChatGptCookieEntries(cookieEntries = []) {
      if (!chromeApi?.cookies?.set) {
        return { setCount: 0, skipped: cookieEntries.length };
      }
      let setCount = 0;
      for (const entry of cookieEntries) {
        const name = normalizeString(entry?.name);
        const value = normalizeString(entry?.value);
        if (!name || !value) continue;
        const details = {
          url: buildChatGptCookieUrl(entry),
          name,
          value,
          path: normalizeString(entry.path || '/'),
          secure: entry.secure !== false,
          httpOnly: entry.httpOnly === true,
          sameSite: normalizeString(entry.sameSite || 'lax'),
        };
        if (!name.startsWith('__Host-') && normalizeString(entry.domain)) {
          details.domain = normalizeString(entry.domain);
        }
        if (Number.isFinite(Number(entry.expirationDate)) && Number(entry.expirationDate) > 0) {
          details.expirationDate = Number(entry.expirationDate);
        }
        await chromeApi.cookies.set(details);
        setCount += 1;
      }
      return { setCount, skipped: Math.max(0, cookieEntries.length - setCount) };
    }

    async function applyPasskeyLoginCookies(loginResult = {}, credential = {}, options = {}) {
      const cookieEntries = Array.isArray(loginResult.cookieEntries) ? loginResult.cookieEntries : [];
      if (!cookieEntries.length && !loginResult.sessionToken) {
        return { tabId: 0, setCount: 0 };
      }
      await clearOpenAiCookies();
      const target = await openFreshLoginTab(credential.email);
      if (cookieEntries.length) {
        const cookieResult = await setChatGptCookieEntries(cookieEntries);
        await addLog(`UPI Passkey 登录：${credential.email} 已写入 ${cookieResult.setCount} 个 ChatGPT Cookie。`, 'ok');
      }
      if (!cookieEntries.length && loginResult.sessionToken) {
        await setChatGptCookieEntries([{
          name: '__Secure-next-auth.session-token',
          value: loginResult.sessionToken,
          domain: '.chatgpt.com',
          path: '/',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        }]);
        await addLog(`UPI Passkey 登录：${credential.email} 已写入 sessionToken Cookie。`, 'ok');
      }
      if (chromeApi?.tabs?.reload) {
        await chromeApi.tabs.reload(target).catch(() => {});
      }
      return { tabId: target, setCount: cookieEntries.length || 1 };
    }
```

If `openFreshLoginTab()` returns a tab id in this file, keep `target` as that id. If it returns an object in the live code at execution time, adjust to `target.tabId || target.id`.

- [ ] **Step 3: Add the Passkey API login function**

Insert before `loginAndReadAccessToken()`:

```javascript
    async function tryPasskeyApiLoginAndReadAccessToken(credential = {}, state = {}, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      if (!hasPasskeyCredential(credential)) {
        return null;
      }
      const core = getPasskeyLoginCore();
      if (
        typeof core.buildPasskeyLoginRequest !== 'function'
        || typeof core.normalizePasskeyLoginResponse !== 'function'
      ) {
        await addLog(`UPI Passkey 登录：${credential.email} -> Passkey 登录 helper 未加载，回落网页登录。`, 'warn');
        return null;
      }

      const apiUrl = buildPasskeyLoginApiUrl(state);
      const requestBody = core.buildPasskeyLoginRequest(
        credential.email,
        buildPasskeyLoginOptionsFromCredential(credential, state)
      );
      await addLog(`UPI Passkey 登录：${credential.email} 正在调用 ${apiUrl} 获取 AT/Cookie。`, 'info');
      throwIfStopRequested();
      const response = await fetchImpl(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { ok: false, reason: text || `HTTP ${response.status}` };
      }
      if (!response.ok) {
        throw new Error(core.getLoginFailureMessage?.(payload) || payload.reason || `HTTP ${response.status}`);
      }
      const loginResult = core.normalizePasskeyLoginResponse(payload);
      const responseEmail = normalizeEmail(loginResult.email || credential.email);
      const targetEmail = normalizeEmail(credential.email);
      if (responseEmail && targetEmail && responseEmail !== targetEmail) {
        throw createSessionAccountMismatchError(
          `UPI Passkey 登录：返回账号 ${responseEmail} 与目标 ${targetEmail} 不一致。`,
          { sessionEmail: responseEmail, targetEmail }
        );
      }
      if (options.applyCookies !== false) {
        await applyPasskeyLoginCookies(loginResult, credential, options);
      }
      if (loginResult.accessToken) {
        await addLog(`UPI Passkey 登录：${credential.email} 已通过 Passkey API 获取 AT。`, 'ok');
      } else {
        await addLog(`UPI Passkey 登录：${credential.email} 已通过 Passkey API 获取登录 Cookie，将继续读取页面 AT。`, 'ok');
      }
      return {
        tabId: 0,
        accessToken: loginResult.accessToken,
        session: {
          accessToken: loginResult.accessToken,
          accountEmail: responseEmail || targetEmail,
          email: responseEmail || targetEmail,
          passkeyLogin: true,
        },
        passkeyLoginResult: loginResult,
      };
    }
```

- [ ] **Step 4: Run syntax check**

Run:

```powershell
node --check background/upi-credential-membership-checker.js
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add background/upi-credential-membership-checker.js
git commit -m "feat: add passkey API login executor"
```

---

### Task 3: Prefer Passkey API Login in AT Supplement and Row Login

**Files:**
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background/upi-credential-membership-checker.js:3423-3607`
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/sidepanel/account-records-manager.js:2288-2296`

- [ ] **Step 1: Add Passkey stage reporting at the start of `loginAndReadAccessToken()`**

In `loginAndReadAccessToken()`, after the existing-session reuse block and before `clearOpenAiCookies()`, insert:

```javascript
      if (hasPasskeyCredential(credential)) {
        try {
          await reportStage('passkey-login');
          const passkeySession = await tryPasskeyApiLoginAndReadAccessToken(credential, state, {
            ...options,
            applyCookies: true,
          });
          const passkeyLoginResult = passkeySession?.passkeyLoginResult || {};
          const hasPasskeyBrowserSession = Boolean(
            passkeyLoginResult.sessionToken
            || (Array.isArray(passkeyLoginResult.cookieEntries) && passkeyLoginResult.cookieEntries.length)
          );
          if (shouldReadAccessToken && passkeySession?.accessToken) {
            await reportStage('token');
            return passkeySession;
          }
          if (!shouldReadAccessToken && passkeySession && hasPasskeyBrowserSession) {
            await addLog(`UPI 账号登录：${credential.email} 已通过 Passkey API 登录。`, 'ok');
            return {
              tabId: passkeySession.tabId || 0,
              loggedIn: true,
              passkeyLogin: true,
            };
          }
          if (!shouldReadAccessToken && passkeySession && !hasPasskeyBrowserSession) {
            await addLog(`UPI Passkey 登录：${credential.email} -> 后端只返回 AT，未返回 Cookie/sessionToken，行登录回落网页登录。`, 'warn');
          }
        } catch (passkeyError) {
          await addLog(
            `UPI Passkey 登录：${credential.email} -> ${getErrorMessage(passkeyError) || passkeyError}，回落网页登录。`,
            'warn'
          );
        }
      }
```

Expected behavior:
- Passkey Free with backend `accessToken` returns before webpage login.
- Passkey Free with cookies/sessionToken but no `accessToken` logs in browser, then falls through to existing page session read.
- Row `登录` only treats the Passkey API path as logged in when cookies/sessionToken were written; an accessToken-only backend response falls back to the existing webpage login.
- API failure does not break existing password/email-code/TOTP fallback.

- [ ] **Step 2: Ensure `fillUpiCredentialMembershipFreeAccessTokens()` logs clearer Passkey path**

Replace the existing Passkey/TOTP material warning:

```javascript
          if (!normalizeTotpSecret(activeCredential.totpMfaSecret || activeCredential.totpSecret) && !hasPasskeyCredential(activeCredential)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 未保存 2FA/Passkey，先按邮箱+密码登录；如页面要求验证码会按实际错误返回。`, 'info');
          }
```

with:

```javascript
          if (hasPasskeyCredential(activeCredential)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 检测到 Passkey，优先使用 Nerver Passkey 登录接口补 AT。`, 'info');
          } else if (!normalizeTotpSecret(activeCredential.totpMfaSecret || activeCredential.totpSecret)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 未保存 2FA/Passkey，先按邮箱+密码登录；如页面要求验证码会按实际错误返回。`, 'info');
          }
```

- [ ] **Step 3: Add `passkey-login` to sidepanel progress stage mapping**

In `sidepanel/account-records-manager.js`, find the stage checks around `stage === 'login' || stage === 'totp' || stage === 'token'`.

Update them to include `passkey-login`:

```javascript
if (stage === 'login' || stage === 'passkey-login' || stage === 'totp' || stage === 'token' || stage === 'subscription-check') {
```

and:

```javascript
if (stage === 'open-chatgpt' || stage === 'login' || stage === 'passkey-login' || stage === 'totp') {
```

- [ ] **Step 4: Run syntax checks**

Run:

```powershell
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```powershell
git add background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
git commit -m "feat: prefer passkey login for AT supplement"
```

---

### Task 4: Preserve More Passkey Login Material Across Import/Export

**Files:**
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background/upi-credential-membership-checker.js`
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/sidepanel/account-records-manager.js`
- Modify: `C:/Users/Z1803/Downloads/projict/cdk-redeem-only-extension-main/background.js:3890-3990`

- [ ] **Step 1: Preserve `passkeySignCount` and `passkeyAlg` in normalizers**

Where each file currently preserves `passkeyPrivateJwk`, `passkeyPublicKeyCose`, and `passkeyApiPersisted`, add:

```javascript
passkeySignCount: Number.isFinite(Number(source.passkeySignCount ?? source.signCount))
  ? Math.max(0, Math.floor(Number(source.passkeySignCount ?? source.signCount)))
  : 0,
passkeyAlg: Number.isFinite(Number(source.passkeyAlg ?? source.alg))
  ? Number(source.passkeyAlg ?? source.alg)
  : 0,
```

Use the correct local variable name (`source`, `record`, `item`, or `rawRecord`) for each normalizer.

- [ ] **Step 2: Update `mergeCredentialAuthMaterial()`**

Inside the Passkey merge block, after `passkeyPublicKeyCose`, add:

```javascript
      target.passkeySignCount = Number.isFinite(Number(target.passkeySignCount ?? source.passkeySignCount ?? source.signCount))
        ? Math.max(0, Math.floor(Number(target.passkeySignCount ?? source.passkeySignCount ?? source.signCount)))
        : 0;
      target.passkeyAlg = Number.isFinite(Number(target.passkeyAlg ?? source.passkeyAlg ?? source.alg))
        ? Number(target.passkeyAlg ?? source.passkeyAlg ?? source.alg)
        : 0;
```

- [ ] **Step 3: Run static validation**

Run:

```powershell
rg -n "passkeySignCount|passkeyAlg" background.js background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
```

Expected: all three files include both fields.

- [ ] **Step 4: Run syntax checks**

Run:

```powershell
node --check background.js
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```powershell
git add background.js background/upi-credential-membership-checker.js sidepanel/account-records-manager.js
git commit -m "fix: preserve passkey login metadata"
```

---

### Task 5: End-to-End Verification

**Files:**
- Verify only.

- [ ] **Step 1: Run focused tests**

```powershell
node --test scripts/test-passkey-login-core.cjs
node --check background/passkey-login-core.js
node --check background.js
node --check background/message-router.js
node --check background/upi-credential-membership-checker.js
node --check sidepanel/account-records-manager.js
node --check sidepanel/sidepanel.js
git diff --check
```

Expected:
- `node --test` passes.
- all `node --check` commands exit 0.
- `git diff --check` only shows possible LF/CRLF warnings, no whitespace errors.

- [ ] **Step 2: Manual smoke test with a Passkey Free account lacking AT**

Preconditions:
- Free row has `email`, `password`, `passkeyEnabled=true`, and `passkeyCredentialId`.
- Nerver backend has the Passkey credential for that email.

Steps:
1. Reload extension in browser extension management page.
2. Open sidepanel.
3. Confirm a Passkey Free row shows `缺 AT`.
4. Click `一键补充 AT`.

Expected logs:

```text
UPI Free 分组补充 AT：<email> -> 检测到 Passkey，优先使用 Nerver Passkey 登录接口补 AT。
UPI Passkey 登录：<email> 正在调用 https://cha.nerver.cc/api/v1/passkey/login 获取 AT/Cookie。
UPI Passkey 登录：<email> 已通过 Passkey API 获取 AT。
UPI Free 分组补充 AT：<email> -> 已保存 AT。
```

Expected UI:
- row no longer shows `缺 AT`
- `一键兑换 UPI/IDEAL/全部` counts include the row when other redeem conditions match

- [ ] **Step 3: Manual fallback smoke test**

Temporarily set an invalid `passkeyLoginApiBaseUrl` in local settings or use a Passkey email not present in backend.

Expected:
- log contains `回落网页登录`
- existing browser login path still handles email code/TOTP as before

- [ ] **Step 4: Manual row login smoke test**

Click row `登录` on a Passkey Free row.

Expected:
- Passkey API writes cookies/sessionToken when backend returns them
- ChatGPT tab opens logged in to the target email
- if backend returns only AT, row login falls back to browser login rather than silently claiming success

- [ ] **Step 5: Commit final verification notes if needed**

If manual verification changes docs or release notes:

```powershell
git add Release.md RELEASING.md
git commit -m "docs: document passkey login optimization"
```

---

## Rollback Plan

If Passkey API login creates instability:

1. Revert the Task 3 commit only:

```powershell
git revert <task-3-commit>
```

2. Keep `background/passkey-login-core.js` and tests if they are harmless, or revert Task 1 and Task 2 commits too.
3. Existing browser login path remains the fallback and should continue to work.

## Self-Review

- Spec coverage: uses `gpt-login-ext` GPT login method, optimizes Passkey AT supplement, and covers row login.
- No placeholders: every task lists exact files, code blocks, commands, and expected output.
- Type consistency: request fields match reference (`deviceId`, `credentialId`, `privateJwk`, `rpId`, `userHandle`, `signCount`, `alg`); stored fields use current project prefixes (`passkeyCredentialId`, `passkeyPrivateJwk`, `passkeyRpId`, `passkeyUserHandle`, `passkeySignCount`, `passkeyAlg`).
