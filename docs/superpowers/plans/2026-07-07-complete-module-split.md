# Complete Module Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 Chrome MV3 扩展中的大文件拆成职责清晰、可测试、可维护的小模块，同时保持现有功能和导入导出格式不变。

**Architecture:** 继续沿用当前项目的全局命名空间工厂模式，例如 `SidepanelAccountRecordsExportBuilders.create...()` 和 `MultiPage...create...()`，不引入打包器、不改 Manifest 架构。拆分顺序按“纯函数 -> 渲染 -> 运行态动作 -> 后台路由 -> 后台业务流”推进，每个任务独立测试和提交。

**Tech Stack:** Plain JavaScript, Chrome Manifest V3, Node `--check`, Node `node:test`, existing smoke audits.

## Global Constraints

- 不删除现有业务功能：注册、取码、2FA、Passkey、免 2FA Free、UPI/IDEAL、AT 补充、配置导入导出都必须保留。
- 不引入 npm 依赖、不改构建方式、不改 Manifest V3 基础结构。
- 新模块继续使用 IIFE + global namespace + optional CommonJS export。
- 每个新增 sidepanel 脚本必须加入 `sidepanel/sidepanel.html`，并在 `scripts/audit-smoke-tests.mjs` 加载顺序断言。
- 每个新增 background 模块必须加入 `background.js` 或已有 bootstrap registry，并加 smoke 断言。
- 每个任务完成后运行对应 `node --check`、相关 `node --test`、`node scripts/audit-smoke-tests.mjs`、`git diff --check`。
- 每个任务单独提交，提交信息使用 `refactor:` 前缀。
- 目标行数：普通 helper 模块不超过 250 行；复杂 controller 不超过 700 行；最终 `sidepanel/sidepanel.js` 不超过 1500 行；`sidepanel/account-records-manager.js` 不超过 900 行；`background/message-router.js` 不超过 700 行；`background/upi-credential-membership-checker.js` 不超过 1200 行；`background/steps/upi-redeem.js` 不超过 1200 行。

---

## File Structure Target

### Sidepanel Account Records

- Create `sidepanel/account-records-credential-parser.js`
  - Owns Free/Plus text line parsing, Passkey marker parsing, timestamp/url detection, credential normalization.
- Create `sidepanel/account-records-display-model.js`
  - Owns result lookup, display row merge, row sanitization, group filtering, status metadata.
- Create `sidepanel/account-records-flow-view.js`
  - Owns membership flow steps, flow status, flow detail, flow HTML rendering.
- Create `sidepanel/account-records-renderer.js`
  - Owns account history panel rendering: header, chips, pagination, empty state, record list.
- Create `sidepanel/account-records-dom-actions.js`
  - Owns DOM click handlers, closest/dataset helpers, selection state update glue.
- Create `sidepanel/account-records-membership-actions.js`
  - Owns runtime actions for check, import, export, AT supplement, login, move group, delete.
- Create `sidepanel/account-records-redeem-actions.js`
  - Owns UPI/IDEAL redeem actions, all redeem, single redeem, cancel job, status refresh.
- Keep `sidepanel/account-records-manager.js`
  - Becomes orchestration facade only: creates submodules, exposes public methods, passes shared deps.

### Sidepanel Main

- Create `sidepanel/app-state.js`
  - Owns sidepanel local mutable state and state patch helpers.
- Create `sidepanel/settings-controller.js`
  - Owns settings hydration, save payload construction, settings UI sync.
- Create `sidepanel/workflow-controller.js`
  - Owns workflow button state, step rendering, auto-run labels, current step actions.
- Create `sidepanel/runtime-message-controller.js`
  - Owns `chrome.runtime.onMessage` handling and message dispatch to sidepanel modules.
- Create `sidepanel/sidepanel-bootstrap.js`
  - Owns app initialization order and module construction.
- Keep `sidepanel/sidepanel.js`
  - Becomes thin compatibility entrypoint that calls `SidepanelBootstrap.createSidepanelApp(...).start()`.

### Background Routing

- Create `background/routes/settings-routes.js`
  - Owns `SAVE_SETTING`, import/export settings, runtime state patch endpoints.
- Create `background/routes/account-record-routes.js`
  - Owns account run history and current account record messages.
- Create `background/routes/email-pool-routes.js`
  - Owns custom email pool, used marker, provider pool operations.
- Create `background/routes/passkey-routes.js`
  - Owns passkey enable/login/AT supplement route messages.
- Keep existing `background/routes/membership-routes.js`, `cdkey-routes.js`, `workflow-routes.js`.
- Keep `background/message-router.js`
  - Becomes route registry and shared response wrapper.

### Background Membership Checker

- Create `background/membership/trial-eligibility-service.js`
  - Owns eligibility API request/response normalization and retry classification.
- Create `background/membership/membership-result-sync.js`
  - Owns result item merge, group movement, deletion tombstone rules, import/export compatibility.
- Create `background/membership/access-token-supplement-service.js`
  - Owns AT supplement by password, 2FA, Passkey, email-code fallback handling.
- Create `background/membership/free-pool-service.js`
  - Owns Free group candidate selection, no-trial marking, manual eligibility check from email pool.
- Create `background/membership/redeem-candidate-service.js`
  - Owns UPI/IDEAL candidate classification, pm-unavailable/cross-region handling, daily limit, failure counts.
- Keep `background/upi-credential-membership-checker.js`
  - Becomes membership workflow facade and public API compatibility layer.

### Background UPI Redeem Step

- Create `background/steps/upi-redeem/session-material.js`
  - Owns session email, access token, password, 2FA/passkey/no-2FA credential material collection.
- Create `background/steps/upi-redeem/free-entry.js`
  - Owns “有试用资格才入 Free” and “无资格仅标记邮箱池” logic.
- Create `background/steps/upi-redeem/channel-submission.js`
  - Owns UPI/IDEAL CDK selection and remote submission.
- Create `background/steps/upi-redeem/status-polling.js`
  - Owns remote status refresh every 5 seconds and skip-auto-retry behavior.
- Create `background/steps/upi-redeem/finalize.js`
  - Owns result logs, used email marking, auto-run continuation decisions.
- Keep `background/steps/upi-redeem.js`
  - Becomes executor facade.

### Verification Flow

- Create `background/verification/assurivo-time.js`
  - Owns UTC epoch parsing and Assurivo UTC+8 fallback.
- Create `background/verification/verification-keywords.js`
  - Owns English/Japanese/Hindi ChatGPT/OpenAI semantic matching keywords.
- Create `background/verification/assurivo-feed-client.js`
  - Owns feed.php/open.php fetch, JSON parsing, retryable errors.
- Create `background/verification/code-extractor.js`
  - Owns strict body-only 6-digit code extraction.
- Create `background/verification/resend-controller.js`
  - Owns resend timing, rejected-code exclusion, attempt counters.
- Keep `background/verification-flow.js`
  - Becomes public facade for step 4 and step 6.

---

## Task 1: Account Credential Parser Split

**Files:**
- Create: `sidepanel/account-records-credential-parser.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: `scripts/test-account-records-manager.cjs`
- Test: `scripts/test-membership-credential-format.cjs`
- Test: `scripts/test-sidepanel-membership-format-compat.cjs`

**Interfaces:**
- Produces:
  - `SidepanelAccountRecordsCredentialParser.createAccountRecordsCredentialParser(deps)`
  - `parseUpiCredentialMembershipParts(parts: string[]): object`
  - `normalizeUpiCredentialMembershipCredential(rawItem: object, fallbackSource?: string): object`
  - `parseUpiCredentialMembershipText(text: string): object[]`
  - `normalizeUpiCredentialMembershipTotpSecret(value: string): string`
  - `parseUpiCredentialMembershipPasskeyMarker(value: string): object`
- Consumes:
  - `MultiPageMembershipCredentialFormat.parseCredentialLine`
  - Current manager helpers `normalizeUpiCredentialMembershipEmail`, `normalizeUpiCredentialMembershipText`

- [ ] **Step 1: Create module skeleton**

```javascript
(function attachSidepanelAccountRecordsCredentialParser(globalScope) {
  function createAccountRecordsCredentialParser(context = {}) {
    const normalizeEmail = context.normalizeEmail || ((value = '') => String(value || '').trim().toLowerCase());
    const normalizeText = context.normalizeText || ((value = '') => String(value || '').trim());
    return {
      normalizeEmail,
      normalizeText,
    };
  }
  const api = { createAccountRecordsCredentialParser };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsCredentialParser = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 2: Move parser functions from manager**

Move the functions currently named `readFirstUpiCredentialMembershipNumericMetadataValue`, `readUpiCredentialMembershipPasskeySignCount`, `readUpiCredentialMembershipPasskeyAlg`, `buildUpiCredentialMembershipPasskeyNumericMetadataPatch`, `normalizeUpiCredentialMembershipTotpSecret`, `isLikelyUpiCredentialMembershipTimestamp`, `isLikelyUpiCredentialMembershipVerificationUrl`, `isUpiCredentialMembershipPasskeyMarker`, `getUpiCredentialMembershipPasskeyCredentialId`, `parseUpiCredentialMembershipPasskeyMarker`, `getMembershipCredentialFormat`, `parseUpiCredentialMembershipParts`, `parseUpiCredentialMembershipPartsFallback`, `normalizeUpiCredentialMembershipCredential`, and `parseUpiCredentialMembershipText`.

- [ ] **Step 3: Wire manager to parser module**

In `sidepanel/account-records-manager.js`, instantiate:

```javascript
const accountRecordsCredentialParser = globalScope.SidepanelAccountRecordsCredentialParser || {};
if (typeof accountRecordsCredentialParser.createAccountRecordsCredentialParser !== 'function') {
  throw new Error('Account records credential parser module is not loaded.');
}
const {
  parseUpiCredentialMembershipText,
  normalizeUpiCredentialMembershipCredential,
  parseUpiCredentialMembershipParts,
  normalizeUpiCredentialMembershipTotpSecret,
  parseUpiCredentialMembershipPasskeyMarker,
} = accountRecordsCredentialParser.createAccountRecordsCredentialParser({
  normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
  normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
  getMembershipCredentialFormatHelpers,
});
```

- [ ] **Step 4: Add script and smoke contracts**

Add `<script src="account-records-credential-parser.js"></script>` before `account-records-manager.js`, and add smoke assertions for global, factory, load order, and line count.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel\account-records-credential-parser.js
node --check sidepanel\account-records-manager.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-membership-credential-format.cjs scripts\test-sidepanel-membership-format-compat.cjs scripts\test-account-records-manager.cjs
git diff --check
git add sidepanel\account-records-credential-parser.js sidepanel\account-records-manager.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs scripts\test-account-records-manager.cjs
git commit -m "refactor: extract account records credential parser"
```

Expected: all checks pass; `account-records-manager.js` loses the credential parser block.

## Task 2: Account Display Model Split

**Files:**
- Create: `sidepanel/account-records-display-model.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`
- Test: `scripts/test-membership-results-store.cjs`
- Test: `scripts/test-sidepanel-membership-format-compat.cjs`

**Interfaces:**
- Produces:
  - `buildUpiCredentialMembershipResultLookup(items: object[]): object`
  - `sanitizeUpiCredentialMembershipDisplayRow(row: object): object`
  - `mergeUpiCredentialMembershipDisplayCredentialResult(credential: object, result: object): object`
  - `buildUpiCredentialMembershipDisplayRows(results: object): object[]`
  - `getUpiCredentialMembershipRowStatusMeta(row: object, results: object): object`
- Consumes:
  - Credential parser outputs from Task 1
  - Existing group helpers and redeem status helpers

- [ ] **Step 1: Create `SidepanelAccountRecordsDisplayModel` factory**

Use:

```javascript
(function attachSidepanelAccountRecordsDisplayModel(globalScope) {
  function createAccountRecordsDisplayModel(context = {}) {
    return {
      buildUpiCredentialMembershipResultLookup: context.buildUpiCredentialMembershipResultLookup,
    };
  }
  const api = { createAccountRecordsDisplayModel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsDisplayModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 2: Move display row functions**

Move current manager functions `buildUpiCredentialMembershipResultLookup`, `sanitizeUpiCredentialMembershipDisplayRow`, `mergeUpiCredentialMembershipDisplayCredentialResult`, `buildUpiCredentialMembershipDisplayRows`, and `getUpiCredentialMembershipRowStatusMeta`.

- [ ] **Step 3: Keep stateful access as dependencies**

Inject `getUpiCredentialMembershipCheckResults`, `isRedeemPlusDeletedDisplayRow`, `applyUpiRedeemSuccessMembershipPatch`, `buildMembershipViewModelRows`, `buildUpiCredentialMembershipDisplayRowKey`, and `getUpiCredentialMembershipRedeemProgressMeta` into the display module.

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --check sidepanel\account-records-display-model.js
node --check sidepanel\account-records-manager.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-membership-results-store.cjs scripts\test-sidepanel-membership-format-compat.cjs scripts\test-account-records-manager.cjs
git diff --check
git add sidepanel\account-records-display-model.js sidepanel\account-records-manager.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs
git commit -m "refactor: extract account records display model"
```

Expected: display row behavior unchanged; group counts and deleted tombstones still pass tests.

## Task 3: Account Flow View Split

**Files:**
- Create: `sidepanel/account-records-flow-view.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces:
  - `getUpiCredentialMembershipFlowTitle(stepKey: string, results: object): string`
  - `getUpiCredentialMembershipFlowSteps(results: object): object[]`
  - `normalizeUpiCredentialMembershipFlowStage(value: string, results: object): string`
  - `getUpiCredentialMembershipFlowStatus(stepKey: string, results: object, rows: object[]): string`
  - `getUpiCredentialMembershipFlowDetail(results: object): string`
  - `renderUpiCredentialMembershipFlow(results: object, rows: object[]): string`

- [ ] **Step 1: Move flow helper functions**

Move current functions from `getUpiCredentialMembershipFlowTitle` through `renderUpiCredentialMembershipFlow`.

- [ ] **Step 2: Inject UI dependencies**

Inject:

```javascript
{
  escapeHtml,
  compactMembershipReason,
  getMembershipStatusTitle,
  getRedeemChannelLabel,
  getChannelFailureLimitBlockedFreeRows,
  isRedeemableFreeUpiCredentialMembershipRowForChannel
}
```

- [ ] **Step 3: Verify and commit**

Run:

```powershell
node --check sidepanel\account-records-flow-view.js
node --check sidepanel\account-records-manager.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-account-records-manager.cjs scripts\test-sidepanel-workflow-status-display.cjs
git diff --check
git add sidepanel\account-records-flow-view.js sidepanel\account-records-manager.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs
git commit -m "refactor: extract account records flow view"
```

Expected: Free/UPI/IDEAL flow progress text stays unchanged.

## Task 4: Account Renderer Split

**Files:**
- Create: `sidepanel/account-records-renderer.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Produces:
  - `renderAccountRecordsPanel(currentState: object): void`
  - `renderUpiCredentialMembershipCheckResults(): void`
  - `updateHeader(allRecords: object[], filteredRecords: object[]): void`
  - `updateStats(allRecords: object[]): void`
  - `updatePagination(totalRecords: number): void`

- [ ] **Step 1: Move account history render functions**

Move `formatAccountRecordTime`, `getStatusMeta`, `getRecordSummaryText`, `getRecordTooltipText`, `createStatChip`, `updateHeader`, `updateStats`, `updateToolbarState`, `updatePagination`, `renderEmptyState`, `renderRecordList`, and `render`.

- [ ] **Step 2: Move membership result render entry**

Move `renderUpiCredentialMembershipCheckResults` and its direct HTML helpers into the renderer module.

- [ ] **Step 3: Keep manager state outside renderer**

The renderer receives `currentPage`, `activeFilter`, `selectionMode`, and selected ids through getter functions:

```javascript
{
  getCurrentPage: () => currentPage,
  getActiveFilter: () => activeFilter,
  getSelectionMode: () => selectionMode,
  isRecordSelected: (id) => selectedRecordIds.has(id)
}
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --check sidepanel\account-records-renderer.js
node --check sidepanel\account-records-manager.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-account-records-manager.cjs
git diff --check
git add sidepanel\account-records-renderer.js sidepanel\account-records-manager.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs
git commit -m "refactor: extract account records renderer"
```

Expected: sidepanel script VM load passes; no blank panel regression.

## Task 5: Account Runtime Actions Split

**Files:**
- Create: `sidepanel/account-records-membership-actions.js`
- Create: `sidepanel/account-records-redeem-actions.js`
- Modify: `sidepanel/account-records-manager.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Membership actions produce:
  - `refreshUpiCredentialMembershipCheckResults(): Promise<void>`
  - `fillFreeUpiCredentialMembershipAccessTokens(): Promise<void>`
  - `identifyFreeUpiCredentialMembershipPlus(options?: object): Promise<void>`
  - `verifyPlusUpiCredentialMembershipRows(): Promise<void>`
  - `loginUpiCredentialMembershipAccount(email: string): Promise<void>`
  - `moveUpiCredentialMembershipAccountGroup(email: string, targetStatus: string): Promise<void>`
- Redeem actions produce:
  - `startUpiCredentialMembershipFreeRedeem(inputCredentials?: object[] | null, options?: object): Promise<void>`
  - `startUpiCredentialMembershipAllRedeem(): Promise<void>`
  - `startSingleUpiCredentialMembershipFreeRedeem(email: string): Promise<void>`
  - `refreshUpiCredentialMembershipRedeemStatuses(): Promise<void>`
  - `cancelUpiCredentialMembershipRedeemJob(email: string, cdkey: string, channel: string): Promise<void>`

- [ ] **Step 1: Extract membership-only runtime calls**

Move check, AT supplement, login, move group, plus verify, import-related runtime message functions to `account-records-membership-actions.js`.

- [ ] **Step 2: Extract redeem runtime calls**

Move redeem start, all redeem, single redeem, redeem status refresh, cancel job, and channel post-refresh functions to `account-records-redeem-actions.js`.

- [ ] **Step 3: Keep manager public API unchanged**

`account-records-manager.js` still returns:

```javascript
{
  bindEvents,
  clearRecords,
  closePanel,
  deleteSelectedRecords,
  exportUpiCredentialBackupTextFile,
  exportUpiRedeemSuccessEmailTextFile,
  openPanel,
  reloadUpiCredentialMembershipAfterRuntimeImport,
  render,
  reset,
  resumeFreeRedeemAfterCdkImport,
  setSelectionMode,
  showUpiCredentialBackupText,
  summarizeAccountRunHistory,
  toggleSelectionMode
}
```

- [ ] **Step 4: Verify and commit**

Run:

```powershell
node --check sidepanel\account-records-membership-actions.js
node --check sidepanel\account-records-redeem-actions.js
node --check sidepanel\account-records-manager.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-account-records-manager.cjs scripts\test-membership-view-model.cjs scripts\test-membership-redeem-progress.cjs scripts\test-redeem-cdkey-usage.cjs
git diff --check
git add sidepanel\account-records-membership-actions.js sidepanel\account-records-redeem-actions.js sidepanel\account-records-manager.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs
git commit -m "refactor: extract account records runtime actions"
```

Expected: manager becomes facade under 900 lines after Task 5 or Task 6.

## Task 6: Sidepanel Main Bootstrap Split

**Files:**
- Create: `sidepanel/app-state.js`
- Create: `sidepanel/settings-controller.js`
- Create: `sidepanel/runtime-message-controller.js`
- Create: `sidepanel/sidepanel-bootstrap.js`
- Modify: `sidepanel/sidepanel.js`
- Modify: `sidepanel/sidepanel.html`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- `SidepanelAppState.createSidepanelAppState(initialState?: object)`
- `SidepanelSettingsController.createSettingsController(deps)`
- `SidepanelRuntimeMessageController.createRuntimeMessageController(deps)`
- `SidepanelBootstrap.createSidepanelApp(deps).start(): Promise<void>`

- [ ] **Step 1: Move mutable state declarations**

Move top-level sidepanel mutable state from `sidepanel.js` into `app-state.js`. Keep access through getters/setters:

```javascript
const appState = SidepanelAppState.createSidepanelAppState();
appState.getLatestState();
appState.patchLatestState({ key: value });
```

- [ ] **Step 2: Move settings hydration and save**

Move settings read/write and UI sync code into `settings-controller.js`.

- [ ] **Step 3: Move runtime message listener**

Move `chrome.runtime.onMessage` dispatch logic into `runtime-message-controller.js`.

- [ ] **Step 4: Add bootstrap facade**

`sidepanel.js` should only build dependencies and call:

```javascript
SidepanelBootstrap.createSidepanelApp({
  chromeApi: chrome,
  document,
  window,
}).start();
```

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check sidepanel\app-state.js
node --check sidepanel\settings-controller.js
node --check sidepanel\runtime-message-controller.js
node --check sidepanel\sidepanel-bootstrap.js
node --check sidepanel\sidepanel.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-sidepanel-*.cjs scripts\test-account-records-manager.cjs
git diff --check
git add sidepanel\app-state.js sidepanel\settings-controller.js sidepanel\runtime-message-controller.js sidepanel\sidepanel-bootstrap.js sidepanel\sidepanel.js sidepanel\sidepanel.html scripts\audit-smoke-tests.mjs
git commit -m "refactor: split sidepanel bootstrap"
```

Expected: `sidepanel.js` under 1500 lines.

## Task 7: Background Message Router Split

**Files:**
- Create: `background/routes/settings-routes.js`
- Create: `background/routes/account-record-routes.js`
- Create: `background/routes/email-pool-routes.js`
- Create: `background/routes/passkey-routes.js`
- Modify: `background.js`
- Modify: `background/message-router.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- Each route module exports:

```javascript
globalThis.MultiPageBackgroundSettingsRoutes = {
  registerSettingsRoutes(router, deps) {}
};
```

- [ ] **Step 1: Create route registration contract**

Add helper in `message-router.js`:

```javascript
function registerExternalRoutes(routeModule, name) {
  if (!routeModule || typeof routeModule.register !== 'function') {
    throw new Error(`${name} route module is not loaded.`);
  }
  routeModule.register(routeRegistry, deps);
}
```

- [ ] **Step 2: Move settings routes**

Move settings save/import/export message cases from `message-router.js` to `settings-routes.js`.

- [ ] **Step 3: Move account record routes**

Move account history and account status message cases to `account-record-routes.js`.

- [ ] **Step 4: Move email pool routes**

Move custom email pool and provider pool routes to `email-pool-routes.js`.

- [ ] **Step 5: Move passkey routes**

Move passkey enable/login and passkey AT supplement routes to `passkey-routes.js`.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background\message-router.js
node --check background\routes\settings-routes.js
node --check background\routes\account-record-routes.js
node --check background\routes\email-pool-routes.js
node --check background\routes\passkey-routes.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-background-runtime-listeners.cjs scripts\test-background-settings-transfer.cjs scripts\test-passkey-login-core.cjs
git diff --check
git add background.js background\message-router.js background\routes\settings-routes.js background\routes\account-record-routes.js background\routes\email-pool-routes.js background\routes\passkey-routes.js scripts\audit-smoke-tests.mjs
git commit -m "refactor: split background message routes"
```

Expected: `background/message-router.js` under 700 lines.

## Task 8: Membership Checker Service Split

**Files:**
- Create: `background/membership/trial-eligibility-service.js`
- Create: `background/membership/membership-result-sync.js`
- Create: `background/membership/access-token-supplement-service.js`
- Create: `background/membership/free-pool-service.js`
- Create: `background/membership/redeem-candidate-service.js`
- Modify: `background.js`
- Modify: `background/upi-credential-membership-checker.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- `MultiPageTrialEligibilityService.createTrialEligibilityService(deps)`
- `MultiPageMembershipResultSync.createMembershipResultSync(deps)`
- `MultiPageAccessTokenSupplementService.createAccessTokenSupplementService(deps)`
- `MultiPageFreePoolService.createFreePoolService(deps)`
- `MultiPageRedeemCandidateService.createRedeemCandidateService(deps)`

- [ ] **Step 1: Extract trial eligibility service**

Move trial eligibility API helpers and classification rules. Preserve tests in `scripts/test-trial-eligibility-api.cjs`.

- [ ] **Step 2: Extract result sync service**

Move save/merge/update/group/tombstone logic that writes `upiCredentialMembershipCheckResults`.

- [ ] **Step 3: Extract AT supplement service**

Move password/2FA/passkey/no-email-code AT supplement flow and its backend response normalization.

- [ ] **Step 4: Extract free pool service**

Move email pool manual eligibility check, used marker handling, no-trial marker handling, and “not enter Free when no trial” behavior.

- [ ] **Step 5: Extract redeem candidate service**

Move UPI/IDEAL candidate decision logic, `pm-unavailable` classification, cross-region payment blocking, daily limit, and failure count decisions.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background\upi-credential-membership-checker.js
node --check background\membership\trial-eligibility-service.js
node --check background\membership\membership-result-sync.js
node --check background\membership\access-token-supplement-service.js
node --check background\membership\free-pool-service.js
node --check background\membership\redeem-candidate-service.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-trial-eligibility-api.cjs scripts\test-membership-result-state.cjs scripts\test-membership-results-store.cjs scripts\test-passkey-login-core.cjs scripts\test-redeem-channel-state.cjs
git diff --check
git add background.js background\upi-credential-membership-checker.js background\membership\trial-eligibility-service.js background\membership\membership-result-sync.js background\membership\access-token-supplement-service.js background\membership\free-pool-service.js background\membership\redeem-candidate-service.js scripts\audit-smoke-tests.mjs
git commit -m "refactor: split membership checker services"
```

Expected: `background/upi-credential-membership-checker.js` under 1200 lines.

## Task 9: UPI Redeem Executor Split

**Files:**
- Create: `background/steps/upi-redeem/session-material.js`
- Create: `background/steps/upi-redeem/free-entry.js`
- Create: `background/steps/upi-redeem/channel-submission.js`
- Create: `background/steps/upi-redeem/status-polling.js`
- Create: `background/steps/upi-redeem/finalize.js`
- Modify: `background/steps/upi-redeem.js`
- Modify: `background/bootstrap/signup-executor-registry.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- `createUpiRedeemSessionMaterial(deps)`
- `createUpiRedeemFreeEntry(deps)`
- `createUpiRedeemChannelSubmission(deps)`
- `createUpiRedeemStatusPolling(deps)`
- `createUpiRedeemFinalize(deps)`

- [ ] **Step 1: Extract session material**

Move session email, AT, password, 2FA, passkey, verification URL material extraction.

- [ ] **Step 2: Extract Free entry**

Move trial eligibility gate, “有试用资格才入 Free”, and “无资格只标记邮箱池” logic.

- [ ] **Step 3: Extract channel submission**

Move UPI/IDEAL CDK selection, backend submit payload, and channel-specific failure handling.

- [ ] **Step 4: Extract status polling**

Move submitted remote status polling, 5-second refresh, skip-auto-retry, and stop-on-user-stop rules.

- [ ] **Step 5: Extract finalize**

Move logs, custom email pool used marker, auto-run continuation, and final summary fields.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background\steps\upi-redeem.js
node --check background\steps\upi-redeem\session-material.js
node --check background\steps\upi-redeem\free-entry.js
node --check background\steps\upi-redeem\channel-submission.js
node --check background\steps\upi-redeem\status-polling.js
node --check background\steps\upi-redeem\finalize.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-signup-executor-registry.cjs scripts\test-trial-eligibility-api.cjs scripts\test-upi-redeem-api-client.cjs scripts\test-redeem-cdkey-usage.cjs
git diff --check
git add background\steps\upi-redeem.js background\steps\upi-redeem\session-material.js background\steps\upi-redeem\free-entry.js background\steps\upi-redeem\channel-submission.js background\steps\upi-redeem\status-polling.js background\steps\upi-redeem\finalize.js background\bootstrap\signup-executor-registry.js scripts\audit-smoke-tests.mjs
git commit -m "refactor: split upi redeem executor"
```

Expected: `background/steps/upi-redeem.js` under 1200 lines.

## Task 10: Verification Flow Split

**Files:**
- Create: `background/verification/assurivo-time.js`
- Create: `background/verification/verification-keywords.js`
- Create: `background/verification/assurivo-feed-client.js`
- Create: `background/verification/code-extractor.js`
- Create: `background/verification/resend-controller.js`
- Modify: `background.js`
- Modify: `background/verification-flow.js`
- Modify: `background/steps/fetch-signup-code.js`
- Modify: `background/steps/set-gpt-password.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- `parseAssurivoTimestamp(value: string): number`
- `isVerificationMailText(value: string): boolean`
- `extractStrictVerificationCodeFromBody(body: string): object`
- `fetchAssurivoFeed(options: object): Promise<object[]>`
- `createVerificationResendController(deps)`

- [ ] **Step 1: Extract Assurivo time parser**

Move UTC epoch ms parsing, Assurivo UTC+8 fallback, display log formatting.

- [ ] **Step 2: Extract verification keywords**

Move ChatGPT/OpenAI semantic keyword lists for English, Japanese, Hindi.

- [ ] **Step 3: Extract code extractor**

Move strict body-only 6-digit extraction and HTML body normalization.

- [ ] **Step 4: Extract feed client**

Move feed.php/open.php fetch, JSON response handling, retryable error classification.

- [ ] **Step 5: Extract resend controller**

Move resend button timing, attempt counters, old-code exclusion, resend logs.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
node --check background\verification-flow.js
node --check background\verification\assurivo-time.js
node --check background\verification\verification-keywords.js
node --check background\verification\assurivo-feed-client.js
node --check background\verification\code-extractor.js
node --check background\verification\resend-controller.js
node --check background\steps\fetch-signup-code.js
node --check background\steps\set-gpt-password.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-auth-page-detectors.cjs scripts\test-signup-executor-registry.cjs
git diff --check
git add background.js background\verification-flow.js background\verification\assurivo-time.js background\verification\verification-keywords.js background\verification\assurivo-feed-client.js background\verification\code-extractor.js background\verification\resend-controller.js background\steps\fetch-signup-code.js background\steps\set-gpt-password.js scripts\audit-smoke-tests.mjs
git commit -m "refactor: split verification flow services"
```

Expected: Hindi/English/Japanese verification behavior unchanged; `background/verification-flow.js` under 900 lines.

## Task 11: Auto Run Controller Split

**Files:**
- Create: `background/auto-run/session-runner.js`
- Create: `background/auto-run/retry-policy.js`
- Create: `background/auto-run/log-snapshot.js`
- Create: `background/auto-run/summary-builder.js`
- Modify: `background/auto-run-controller.js`
- Modify: `scripts/audit-smoke-tests.mjs`

**Interfaces:**
- `createAutoRunSessionRunner(deps)`
- `createAutoRunRetryPolicy(deps)`
- `createAutoRunLogSnapshot(deps)`
- `createAutoRunSummaryBuilder(deps)`

- [ ] **Step 1: Extract retry policy**

Move retryable failure classification, stop/continue decisions, max retry handling.

- [ ] **Step 2: Extract log snapshot**

Move per-round log snapshot preservation and previous-round log retrieval.

- [ ] **Step 3: Extract summary builder**

Move final success/failure/unfinished summary generation.

- [ ] **Step 4: Extract session runner**

Move per-round node execution loop and state transitions.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
node --check background\auto-run-controller.js
node --check background\auto-run\session-runner.js
node --check background\auto-run\retry-policy.js
node --check background\auto-run\log-snapshot.js
node --check background\auto-run\summary-builder.js
node scripts\audit-smoke-tests.mjs
node --test scripts\test-background-auto-run-status.cjs scripts\test-background-runtime-listeners.cjs
git diff --check
git add background\auto-run-controller.js background\auto-run\session-runner.js background\auto-run\retry-policy.js background\auto-run\log-snapshot.js background\auto-run\summary-builder.js scripts\audit-smoke-tests.mjs
git commit -m "refactor: split auto run controller"
```

Expected: stop request, previous round log snapshot, retry disabled behavior unchanged.

## Task 12: Final Contract Audit And Size Gates

**Files:**
- Modify: `scripts/audit-smoke-tests.mjs`
- Modify: `AGENTS.md` if module map needs updating
- Create: `docs/architecture/module-map.md`

**Interfaces:**
- Produces `docs/architecture/module-map.md` with module ownership table.

- [ ] **Step 1: Add final size gates**

Set smoke size guards:

```javascript
assertFileLineCountAtMost('sidepanel/sidepanel.js', 1500, 'sidepanel entrypoint size guard');
assertFileLineCountAtMost('sidepanel/account-records-manager.js', 900, 'account records manager facade size guard');
assertFileLineCountAtMost('background/message-router.js', 700, 'message router facade size guard');
assertFileLineCountAtMost('background/upi-credential-membership-checker.js', 1200, 'membership checker facade size guard');
assertFileLineCountAtMost('background/steps/upi-redeem.js', 1200, 'UPI redeem facade size guard');
assertFileLineCountAtMost('background/verification-flow.js', 900, 'verification flow facade size guard');
```

- [ ] **Step 2: Add module map doc**

Create `docs/architecture/module-map.md` with these sections:

```markdown
# Module Map

## Sidepanel
- sidepanel/sidepanel.js: compatibility entrypoint
- sidepanel/sidepanel-bootstrap.js: app startup and controller construction
- sidepanel/account-records-manager.js: account records facade

## Background
- background/message-router.js: route registry facade
- background/upi-credential-membership-checker.js: membership workflow facade
- background/steps/upi-redeem.js: UPI redeem executor facade
- background/verification-flow.js: verification facade
```

- [ ] **Step 3: Run final verification**

Run:

```powershell
node scripts\audit-smoke-tests.mjs
node --test scripts\test-*.cjs
git diff --check
```

Expected: all tests pass; no source file outside explicitly allowed legacy files exceeds target size.

- [ ] **Step 4: Commit final audit**

```powershell
git add scripts\audit-smoke-tests.mjs docs\architecture\module-map.md AGENTS.md
git commit -m "docs: add module map and split size gates"
```

## Execution Order

1. Task 1 Account Credential Parser Split
2. Task 2 Account Display Model Split
3. Task 3 Account Flow View Split
4. Task 4 Account Renderer Split
5. Task 5 Account Runtime Actions Split
6. Task 6 Sidepanel Main Bootstrap Split
7. Task 7 Background Message Router Split
8. Task 8 Membership Checker Service Split
9. Task 9 UPI Redeem Executor Split
10. Task 10 Verification Flow Split
11. Task 11 Auto Run Controller Split
12. Task 12 Final Contract Audit And Size Gates

## Review Gates

- Gate A after Task 5: account records UI still renders and import/export formats stay byte-compatible.
- Gate B after Task 6: sidepanel loads without blank screen; run VM sidepanel script order check.
- Gate C after Task 8: manual trial eligibility and Free/no-trial marking remain unchanged.
- Gate D after Task 9: UPI/IDEAL redemption, `pm-unavailable`, and status polling remain unchanged.
- Gate E after Task 10: step 4 and step 6 verification code retrieval still work for English/Japanese/Hindi.
- Gate F after Task 12: final module map and size guards enforce the new structure.

## Self-Review

- Spec coverage: The plan covers current large files in sidepanel, account records, router, membership checker, UPI redeem, verification flow, and auto-run.
- Placeholder scan: No task uses open-ended “implement later” language; each task lists exact files, interfaces, commands, and commit.
- Type consistency: Factory names use existing global namespace patterns and return plain objects with explicit function names.
