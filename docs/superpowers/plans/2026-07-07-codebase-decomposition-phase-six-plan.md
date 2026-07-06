# Codebase Decomposition Phase Six Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue reducing `background.js` and `sidepanel/sidepanel.js` by moving remaining bootstrap, listener, and UI binding glue into focused tested modules.

**Architecture:** Keep the extension's current no-bundler MV3 pattern. Extract modules as IIFE globals with CommonJS exports for tests, keep behavior in the same load order, and leave high-risk registration, eligibility, Free/Plus, UPI/IDEAL, 2FA, Passkey, AT supplement, and export logic unchanged.

**Tech Stack:** Plain JavaScript, Chrome Manifest V3 service worker, side panel DOM scripts, CommonJS `node:test`, `node --check`, existing smoke and removal audits.

## Global Constraints

- Do not change user-visible workflow behavior, CDK redeem behavior, account grouping, import/export formats, email-pool status rules, or GitHub release metadata.
- Do not bump version, tag, package, push, or publish during this decomposition pass.
- Use CodeGraph before modifying source files because this repo has `.codegraph/`.
- Preserve script order in `background.js`, `manifest.json`, and `sidepanel/sidepanel.html`.
- Every new browser module must expose one explicit namespace and CommonJS exports for tests.
- Commit after each completed task.
- If an existing user change appears, preserve it and work around it; do not revert unrelated edits.

---

## Current Baseline

Measured with `node scripts/module-size-report.mjs` on 2026-07-07:

| File | Lines | Current role |
| --- | ---: | --- |
| `background.js` | 15,904 | Service worker composition root, constants, executor wiring, runtime listeners, tab helpers. |
| `sidepanel/sidepanel.js` | 10,620 | Side panel composition root, config menu, settings/event binding, workflow action binding. |
| `content/signup-page.js` | 6,855 | Already under the current 7,000-line guard after detector/page splits. |
| `background/upi-credential-membership-checker.js` | 6,529 | Already under the current 6,700-line guard after membership state/login splits. |
| `sidepanel/account-records-manager.js` | 5,438 | Already under the current 5,600-line guard after view-model/progress splits. |

Already-split modules to reuse, not duplicate:

- `sidepanel/workflow-button-state.js`
- `sidepanel/workflow-status-display.js`
- `sidepanel/auto-run-state.js`
- `sidepanel/settings-state-manager.js`
- `sidepanel/settings-transfer-manager.js`
- `sidepanel/cdk-pool-manager.js`
- `sidepanel/account-records-view-model.js`
- `sidepanel/membership-redeem-progress.js`
- `background/bootstrap/auto-run-status.js`
- `background/membership/result-state.js`
- `background/membership/login-session-executor.js`
- `content/auth-page-detectors.js`

## Target File Structure

- `background/bootstrap/content-script-registry.js`: owns signup/auth content-script file order and normalization.
- `background/bootstrap/signup-executor-registry.js`: owns construction of panel bridge, signup helpers, verification helpers, and step executors.
- `background/bootstrap/runtime-listeners.js`: owns service-worker event listener registration.
- `sidepanel/config-menu-controller.js`: owns config-menu open/close state and config import/export button binding.
- `sidepanel/workflow-action-bindings.js`: owns top-level workflow action button and step-list event binding.
- `sidepanel/settings-field-bindings.js`: owns repeatable settings input/change/blur binding helpers.

## Preflight

- [ ] **Step 1: Confirm branch and workspace**

Run:

```powershell
git status --short --branch
```

Expected: branch is the current decomposition branch and output has no unrelated modified files. If files are modified, inspect before editing.

- [ ] **Step 2: Capture baseline**

Run:

```powershell
node scripts/module-size-report.mjs
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`. Existing large-file warnings may remain for `background.js` and `sidepanel/sidepanel.js`.

---

### Task 1: Extract Background Content Script Registry

**Files:**
- Create: `background/bootstrap/content-script-registry.js`
- Create: `scripts/test-content-script-registry.cjs`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `self.MultiPageBackgroundContentScriptRegistry`
- Produces: `createContentScriptRegistry()`
- Produces: `normalizeInjectFileList(files = [])`
- Produces: `getSignupEntryUrl()`
- Produces: `getSignupAuthEntryUrl()`
- Produces: `getSignupPageInjectFiles()`
- Consumes: no project globals

- [ ] **Step 1: Write the test**

Create `scripts/test-content-script-registry.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const registryModule = require('../background/bootstrap/content-script-registry.js');

test('signup content scripts keep auth detectors before signup-page', () => {
  const registry = registryModule.createContentScriptRegistry();
  const files = registry.getSignupPageInjectFiles();
  assert.equal(files[0], 'content/utils.js');
  assert.ok(files.includes('content/auth-page-detectors.js'));
  assert.ok(files.includes('content/signup-page.js'));
  assert.ok(files.indexOf('content/auth-page-detectors.js') < files.indexOf('content/signup-page.js'));
  assert.equal(new Set(files).size, files.length);
});

test('normalizes duplicate and blank inject files', () => {
  assert.deepEqual(
    registryModule.normalizeInjectFileList([' a.js ', '', 'a.js', 'b.js']),
    ['a.js', 'b.js'],
  );
});

test('entry URLs remain stable', () => {
  const registry = registryModule.createContentScriptRegistry();
  assert.equal(registry.getSignupEntryUrl(), 'https://chatgpt.com/');
  assert.equal(registry.getSignupAuthEntryUrl(), 'https://chatgpt.com/auth/login');
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-content-script-registry.cjs
```

Expected: FAIL because `background/bootstrap/content-script-registry.js` does not exist.

- [ ] **Step 3: Add the registry module**

Create `background/bootstrap/content-script-registry.js`:

```javascript
(function attachContentScriptRegistry(root, factory) {
  const api = factory();
  root.MultiPageBackgroundContentScriptRegistry = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createContentScriptRegistryModule() {
  const SIGNUP_ENTRY_URL = 'https://chatgpt.com/';
  const SIGNUP_AUTH_ENTRY_URL = 'https://chatgpt.com/auth/login';
  const SIGNUP_PAGE_INJECT_FILES = Object.freeze([
    'content/utils.js',
    'content/operation-delay.js',
    'content/auth-page-recovery.js',
    'content/auth-page-detectors.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-verification-page.js',
    'content/signup-password-page.js',
    'content/signup-profile-page.js',
    'content/signup-session-page.js',
    'content/signup-page-detector.js',
    'content/signup-page-orchestrator.js',
    'content/signup-page.js',
  ]);

  function normalizeInjectFileList(files = []) {
    const seen = new Set();
    const result = [];
    for (const value of Array.isArray(files) ? files : []) {
      const file = String(value || '').trim();
      if (!file || seen.has(file)) continue;
      seen.add(file);
      result.push(file);
    }
    return result;
  }

  function createContentScriptRegistry() {
    return {
      getSignupEntryUrl: () => SIGNUP_ENTRY_URL,
      getSignupAuthEntryUrl: () => SIGNUP_AUTH_ENTRY_URL,
      getSignupPageInjectFiles: () => normalizeInjectFileList(SIGNUP_PAGE_INJECT_FILES),
    };
  }

  return {
    createContentScriptRegistry,
    normalizeInjectFileList,
  };
});
```

- [ ] **Step 4: Wire `background.js`**

In `background.js`, add `background/bootstrap/content-script-registry.js` after `background/bootstrap/auto-run-status.js` in `importScripts(...)`.

Replace local `SIGNUP_ENTRY_URL`, `SIGNUP_AUTH_ENTRY_URL`, and `SIGNUP_PAGE_INJECT_FILES` declarations with:

```javascript
const contentScriptRegistry = self.MultiPageBackgroundContentScriptRegistry.createContentScriptRegistry();
const SIGNUP_ENTRY_URL = contentScriptRegistry.getSignupEntryUrl();
const SIGNUP_AUTH_ENTRY_URL = contentScriptRegistry.getSignupAuthEntryUrl();
const SIGNUP_PAGE_INJECT_FILES = contentScriptRegistry.getSignupPageInjectFiles();
```

- [ ] **Step 5: Add smoke checks**

In `scripts/audit-smoke-tests.mjs`, assert:

```javascript
readText('background/bootstrap/content-script-registry.js');
assertIncludes(background, 'background/bootstrap/content-script-registry.js', 'content script registry import');
assertIncludes(background, 'MultiPageBackgroundContentScriptRegistry.createContentScriptRegistry()', 'content script registry wiring');
```

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background/bootstrap/content-script-registry.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-content-script-registry.cjs
node --test scripts/test-*.cjs
git add background/bootstrap/content-script-registry.js background.js scripts/audit-smoke-tests.mjs scripts/test-content-script-registry.cjs
git commit -m "refactor: extract background content script registry"
```

---

### Task 2: Extract Background Signup Executor Registry

**Files:**
- Create: `background/bootstrap/signup-executor-registry.js`
- Create: `scripts/test-signup-executor-registry.cjs`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `self.MultiPageBackgroundSignupExecutorRegistry`
- Produces: `createSignupExecutorRegistry(deps)`
- Produces: returned object with `panelBridge`, `signupFlowHelpers`, `verificationFlowHelpers`, `executors`
- Consumes: current factory globals from `self.MultiPageBackgroundStep1` through `self.MultiPageBackgroundUpiRedeem`

- [ ] **Step 1: Add factory characterization test**

Create `scripts/test-signup-executor-registry.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/signup-executor-registry.js');

function createFactory(name, calls) {
  return {
    [`create${name}`]: (deps) => {
      calls.push({ name, deps });
      return { name, deps };
    },
  };
}

test('creates core signup helpers and step executors with shared inject list', () => {
  const calls = [];
  const root = {
    MultiPageBackgroundPanelBridge: { createPanelBridge: (deps) => { calls.push({ name: 'PanelBridge', deps }); return { name: 'PanelBridge' }; } },
    MultiPageSignupFlowHelpers: { createSignupFlowHelpers: (deps) => { calls.push({ name: 'SignupFlowHelpers', deps }); return { ensureSignupPostIdentityPageReadyInTab: () => {} }; } },
    MultiPageOpenAiMailRules: { createOpenAiMailRules: (deps) => { calls.push({ name: 'OpenAiMailRules', deps }); return { name: 'OpenAiMailRules' }; } },
    MultiPageBackgroundMailRuleRegistry: { createMailRuleRegistry: (deps) => { calls.push({ name: 'MailRuleRegistry', deps }); return { buildVerificationPollPayload: () => ({}) }; } },
    MultiPageBackgroundVerificationFlow: { createVerificationFlowHelpers: (deps) => { calls.push({ name: 'VerificationFlowHelpers', deps }); return { confirmCustomVerificationStepBypass: () => {}, resolveCustomEmailVerificationStep: () => {}, resolveVerificationStep: () => {} }; } },
    MultiPageBackgroundStep1: { createStep1Executor: (deps) => { calls.push({ name: 'Step1', deps }); return { nodeId: 'open-chatgpt' }; } },
    MultiPageBackgroundStep2: { createStep2Executor: (deps) => { calls.push({ name: 'Step2', deps }); return { nodeId: 'submit-signup-email' }; } },
  };

  const registry = moduleApi.createSignupExecutorRegistry({
    root,
    SIGNUP_PAGE_INJECT_FILES: ['content/utils.js', 'content/signup-page.js'],
    SIGNUP_ENTRY_URL: 'https://chatgpt.com/',
    SIGNUP_AUTH_ENTRY_URL: 'https://chatgpt.com/auth/login',
    addLog: () => {},
  });

  assert.equal(registry.executors.step1.nodeId, 'open-chatgpt');
  assert.equal(registry.executors.step2.nodeId, 'submit-signup-email');
  assert.deepEqual(calls.find((call) => call.name === 'Step2').deps.SIGNUP_PAGE_INJECT_FILES, ['content/utils.js', 'content/signup-page.js']);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-signup-executor-registry.cjs
```

Expected: FAIL because the registry module does not exist.

- [ ] **Step 3: Create the registry shell**

Create `background/bootstrap/signup-executor-registry.js`:

```javascript
(function attachSignupExecutorRegistry(root, factory) {
  const api = factory();
  root.MultiPageBackgroundSignupExecutorRegistry = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createSignupExecutorRegistryModule() {
  function requireFactory(root, namespace, factoryName) {
    const factory = root?.[namespace]?.[factoryName];
    if (typeof factory !== 'function') {
      throw new Error(`${namespace}.${factoryName} is not available.`);
    }
    return factory;
  }

  function createSignupExecutorRegistry(deps = {}) {
    const root = deps.root || (typeof self !== 'undefined' ? self : globalThis);
    const panelBridge = root.MultiPageBackgroundPanelBridge?.createPanelBridge?.(deps) || null;
    const signupFlowHelpers = root.MultiPageSignupFlowHelpers?.createSignupFlowHelpers?.(deps) || {};
    const openAiMailRules = root.MultiPageOpenAiMailRules?.createOpenAiMailRules?.(deps) || null;
    const mailRuleRegistry = root.MultiPageBackgroundMailRuleRegistry?.createMailRuleRegistry?.({
      ...deps,
      flowBuilders: { openai: openAiMailRules },
    }) || null;
    const verificationFlowHelpers = root.MultiPageBackgroundVerificationFlow?.createVerificationFlowHelpers?.({
      ...deps,
      buildVerificationPollPayload: mailRuleRegistry?.buildVerificationPollPayload,
    }) || {};
    const executors = {
      step1: root.MultiPageBackgroundStep1?.createStep1Executor?.(deps) || null,
      step2: root.MultiPageBackgroundStep2?.createStep2Executor?.({
        ...deps,
        ensureSignupPostIdentityPageReadyInTab: signupFlowHelpers.ensureSignupPostIdentityPageReadyInTab,
      }) || null,
    };
    return { panelBridge, signupFlowHelpers, openAiMailRules, mailRuleRegistry, verificationFlowHelpers, executors };
  }

  return {
    createSignupExecutorRegistry,
    requireFactory,
  };
});
```

- [ ] **Step 4: Move executor construction incrementally**

Move the existing helper and executor construction block from `background.js` into `createSignupExecutorRegistry(deps)` in small slices:

1. `panelBridge`
2. `signupFlowHelpers`
3. `openAiMailRules`
4. `mailRuleRegistry`
5. `verificationFlowHelpers`
6. step executors already constructed near the `Signup / OAuth Helpers` block

In `background.js`, leave local destructuring only:

```javascript
const signupExecutorRegistry = self.MultiPageBackgroundSignupExecutorRegistry.createSignupExecutorRegistry({
  root: self,
  chrome,
  addLog,
  SIGNUP_ENTRY_URL,
  SIGNUP_AUTH_ENTRY_URL,
  SIGNUP_PAGE_INJECT_FILES,
  buildGeneratedAliasEmail,
  buildHotmailLocalEndpoint,
  closeConflictingTabsForSource,
  completeNodeFromBackground,
  createAutomationTab,
  ensureContentScriptReadyOnTab,
  ensureContentScriptReadyOnTabUntilStopped,
  ensureHotmailAccountForFlow,
  ensureIcloudMailSessionForVerification,
  ensureLuckmailPurchaseForFlow,
  ensureMail2925AccountForFlow,
  fetchGeneratedEmail,
  generatePassword,
  generateRandomBirthday,
  generateRandomName,
  getMailConfig,
  getPanelMode,
  getState,
  getTabId,
  isGeneratedAliasProvider,
  isHotmailProvider,
  isLuckmailProvider,
  isRetryableContentScriptTransportError,
  isReusableGeneratedAliasEmail,
  isSignupEmailVerificationPageUrl,
  isSignupPasswordPageUrl,
  isTabAlive,
  persistRegistrationEmailState,
  resolveSignupEmailForFlow,
  reuseOrCreateTab,
  sendToContentScript,
  sendToContentScriptResilient,
  sendToMailContentScriptResilient,
  setEmailState,
  setNodeStatus,
  setPasswordState,
  setState,
  shouldUseCustomRegistrationEmail,
  sleepWithStop,
  throwIfStopped,
  waitForTabStableComplete,
  waitForTabUrlMatch,
});
const {
  panelBridge,
  signupFlowHelpers,
  verificationFlowHelpers,
  executors: {
    step1: step1Executor,
    step2: step2Executor,
    step3: step3Executor,
    step4: step4Executor,
    step5: step5Executor,
    step6: step6Executor,
    step7: step7Executor,
    step8: step8Executor,
    step9: step9Executor,
    enableTotpMfa: enableTotpMfaExecutor,
    enablePasskey: enablePasskeyExecutor,
    no2faFree: no2faFreeRouteExecutor,
    upiRedeem: upiRedeemExecutor,
  },
} = signupExecutorRegistry;
```

Do not rename executor variables used later by `background.js`.

- [ ] **Step 5: Add smoke checks**

Update `scripts/audit-smoke-tests.mjs` to assert:

```javascript
readText('background/bootstrap/signup-executor-registry.js');
assertIncludes(background, 'background/bootstrap/signup-executor-registry.js', 'signup executor registry import');
assertIncludes(background, 'MultiPageBackgroundSignupExecutorRegistry.createSignupExecutorRegistry', 'signup executor registry wiring');
```

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background/bootstrap/signup-executor-registry.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-signup-executor-registry.cjs
node --test scripts/test-*.cjs
git add background/bootstrap/signup-executor-registry.js background.js scripts/audit-smoke-tests.mjs scripts/test-signup-executor-registry.cjs
git commit -m "refactor: extract signup executor registry"
```

---

### Task 3: Extract Service Worker Runtime Listener Registrar

**Files:**
- Create: `background/bootstrap/runtime-listeners.js`
- Create: `scripts/test-background-runtime-listeners.cjs`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `self.MultiPageBackgroundRuntimeListeners`
- Produces: `createRuntimeListenerRegistrar(deps)`
- Consumes: `chromeApi`, `handleMessage`, `handleAlarm`, `handleTabUpdated`, `handleStartup`, `handleInstalled`, `handleError`

- [ ] **Step 1: Add listener registrar tests**

Create `scripts/test-background-runtime-listeners.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/runtime-listeners.js');

function createEventSink() {
  const listeners = [];
  return { listeners, addListener: (listener) => listeners.push(listener) };
}

test('registers runtime, alarm, tab, startup, and installed listeners', () => {
  const events = {
    onMessage: createEventSink(),
    onAlarm: createEventSink(),
    onUpdated: createEventSink(),
    onStartup: createEventSink(),
    onInstalled: createEventSink(),
  };
  const chromeApi = {
    runtime: { onMessage: events.onMessage, onStartup: events.onStartup, onInstalled: events.onInstalled },
    alarms: { onAlarm: events.onAlarm },
    tabs: { onUpdated: events.onUpdated },
  };
  const registrar = moduleApi.createRuntimeListenerRegistrar({
    chromeApi,
    handleMessage: () => true,
    handleAlarm: () => {},
    handleTabUpdated: () => {},
    handleStartup: () => {},
    handleInstalled: () => {},
  });

  registrar.registerRuntimeListeners();

  assert.equal(events.onMessage.listeners.length, 1);
  assert.equal(events.onAlarm.listeners.length, 1);
  assert.equal(events.onUpdated.listeners.length, 1);
  assert.equal(events.onStartup.listeners.length, 1);
  assert.equal(events.onInstalled.listeners.length, 1);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-background-runtime-listeners.cjs
```

Expected: FAIL because `background/bootstrap/runtime-listeners.js` does not exist.

- [ ] **Step 3: Add registrar module**

Create `background/bootstrap/runtime-listeners.js`:

```javascript
(function attachRuntimeListeners(root, factory) {
  const api = factory();
  root.MultiPageBackgroundRuntimeListeners = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRuntimeListenersModule() {
  function createRuntimeListenerRegistrar({
    chromeApi,
    handleMessage,
    handleAlarm,
    handleTabUpdated,
    handleStartup,
    handleInstalled,
    handleError = () => {},
  } = {}) {
    function registerRuntimeListeners() {
      chromeApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          return handleMessage(message, sender, sendResponse);
        } catch (error) {
          handleError('runtime.onMessage', error);
          throw error;
        }
      });
      chromeApi.alarms.onAlarm.addListener((alarm) => handleAlarm(alarm));
      chromeApi.tabs.onUpdated.addListener((tabId, changeInfo, tab) => handleTabUpdated(tabId, changeInfo, tab));
      chromeApi.runtime.onStartup.addListener(() => handleStartup());
      chromeApi.runtime.onInstalled.addListener((details) => handleInstalled(details));
    }

    return { registerRuntimeListeners };
  }

  return { createRuntimeListenerRegistrar };
});
```

- [ ] **Step 4: Wire `background.js`**

Add `background/bootstrap/runtime-listeners.js` after `background/bootstrap/content-script-registry.js` in `importScripts(...)`.

Replace the bottom `chrome.runtime.onMessage`, `chrome.alarms.onAlarm`, `chrome.tabs.onUpdated`, `chrome.runtime.onStartup`, and `chrome.runtime.onInstalled` listener registration with:

```javascript
const runtimeListenerRegistrar = self.MultiPageBackgroundRuntimeListeners.createRuntimeListenerRegistrar({
  chromeApi: chrome,
  handleMessage: (message, sender, sendResponse) => handleRuntimeMessage(message, sender, sendResponse),
  handleAlarm: (alarm) => handleAutoRunTimerAlarm(alarm),
  handleTabUpdated: (tabId, changeInfo, tab) => handleTrackedTabUpdated(tabId, changeInfo, tab),
  handleStartup: () => handleServiceWorkerStartup(),
  handleInstalled: (details) => handleExtensionInstalled(details),
  handleError: handleBackgroundStartupError,
});
runtimeListenerRegistrar.registerRuntimeListeners();
```

The dependency names in this snippet are the registrar contract. If the current bottom block contains inline logic, first wrap that logic in local functions named `handleRuntimeMessage`, `handleAutoRunTimerAlarm`, `handleTrackedTabUpdated`, `handleServiceWorkerStartup`, and `handleExtensionInstalled`, then pass those functions to the registrar.

- [ ] **Step 5: Add smoke checks**

Update `scripts/audit-smoke-tests.mjs`:

```javascript
readText('background/bootstrap/runtime-listeners.js');
assertIncludes(background, 'MultiPageBackgroundRuntimeListeners.createRuntimeListenerRegistrar', 'runtime listener registrar wiring');
```

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background/bootstrap/runtime-listeners.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-background-runtime-listeners.cjs
node --test scripts/test-*.cjs
git add background/bootstrap/runtime-listeners.js background.js scripts/audit-smoke-tests.mjs scripts/test-background-runtime-listeners.cjs
git commit -m "refactor: extract background runtime listener registrar"
```

---

### Task 4: Extract Sidepanel Config Menu Controller

**Files:**
- Create: `sidepanel/config-menu-controller.js`
- Create: `scripts/test-sidepanel-config-menu-controller.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `window.SidepanelConfigMenuController`
- Produces: `createConfigMenuController(deps)`
- Consumes: config DOM nodes, `exportSettings`, `importSettingsFromFile`, `showToast`, `scheduleSettingsSave`

- [ ] **Step 1: Add controller tests**

Create `scripts/test-sidepanel-config-menu-controller.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/config-menu-controller.js');

function fakeButton() {
  const listeners = {};
  return {
    classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); } },
    addEventListener(type, listener) { listeners[type] = listener; },
    click() { listeners.click?.({ preventDefault() {}, stopPropagation() {} }); },
    listeners,
  };
}

test('config menu toggles open state and calls update callback', () => {
  const button = fakeButton();
  const menu = fakeButton();
  let updated = 0;
  const controller = moduleApi.createConfigMenuController({
    dom: { btnConfigMenu: button, configMenu: menu },
    onUpdate: () => { updated += 1; },
  });
  controller.bind();
  button.click();
  assert.equal(controller.isOpen(), true);
  assert.equal(updated, 1);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-sidepanel-config-menu-controller.cjs
```

Expected: FAIL because the controller module does not exist.

- [ ] **Step 3: Create the controller module**

Create `sidepanel/config-menu-controller.js`:

```javascript
(function attachConfigMenuController(root, factory) {
  const api = factory();
  root.SidepanelConfigMenuController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createConfigMenuControllerModule() {
  function createConfigMenuController({
    dom = {},
    exportSettings = async () => {},
    importSettingsFromFile = async () => {},
    onUpdate = () => {},
  } = {}) {
    let open = false;

    function setOpen(nextOpen) {
      open = nextOpen === true;
      dom.configMenu?.classList?.toggle?.('open', open);
      dom.btnConfigMenu?.classList?.toggle?.('active', open);
      onUpdate(open);
    }

    function bind() {
      dom.btnConfigMenu?.addEventListener?.('click', (event) => {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        setOpen(!open);
      });
      dom.btnExportSettings?.addEventListener?.('click', async (event) => {
        event?.preventDefault?.();
        await exportSettings();
        setOpen(false);
      });
      dom.inputImportSettingsFile?.addEventListener?.('change', async () => {
        await importSettingsFromFile(dom.inputImportSettingsFile?.files?.[0] || null);
      });
    }

    return {
      bind,
      close: () => setOpen(false),
      isOpen: () => open,
      setOpen,
    };
  }

  return { createConfigMenuController };
});
```

- [ ] **Step 4: Wire sidepanel**

Load `config-menu-controller.js` before `sidepanel.js` in `sidepanel/sidepanel.html`.

In `sidepanel/sidepanel.js`, replace `configMenuOpen`, `updateConfigMenuControls()`, and `bindConfigMenuEvents()` implementation with a controller instance:

```javascript
const configMenuController = window.SidepanelConfigMenuController.createConfigMenuController({
  dom: { btnConfigMenu, configMenu, btnExportSettings, btnImportSettings, inputImportSettingsFile },
  exportSettings,
  importSettingsFromFile,
  onUpdate: () => updateSaveButtonState(),
});
```

Keep existing helper function names as thin wrappers if other code calls them:

```javascript
function updateConfigMenuControls() {
  configMenuController.setOpen(configMenuController.isOpen());
}

function bindConfigMenuEvents() {
  configMenuController.bind();
}
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/config-menu-controller.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-config-menu-controller.cjs
node --test scripts/test-*.cjs
git add sidepanel/config-menu-controller.js sidepanel/sidepanel.html sidepanel/sidepanel.js scripts/audit-smoke-tests.mjs scripts/test-sidepanel-config-menu-controller.cjs
git commit -m "refactor: extract sidepanel config menu controller"
```

---

### Task 5: Extract Sidepanel Workflow Action Bindings

**Files:**
- Create: `sidepanel/workflow-action-bindings.js`
- Create: `scripts/test-sidepanel-workflow-action-bindings.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `window.SidepanelWorkflowActionBindings`
- Produces: `createWorkflowActionBindings(deps)`
- Consumes: top-level workflow DOM nodes and action callbacks

- [ ] **Step 1: Add action binding tests**

Create `scripts/test-sidepanel-workflow-action-bindings.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/workflow-action-bindings.js');

function fakeElement() {
  const listeners = {};
  return {
    addEventListener(type, listener) { listeners[type] = listener; },
    click() { return listeners.click?.({ preventDefault() {} }); },
    listeners,
  };
}

test('binds auto run and stop buttons to callbacks', async () => {
  const btnAutoRun = fakeElement();
  const btnStop = fakeElement();
  const calls = [];
  const bindings = moduleApi.createWorkflowActionBindings({
    dom: { btnAutoRun, btnStop },
    actions: {
      startAutoRun: async () => calls.push('start'),
      stopCurrentRun: async () => calls.push('stop'),
    },
  });
  bindings.bind();
  await btnAutoRun.click();
  await btnStop.click();
  assert.deepEqual(calls, ['start', 'stop']);
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-sidepanel-workflow-action-bindings.cjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create action binding module**

Create `sidepanel/workflow-action-bindings.js`:

```javascript
(function attachWorkflowActionBindings(root, factory) {
  const api = factory();
  root.SidepanelWorkflowActionBindings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createWorkflowActionBindingsModule() {
  function bindClick(element, callback) {
    element?.addEventListener?.('click', async (event) => {
      event?.preventDefault?.();
      await callback(event);
    });
  }

  function createWorkflowActionBindings({ dom = {}, actions = {} } = {}) {
    function bind() {
      bindClick(dom.btnAutoRun, actions.startAutoRun || (async () => {}));
      bindClick(dom.btnAutoContinue, actions.autoContinue || (async () => {}));
      bindClick(dom.btnAutoRunNow, actions.runScheduledNow || (async () => {}));
      bindClick(dom.btnAutoCancelSchedule, actions.cancelSchedule || (async () => {}));
      bindClick(dom.btnStop, actions.stopCurrentRun || (async () => {}));
      bindClick(dom.btnReset, actions.resetWorkflow || (async () => {}));
      bindClick(dom.btnClearLog, actions.clearLog || (async () => {}));
      dom.stepsList?.addEventListener?.('click', (event) => actions.handleStepListClick?.(event));
    }
    return { bind };
  }

  return { bindClick, createWorkflowActionBindings };
});
```

- [ ] **Step 4: Wire sidepanel**

Load `workflow-action-bindings.js` before `sidepanel.js`.

Replace the bottom workflow button listener block in `sidepanel/sidepanel.js` with:

```javascript
const workflowActionBindings = window.SidepanelWorkflowActionBindings.createWorkflowActionBindings({
  dom: { stepsList, btnAutoRun, btnAutoContinue, btnAutoRunNow, btnAutoCancelSchedule, btnStop, btnReset, btnClearLog },
  actions: {
    handleStepListClick,
    startAutoRun,
    autoContinue,
    runScheduledNow,
    cancelSchedule,
    stopCurrentRun,
    resetWorkflow,
    clearLog,
  },
});
workflowActionBindings.bind();
```

Keep existing action function bodies in `sidepanel/sidepanel.js`.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/workflow-action-bindings.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-workflow-action-bindings.cjs
node --test scripts/test-*.cjs
git add sidepanel/workflow-action-bindings.js sidepanel/sidepanel.html sidepanel/sidepanel.js scripts/audit-smoke-tests.mjs scripts/test-sidepanel-workflow-action-bindings.cjs
git commit -m "refactor: extract workflow action bindings"
```

---

### Task 6: Extract Sidepanel Settings Field Binding Helper

**Files:**
- Create: `sidepanel/settings-field-bindings.js`
- Create: `scripts/test-sidepanel-settings-field-bindings.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces: `window.SidepanelSettingsFieldBindings`
- Produces: `createSettingsFieldBindings({ scheduleSettingsSave })`
- Produces: `bindInput(element, options)`
- Produces: `bindChange(element, options)`
- Produces: `bindBlur(element, options)`

- [ ] **Step 1: Add helper tests**

Create `scripts/test-sidepanel-settings-field-bindings.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/settings-field-bindings.js');

function fakeInput(value = '') {
  const listeners = {};
  return {
    value,
    addEventListener(type, listener) { listeners[type] = listener; },
    dispatch(type) { listeners[type]?.({ target: this }); },
    listeners,
  };
}

test('bindInput normalizes value and schedules save', () => {
  const input = fakeInput('  abc  ');
  const calls = [];
  const binder = moduleApi.createSettingsFieldBindings({
    scheduleSettingsSave: (patch) => calls.push(patch),
  });
  binder.bindInput(input, {
    key: 'sampleKey',
    normalize: (value) => String(value).trim(),
  });
  input.dispatch('input');
  assert.deepEqual(calls, [{ sampleKey: 'abc' }]);
});

test('bindBlur applies optional afterBlur callback', () => {
  const input = fakeInput('7');
  let afterBlurValue = '';
  const binder = moduleApi.createSettingsFieldBindings({ scheduleSettingsSave: () => {} });
  binder.bindBlur(input, {
    normalize: (value) => String(Number(value) + 1),
    afterBlur: (value) => { afterBlurValue = value; },
  });
  input.dispatch('blur');
  assert.equal(afterBlurValue, '8');
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
node --test scripts/test-sidepanel-settings-field-bindings.cjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add helper module**

Create `sidepanel/settings-field-bindings.js`:

```javascript
(function attachSettingsFieldBindings(root, factory) {
  const api = factory();
  root.SidepanelSettingsFieldBindings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSettingsFieldBindingsModule() {
  function createSettingsFieldBindings({ scheduleSettingsSave = () => {} } = {}) {
    function applyBinding(element, eventName, options = {}) {
      element?.addEventListener?.(eventName, () => {
        const rawValue = element.type === 'checkbox' ? element.checked : element.value;
        const value = typeof options.normalize === 'function' ? options.normalize(rawValue, element) : rawValue;
        if (options.key) {
          scheduleSettingsSave({ [options.key]: value });
        }
        options.afterChange?.(value, element);
        if (eventName === 'blur') options.afterBlur?.(value, element);
      });
    }

    return {
      bindInput: (element, options) => applyBinding(element, 'input', options),
      bindChange: (element, options) => applyBinding(element, 'change', options),
      bindBlur: (element, options) => applyBinding(element, 'blur', options),
    };
  }

  return { createSettingsFieldBindings };
});
```

- [ ] **Step 4: Convert only simple setting fields**

Load `settings-field-bindings.js` before `sidepanel.js`.

In `sidepanel/sidepanel.js`, instantiate:

```javascript
const settingsFieldBindings = window.SidepanelSettingsFieldBindings.createSettingsFieldBindings({
  scheduleSettingsSave,
});
```

Use it only for simple fields whose current listeners directly call `scheduleSettingsSave` with one key:

- `inputVpsUrl`
- `inputVpsPassword`
- `inputPassword`
- `inputEmailPrefix`
- `inputInbucketMailbox`
- `inputInbucketHost`
- `inputRunCount`
- `inputAutoStepDelaySeconds`

Do not convert complex handlers that call provider refresh, account pool sync, modal logic, CDK actions, Removed Payment Worker controls, or any workflow start/stop behavior.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel/settings-field-bindings.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-settings-field-bindings.cjs
node --test scripts/test-*.cjs
git add sidepanel/settings-field-bindings.js sidepanel/sidepanel.html sidepanel/sidepanel.js scripts/audit-smoke-tests.mjs scripts/test-sidepanel-settings-field-bindings.cjs
git commit -m "refactor: extract simple settings field bindings"
```

---

### Task 7: Update Audit Boundaries And Final Verification

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: `docs/superpowers/plans/2026-07-07-codebase-decomposition-phase-six-plan.md`

**Interfaces:**
- Consumes: line counts achieved by Tasks 1-6
- Produces: tighter size guards for new modules and any large files that dropped meaningfully

- [ ] **Step 1: Measure final sizes**

Run:

```powershell
node scripts/module-size-report.mjs
```

Expected: `background.js` and `sidepanel/sidepanel.js` line counts are lower than the baseline at the top of this plan.

- [ ] **Step 2: Add guards for new modules**

In `scripts/audit-smoke-tests.mjs`, add:

```javascript
assertFileLineCountAtMost('background/bootstrap/content-script-registry.js', 120, 'content script registry size guard');
assertFileLineCountAtMost('background/bootstrap/signup-executor-registry.js', 900, 'signup executor registry size guard');
assertFileLineCountAtMost('background/bootstrap/runtime-listeners.js', 180, 'runtime listeners size guard');
assertFileLineCountAtMost('sidepanel/config-menu-controller.js', 220, 'config menu controller size guard');
assertFileLineCountAtMost('sidepanel/workflow-action-bindings.js', 220, 'workflow action bindings size guard');
assertFileLineCountAtMost('sidepanel/settings-field-bindings.js', 180, 'settings field bindings size guard');
```

Only lower `background.js` and `sidepanel/sidepanel.js` guards if the final line counts are safely below the new threshold.

- [ ] **Step 3: Run full verification**

Run:

```powershell
node --check background/bootstrap/content-script-registry.js
node --check background/bootstrap/signup-executor-registry.js
node --check background/bootstrap/runtime-listeners.js
node --check sidepanel/config-menu-controller.js
node --check sidepanel/workflow-action-bindings.js
node --check sidepanel/settings-field-bindings.js
node --check background.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`.

- [ ] **Step 4: Commit audit updates**

Run:

```powershell
git add scripts/audit-smoke-tests.mjs docs/superpowers/plans/2026-07-07-codebase-decomposition-phase-six-plan.md
git commit -m "test: guard decomposition phase six modules"
```

---

## Manual Smoke Checklist

- Reload the unpacked extension from `chrome://extensions`.
- Confirm the side panel still shows the 7-step main workflow.
- Open and close the config menu; export settings; import a known settings JSON.
- Start and stop a single manual workflow step.
- Start auto run with one test account, then stop it.
- Confirm logs and progress counter still update.
- Import Free text containing full 2FA, no-2FA, and Passkey rows.
- Confirm Free buttons still show expected counts.
- Confirm UPI/IDEAL CDK pool sections still render and their buttons still respond.

## Self-Review

- Spec coverage: This plan targets the remaining large composition roots, avoids already-extracted modules, preserves behavior, and adds tests for each new boundary.
- Placeholder scan: No task contains deferred-work markers or unnamed implementation work; each module has exact names, commands, and expected outcomes.
- Type consistency: Browser namespaces and CommonJS exports match across tests, smoke checks, and wiring steps.
