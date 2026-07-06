# Codebase Decomposition Phase Three Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue reducing `background.js` and `sidepanel/sidepanel.js` while first fixing the small fallback-compatibility risk introduced by the previous auto-run normalizer extraction.

**Architecture:** Keep the existing Chrome MV3 no-bundler architecture. New browser files expose globals on `self.*` or `window.*`, and are loaded by ordered `importScripts(...)` or ordered `<script>` tags. Each task preserves existing wrapper function names in composition roots so current callers keep working while logic moves into focused modules.

**Tech Stack:** Plain JavaScript, Chrome Extension MV3 service worker, side panel DOM scripts, CommonJS `node:test` scripts, `node --check`, existing audit scripts.

---

## Execution Results

| Task | Result |
| --- | --- |
| Sidepanel normalizer fallback | Added regression tests and preserved legacy fallback defaults. |
| Background auto-run status | Extracted status payload and phase predicates into `background/bootstrap/auto-run-status.js`. |
| Sidepanel auto-run state | Extracted current auto-run state sync and pending run-count gate into `sidepanel/auto-run-state.js`; preserved nullish phase fallback semantics. |

## Current State

| File | Lines | Note |
| --- | ---: | --- |
| `background.js` | 15,901 | Still mixes auto-run status broadcasting, runtime orchestration, provider glue, and startup wiring. |
| `sidepanel/sidepanel.js` | 10,659 | Still mixes auto-run state sync, settings/event wiring, config actions, and top-level message handling. |
| `background/upi-credential-membership-checker.js` | 7,497 | Large but under current smoke warning threshold; leave for a later membership-focused pass. |
| `content/signup-page.js` | 6,820 | Large but already split into page detector/orchestrator helpers; leave for later. |

## File Structure For This Phase

Create or extend these focused modules:

- `scripts/test-sidepanel-auto-run-normalizers.cjs`: regression tests for sidepanel numeric normalizer fallback semantics.
- `sidepanel/auto-run-normalizers.js`: keep all sidepanel auto-run numeric setting normalizers here; preserve old fallback behavior exactly.
- `background/bootstrap/auto-run-status.js`: build and broadcast auto-run status payloads, plus auto-run phase predicates.
- `scripts/test-background-auto-run-status.cjs`: direct unit tests for background auto-run status payload and phase predicates.
- `sidepanel/auto-run-state.js`: sidepanel auto-run state model, pending start run-count gate, phase predicates, label generation, and source sync policy.
- `scripts/test-sidepanel-auto-run-state.cjs`: direct unit tests for sidepanel auto-run state sync and pending run-count behavior.
- `docs/superpowers/plans/2026-07-06-codebase-decomposition-phase-three-plan.md`: execution notes and final size snapshot.

Existing composition roots remain:

- `background.js`: imports modules, creates managers, and keeps compatibility wrappers.
- `sidepanel/sidepanel.js`: creates managers, delegates to them, and keeps compatibility wrappers.
- `sidepanel/sidepanel.html`: preserves ordered script loading.
- `scripts/audit-smoke-tests.mjs`: guards new modules and ordered loads.

## Non-Goals

- Do not change registration, trial eligibility, UPI/IDEAL redemption, Passkey/2FA route behavior, Free/Plus grouping, export formats, or GitHub release behavior.
- Do not introduce bundling, ES module conversion, TypeScript, or build tooling.
- Do not remove compatibility wrapper functions in `background.js` or `sidepanel/sidepanel.js` during this phase.

---

### Task 1: Lock And Fix Sidepanel Auto-Run Normalizer Fallbacks

**Files:**
- Create: `scripts/test-sidepanel-auto-run-normalizers.cjs`
- Modify: `sidepanel/auto-run-normalizers.js`

- [ ] **Step 1: Add regression tests for old fallback behavior**

Create `scripts/test-sidepanel-auto-run-normalizers.cjs` with exactly this content:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAutoRunNormalizers;
const normalizerModule = require('../sidepanel/auto-run-normalizers.js');

const normalizers = normalizerModule.createAutoRunNormalizers({
  autoDelayDefaultMinutes: 30,
  autoDelayMaxMinutes: 1440,
  autoDelayMinMinutes: 1,
  autoRunThreadIntervalDefaultMinutes: 0,
  autoRunThreadIntervalMaxMinutes: 1440,
  autoRunThreadIntervalMinMinutes: 0,
  autoStepDelayDefaultSeconds: 10,
  autoStepDelayMaxSeconds: 600,
  autoStepDelayMinSeconds: 0,
});

test('verification poll attempts keep legacy fallback defaults', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('', 6), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('bad', 6), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('', 0), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('bad', 0), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('0', 6), 1);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('99', 6), 60);
});

test('verification poll interval keeps legacy fallback defaults', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('', 5), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('bad', 5), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('', 0), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('bad', 0), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('0', 5), 1);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('99', 5), 60);
});

test('resend attempts and wait seconds keep zero-capable legacy fallback behavior', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('bad', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('99', 1), 10);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('bad', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('999', 20), 300);
});
```

- [ ] **Step 2: Run the new test to verify it exposes the fallback gap**

Run:

```powershell
node --test scripts/test-sidepanel-auto-run-normalizers.cjs
```

Expected before the fix: at least the two cases with fallback `0` for poll attempts/interval fail because they return `1` instead of `6` / `5`.

- [ ] **Step 3: Preserve legacy fallback defaults in the normalizer module**

In `sidepanel/auto-run-normalizers.js`, replace the helper and the two polling functions with this implementation shape:

```javascript
function normalizeBoundedInteger(value, fallback, min, max, options = {}) {
  const rawValue = String(value ?? '').trim();
  const defaultFallback = options.defaultFallback;
  const fallbackSource = Number.isFinite(Number(fallback)) && Number(fallback) !== 0
    ? fallback
    : (defaultFallback !== undefined ? defaultFallback : fallback);
  const fallbackValue = Math.min(max, Math.max(min, Math.floor(Number(fallbackSource) || 0)));
  if (!rawValue && options.emptyAsFallback !== false) {
    return fallbackValue;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(max, Math.max(min, Math.floor(numeric)));
}

function normalizeRemovedContactVerificationPollAttempts(value, fallback = 6) {
  return normalizeBoundedInteger(value, fallback, 1, 60, { defaultFallback: 6 });
}

function normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback = 5) {
  return normalizeBoundedInteger(value, fallback, 1, 60, { defaultFallback: 5 });
}
```

Keep the other normalizer function names and exports unchanged.

- [ ] **Step 4: Verify the fix**

Run:

```powershell
node --check sidepanel/auto-run-normalizers.js
node --test scripts/test-sidepanel-auto-run-normalizers.cjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; total test count increases by 3 because of the new file.

- [ ] **Step 5: Commit**

```powershell
git add sidepanel/auto-run-normalizers.js scripts/test-sidepanel-auto-run-normalizers.cjs
git commit -m "test: lock sidepanel auto-run normalizers"
```

### Task 2: Extract Background Auto-Run Status Payload Helpers

**Files:**
- Create: `background/bootstrap/auto-run-status.js`
- Create: `scripts/test-background-auto-run-status.cjs`
- Modify: `background.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Add unit tests for status payload and phase predicates**

Create `scripts/test-background-auto-run-status.cjs` with exactly this content:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageBackgroundAutoRunStatus;
const statusModule = require('../background/bootstrap/auto-run-status.js');

const manager = statusModule.createAutoRunStatusManager({
  getCurrentAutoRunRuntime: () => ({ currentRun: 2, totalRuns: 5, attemptRun: 1, sessionId: 88 }),
  normalizeAutoRunSessionId: (value) => Math.max(0, Math.floor(Number(value) || 0)),
});

test('builds running status payload with runtime fallbacks', () => {
  assert.deepEqual(manager.getAutoRunStatusPayload('running'), {
    autoRunning: true,
    autoRunPhase: 'running',
    autoRunCurrentRun: 2,
    autoRunTotalRuns: 5,
    autoRunAttemptRun: 1,
    autoRunSessionId: 88,
    scheduledAutoRunAt: null,
    autoRunCountdownAt: null,
    autoRunCountdownTitle: '',
    autoRunCountdownNote: '',
  });
});

test('normalizes explicit schedule and countdown values', () => {
  const payload = manager.getAutoRunStatusPayload('scheduled', {
    currentRun: 0,
    totalRuns: 3,
    attemptRun: 0,
    sessionId: '42',
    scheduledAt: '1000',
    countdownAt: '2000',
    countdownTitle: '标题',
    countdownNote: '说明',
  });
  assert.equal(payload.autoRunning, true);
  assert.equal(payload.autoRunSessionId, 42);
  assert.equal(payload.scheduledAutoRunAt, 1000);
  assert.equal(payload.autoRunCountdownAt, 2000);
  assert.equal(payload.autoRunCountdownTitle, '标题');
  assert.equal(payload.autoRunCountdownNote, '说明');
});

test('phase predicates match existing auto-run lock behavior', () => {
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'running' }), true);
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'waiting_step' }), true);
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'retrying' }), true);
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'waiting_interval' }), true);
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'scheduled' }), false);
  assert.equal(manager.isAutoRunPausedState({ autoRunning: true, autoRunPhase: 'waiting_email' }), true);
});
```

- [ ] **Step 2: Create the status helper module**

Create `background/bootstrap/auto-run-status.js` with this public shape:

```javascript
(function attachBackgroundAutoRunStatus(globalScope) {
  const ACTIVE_PHASES = new Set(['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval']);
  const LOCKED_PHASES = new Set(['running', 'waiting_step', 'retrying', 'waiting_interval']);

  function createAutoRunStatusManager(deps = {}) {
    const {
      getCurrentAutoRunRuntime = () => ({ currentRun: 0, totalRuns: 1, attemptRun: 0, sessionId: 0 }),
      normalizeAutoRunSessionId = (value) => Math.max(0, Math.floor(Number(value) || 0)),
    } = deps;

    function getAutoRunStatusPayload(phase, payload = {}) {
      const runtime = getCurrentAutoRunRuntime() || {};
      const normalizedPayload = {
        ...payload,
        currentRun: payload.currentRun ?? runtime.currentRun ?? 0,
        totalRuns: payload.totalRuns ?? runtime.totalRuns ?? 1,
        attemptRun: payload.attemptRun ?? runtime.attemptRun ?? 0,
        sessionId: payload.sessionId ?? payload.autoRunSessionId ?? runtime.sessionId ?? 0,
      };
      return {
        autoRunning: ACTIVE_PHASES.has(phase),
        autoRunPhase: phase,
        autoRunCurrentRun: normalizedPayload.currentRun ?? 0,
        autoRunTotalRuns: normalizedPayload.totalRuns ?? 1,
        autoRunAttemptRun: normalizedPayload.attemptRun ?? 0,
        autoRunSessionId: normalizeAutoRunSessionId(normalizedPayload.sessionId),
        scheduledAutoRunAt: Number.isFinite(Number(normalizedPayload.scheduledAt)) ? Number(normalizedPayload.scheduledAt) : null,
        autoRunCountdownAt: Number.isFinite(Number(normalizedPayload.countdownAt)) ? Number(normalizedPayload.countdownAt) : null,
        autoRunCountdownTitle: normalizedPayload.countdownTitle === undefined ? '' : String(normalizedPayload.countdownTitle || ''),
        autoRunCountdownNote: normalizedPayload.countdownNote === undefined ? '' : String(normalizedPayload.countdownNote || ''),
      };
    }

    function isAutoRunLockedState(state = {}) {
      return Boolean(state.autoRunning) && LOCKED_PHASES.has(state.autoRunPhase);
    }

    function isAutoRunPausedState(state = {}) {
      return Boolean(state.autoRunning) && state.autoRunPhase === 'waiting_email';
    }

    function isAutoRunScheduledState(state = {}, options = {}) {
      const plan = typeof options.getPendingAutoRunTimerPlan === 'function'
        ? options.getPendingAutoRunTimerPlan(state)
        : null;
      const scheduledAt = state.scheduledAutoRunAt === null ? null : Number(state.scheduledAutoRunAt);
      return Boolean(state.autoRunning)
        && state.autoRunPhase === 'scheduled'
        && Number.isFinite(scheduledAt)
        && (!options.scheduledStartKind || plan?.kind === options.scheduledStartKind);
    }

    return {
      getAutoRunStatusPayload,
      isAutoRunLockedState,
      isAutoRunPausedState,
      isAutoRunScheduledState,
    };
  }

  const api = { createAutoRunStatusManager };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.MultiPageBackgroundAutoRunStatus = api;
})(typeof self !== 'undefined' ? self : globalThis);
```

- [ ] **Step 3: Load the helper before `background.js` uses it**

In `background.js`, add this entry in `importScripts(...)` after `background/bootstrap/auto-run-timer-plan.js`:

```javascript
'background/bootstrap/auto-run-status.js',
```

- [ ] **Step 4: Create a manager and keep compatibility wrappers**

In `background.js`, create:

```javascript
const autoRunStatusManager = self.MultiPageBackgroundAutoRunStatus.createAutoRunStatusManager({
  getCurrentAutoRunRuntime: () => ({
    currentRun: autoRunCurrentRun,
    totalRuns: autoRunTotalRuns,
    attemptRun: autoRunAttemptRun,
    sessionId: getCurrentAutoRunSessionId(),
  }),
  normalizeAutoRunSessionId: (value) => normalizeAutoRunSessionId(value),
});
```

Then replace the bodies of these existing functions with wrappers:

```javascript
function getAutoRunStatusPayload(phase, payload = {}) {
  if (typeof loggingStatus !== 'undefined' && loggingStatus?.getAutoRunStatusPayload) {
    const runtime = {
      currentRun: payload.currentRun ?? autoRunCurrentRun,
      totalRuns: payload.totalRuns ?? autoRunTotalRuns,
      attemptRun: payload.attemptRun ?? autoRunAttemptRun,
      sessionId: payload.sessionId ?? payload.autoRunSessionId ?? getCurrentAutoRunSessionId(),
    };
    return loggingStatus.getAutoRunStatusPayload(phase, runtime);
  }
  return autoRunStatusManager.getAutoRunStatusPayload(phase, payload);
}

function isAutoRunLockedState(state) {
  return autoRunStatusManager.isAutoRunLockedState(state);
}

function isAutoRunPausedState(state) {
  return autoRunStatusManager.isAutoRunPausedState(state);
}

function isAutoRunScheduledState(state) {
  return autoRunStatusManager.isAutoRunScheduledState(state, {
    getPendingAutoRunTimerPlan,
    scheduledStartKind: AUTO_RUN_TIMER_KIND_SCHEDULED_START,
  });
}
```

Leave `broadcastAutoRunStatus(...)` in `background.js` for this task; this keeps the first status extraction small and reversible.

- [ ] **Step 5: Add smoke checks**

In `scripts/audit-smoke-tests.mjs`:

- Add `background/bootstrap/auto-run-status.js` to `checkCoreFiles()`.
- Add `const autoRunStatus = readText('background/bootstrap/auto-run-status.js');` in `checkStaticContracts()`.
- Add these assertions:

```javascript
assertIncludes(background, "'background/bootstrap/auto-run-status.js'", 'background auto-run status script load');
assertIncludes(autoRunStatus, 'MultiPageBackgroundAutoRunStatus', 'background auto-run status global');
assertIncludes(autoRunStatus, 'createAutoRunStatusManager', 'background auto-run status factory');
assertIncludes(autoRunStatus, 'isAutoRunLockedState', 'background auto-run locked predicate');
assertFileLineCountAtMost('background/bootstrap/auto-run-status.js', 220, 'auto-run status size guard');
```

- [ ] **Step 6: Verify**

Run:

```powershell
node --check background/bootstrap/auto-run-status.js
node --check background.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-background-auto-run-status.cjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; smoke warnings remain only for `background.js` and `sidepanel/sidepanel.js` over 8,000 lines.

- [ ] **Step 7: Commit**

```powershell
git add background.js background/bootstrap/auto-run-status.js scripts/audit-smoke-tests.mjs scripts/test-background-auto-run-status.cjs
git commit -m "refactor: extract background auto-run status helpers"
```

### Task 3: Extract Sidepanel Auto-Run State Model

**Files:**
- Create: `sidepanel/auto-run-state.js`
- Create: `scripts/test-sidepanel-auto-run-state.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [ ] **Step 1: Add tests for the state model**

Create `scripts/test-sidepanel-auto-run-state.cjs` with exactly this content:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAutoRunState;
const stateModule = require('../sidepanel/auto-run-state.js');

test('syncs auto-run state from background payload aliases', () => {
  const model = stateModule.createAutoRunStateModel({ now: () => 1000 });
  const state = model.syncAutoRunState({
    autoRunning: true,
    autoRunPhase: 'waiting_step',
    autoRunCurrentRun: 2,
    autoRunTotalRuns: 5,
    autoRunAttemptRun: 3,
    scheduledAutoRunAt: 2000,
    autoRunCountdownAt: 3000,
    autoRunCountdownTitle: '标题',
    autoRunCountdownNote: '说明',
  });
  assert.deepEqual(state, {
    autoRunning: true,
    phase: 'waiting_step',
    currentRun: 2,
    totalRuns: 5,
    attemptRun: 3,
    scheduledAt: 2000,
    countdownAt: 3000,
    countdownTitle: '标题',
    countdownNote: '说明',
  });
  assert.equal(model.isAutoRunLockedPhase(), true);
  assert.equal(model.isAutoRunWaitingStepPhase(), true);
});

test('pending start run count blocks mismatched early status sync', () => {
  const model = stateModule.createAutoRunStateModel({ now: () => 1000 });
  model.registerPendingAutoRunStartRunCount(10);
  assert.equal(model.shouldSyncRunCountFromAutoRunSource({ autoRunning: true, autoRunTotalRuns: 2 }), false);
  assert.equal(model.shouldSyncRunCountFromAutoRunSource({ autoRunning: true, autoRunTotalRuns: 10 }), true);
  assert.equal(model.getPendingAutoRunStartRunCount(), 0);
});

test('auto-run labels match scheduled and retry attempts', () => {
  const model = stateModule.createAutoRunStateModel({ now: () => 1000 });
  assert.equal(model.getAutoRunLabel({ phase: 'scheduled', totalRuns: 3 }), ' (3轮)');
  assert.equal(model.getAutoRunLabel({ phase: 'running', currentRun: 2, totalRuns: 5, attemptRun: 3 }), ' (2/5 · 尝试3)');
  assert.equal(model.getAutoRunLabel({ phase: 'running', currentRun: 1, totalRuns: 1, attemptRun: 2 }), ' (尝试2)');
});
```

- [ ] **Step 2: Create the model module**

Create `sidepanel/auto-run-state.js` with this public API:

```javascript
(function attachSidepanelAutoRunState(globalScope) {
  const ACTIVE_PHASES = new Set(['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval']);
  const LOCKED_PHASES = new Set(['running', 'waiting_step', 'retrying', 'waiting_interval']);

  function createDefaultAutoRunState() {
    return {
      autoRunning: false,
      phase: 'idle',
      currentRun: 0,
      totalRuns: 1,
      attemptRun: 0,
      scheduledAt: null,
      countdownAt: null,
      countdownTitle: '',
      countdownNote: '',
    };
  }

  function hasOwnStateValue(source, key) {
    return Object.prototype.hasOwnProperty.call(source, key);
  }

  function readAutoRunStateValue(source, keys, fallback) {
    for (const key of keys) {
      if (hasOwnStateValue(source, key)) {
        return source[key];
      }
    }
    return fallback;
  }

  function normalizePendingAutoRunStartRunCount(value) {
    const numeric = Math.floor(Number(value) || 0);
    return numeric > 0 ? numeric : 0;
  }

  function createAutoRunStateModel(options = {}) {
    const now = typeof options.now === 'function' ? options.now : () => Date.now();
    let currentAutoRun = createDefaultAutoRunState();
    let pendingAutoRunStartTotalRuns = 0;
    let pendingAutoRunStartExpiresAt = 0;

    function getAutoRunState() {
      return { ...currentAutoRun };
    }

    function registerPendingAutoRunStartRunCount(totalRuns) {
      pendingAutoRunStartTotalRuns = normalizePendingAutoRunStartRunCount(totalRuns);
      pendingAutoRunStartExpiresAt = pendingAutoRunStartTotalRuns > 0 ? now() + 30000 : 0;
    }

    function clearPendingAutoRunStartRunCount() {
      pendingAutoRunStartTotalRuns = 0;
      pendingAutoRunStartExpiresAt = 0;
    }

    function getPendingAutoRunStartRunCount() {
      if (pendingAutoRunStartTotalRuns > 0 && pendingAutoRunStartExpiresAt > 0 && now() > pendingAutoRunStartExpiresAt) {
        clearPendingAutoRunStartRunCount();
      }
      return pendingAutoRunStartTotalRuns;
    }

    function getAutoRunSourceTotalRuns(source = {}) {
      return normalizePendingAutoRunStartRunCount(readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], 0));
    }

    function syncAutoRunState(source = {}) {
      const phase = source.autoRunPhase ?? source.phase ?? currentAutoRun.phase;
      const autoRunning = source.autoRunning !== undefined
        ? Boolean(source.autoRunning)
        : (source.autoRunPhase !== undefined || source.phase !== undefined ? ACTIVE_PHASES.has(phase) : currentAutoRun.autoRunning);
      currentAutoRun = {
        autoRunning,
        phase,
        currentRun: readAutoRunStateValue(source, ['autoRunCurrentRun', 'currentRun'], currentAutoRun.currentRun),
        totalRuns: readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], currentAutoRun.totalRuns),
        attemptRun: readAutoRunStateValue(source, ['autoRunAttemptRun', 'attemptRun'], currentAutoRun.attemptRun),
        scheduledAt: readAutoRunStateValue(source, ['scheduledAutoRunAt', 'scheduledAt'], currentAutoRun.scheduledAt),
        countdownAt: readAutoRunStateValue(source, ['autoRunCountdownAt', 'countdownAt'], currentAutoRun.countdownAt),
        countdownTitle: readAutoRunStateValue(source, ['autoRunCountdownTitle', 'countdownTitle'], currentAutoRun.countdownTitle),
        countdownNote: readAutoRunStateValue(source, ['autoRunCountdownNote', 'countdownNote'], currentAutoRun.countdownNote),
      };
      return getAutoRunState();
    }

    function isAutoRunLockedPhase() {
      return LOCKED_PHASES.has(currentAutoRun.phase);
    }

    function isAutoRunPausedPhase() {
      return currentAutoRun.phase === 'waiting_email';
    }

    function isAutoRunWaitingStepPhase() {
      return currentAutoRun.phase === 'waiting_step';
    }

    function isAutoRunScheduledPhase() {
      return currentAutoRun.phase === 'scheduled';
    }

    function isAutoRunSourceSyncPhase(phase) {
      return ACTIVE_PHASES.has(phase);
    }

    function shouldSyncRunCountFromAutoRunSource(source = {}) {
      const phase = source.autoRunPhase ?? source.phase ?? currentAutoRun.phase;
      const autoRunning = source.autoRunning !== undefined ? Boolean(source.autoRunning) : isAutoRunSourceSyncPhase(phase);
      const shouldSync = autoRunning || isAutoRunSourceSyncPhase(phase);
      if (!shouldSync) {
        return false;
      }
      const pendingTotalRuns = getPendingAutoRunStartRunCount();
      if (pendingTotalRuns > 0) {
        const sourceTotalRuns = getAutoRunSourceTotalRuns(source);
        if (sourceTotalRuns > 0 && sourceTotalRuns !== pendingTotalRuns) {
          return false;
        }
        if (sourceTotalRuns === pendingTotalRuns) {
          clearPendingAutoRunStartRunCount();
        }
      }
      return true;
    }

    function getAutoRunLabel(payload = currentAutoRun) {
      if ((payload.phase ?? currentAutoRun.phase) === 'scheduled') {
        return (payload.totalRuns || 1) > 1 ? ` (${payload.totalRuns}轮)` : '';
      }
      const attemptLabel = payload.attemptRun ? ` · 尝试${payload.attemptRun}` : '';
      if ((payload.totalRuns || 1) > 1) {
        return ` (${payload.currentRun}/${payload.totalRuns}${attemptLabel})`;
      }
      return attemptLabel ? ` (${attemptLabel.slice(3)})` : '';
    }

    return {
      clearPendingAutoRunStartRunCount,
      getAutoRunLabel,
      getAutoRunSourceTotalRuns,
      getAutoRunState,
      getPendingAutoRunStartRunCount,
      isAutoRunLockedPhase,
      isAutoRunPausedPhase,
      isAutoRunScheduledPhase,
      isAutoRunSourceSyncPhase,
      isAutoRunWaitingStepPhase,
      registerPendingAutoRunStartRunCount,
      shouldSyncRunCountFromAutoRunSource,
      syncAutoRunState,
    };
  }

  const api = {
    createAutoRunStateModel,
    createDefaultAutoRunState,
    normalizePendingAutoRunStartRunCount,
    readAutoRunStateValue,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.SidepanelAutoRunState = api;
})(typeof window !== 'undefined' ? window : globalThis);
```

- [ ] **Step 3: Load the state model before `sidepanel.js`**

In `sidepanel/sidepanel.html`, add this before `sidepanel.js` and after `auto-run-countdown-view.js`:

```html
<script src="auto-run-state.js"></script>
```

- [ ] **Step 4: Wire wrappers in `sidepanel.js`**

In `sidepanel/sidepanel.js`, replace the `currentAutoRun` object and pending run-count variables with:

```javascript
const autoRunStateModel = window.SidepanelAutoRunState.createAutoRunStateModel();
let currentAutoRun = autoRunStateModel.getAutoRunState();
```

Then replace these existing function bodies with wrappers:

```javascript
function readAutoRunStateValue(source, keys, fallback) {
  return window.SidepanelAutoRunState.readAutoRunStateValue(source, keys, fallback);
}

function normalizePendingAutoRunStartRunCount(value) {
  return window.SidepanelAutoRunState.normalizePendingAutoRunStartRunCount(value);
}

function registerPendingAutoRunStartRunCount(totalRuns) {
  autoRunStateModel.registerPendingAutoRunStartRunCount(totalRuns);
}

function clearPendingAutoRunStartRunCount() {
  autoRunStateModel.clearPendingAutoRunStartRunCount();
}

function getPendingAutoRunStartRunCount() {
  return autoRunStateModel.getPendingAutoRunStartRunCount();
}

function getAutoRunSourceTotalRuns(source = {}) {
  return autoRunStateModel.getAutoRunSourceTotalRuns(source);
}

function syncAutoRunState(source = {}) {
  currentAutoRun = autoRunStateModel.syncAutoRunState(source);
}

function isAutoRunLockedPhase() {
  return autoRunStateModel.isAutoRunLockedPhase();
}

function isAutoRunPausedPhase() {
  return autoRunStateModel.isAutoRunPausedPhase();
}

function isAutoRunWaitingStepPhase() {
  return autoRunStateModel.isAutoRunWaitingStepPhase();
}

function isAutoRunScheduledPhase() {
  return autoRunStateModel.isAutoRunScheduledPhase();
}

function isAutoRunSourceSyncPhase(phase) {
  return autoRunStateModel.isAutoRunSourceSyncPhase(phase);
}

function shouldSyncRunCountFromAutoRunSource(source = {}) {
  return autoRunStateModel.shouldSyncRunCountFromAutoRunSource(source);
}

function getAutoRunLabel(payload = currentAutoRun) {
  return autoRunStateModel.getAutoRunLabel(payload);
}
```

Leave callers unchanged.

- [ ] **Step 5: Add smoke checks**

In `scripts/audit-smoke-tests.mjs`:

- Add `sidepanel/auto-run-state.js` to `checkCoreFiles()`.
- Add `const autoRunState = readText('sidepanel/auto-run-state.js');`.
- Add these assertions:

```javascript
assertIncludes(sidepanelHtml, 'src="auto-run-state.js"', 'sidepanel auto-run state script load');
assertBefore(sidepanelHtml, 'src="auto-run-state.js"', 'src="sidepanel.js"', 'sidepanel auto-run state must load before sidepanel.js');
assertIncludes(autoRunState, 'SidepanelAutoRunState', 'sidepanel auto-run state global');
assertIncludes(autoRunState, 'createAutoRunStateModel', 'sidepanel auto-run state model factory');
assertIncludes(autoRunState, 'shouldSyncRunCountFromAutoRunSource', 'sidepanel auto-run run-count sync guard');
assertFileLineCountAtMost('sidepanel/auto-run-state.js', 280, 'sidepanel auto-run state size guard');
```

- [ ] **Step 6: Verify**

Run:

```powershell
node --check sidepanel/auto-run-state.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-auto-run-state.cjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; `sidepanel/sidepanel.js` line count drops by roughly 90-130 lines.

- [ ] **Step 7: Commit**

```powershell
git add sidepanel/auto-run-state.js sidepanel/sidepanel.html sidepanel/sidepanel.js scripts/audit-smoke-tests.mjs scripts/test-sidepanel-auto-run-state.cjs
git commit -m "refactor: extract sidepanel auto-run state model"
```

### Task 4: Update Phase Three Results And Run Full Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-06-codebase-decomposition-phase-three-plan.md`

- [ ] **Step 1: Record final module sizes**

Run:

```powershell
node scripts/module-size-report.mjs
```

Update the `Current State` table in this plan with final line counts.

- [ ] **Step 2: Record execution results**

Add an `Execution Results` section above `Current State` with rows for:

```markdown
| Task | Result |
| --- | --- |
| Sidepanel normalizer fallback | Added regression tests and preserved legacy fallback defaults. |
| Background auto-run status | Extracted status payload and phase predicates into `background/bootstrap/auto-run-status.js`. |
| Sidepanel auto-run state | Extracted current auto-run state sync and pending run-count gate into `sidepanel/auto-run-state.js`. |
```

- [ ] **Step 3: Full verification**

Run:

```powershell
node --check background.js
node --check background/bootstrap/auto-run-status.js
node --check sidepanel/sidepanel.js
node --check sidepanel/auto-run-normalizers.js
node --check sidepanel/auto-run-state.js
node scripts/audit-smoke-tests.mjs
node scripts/audit-no-phone-sms.mjs
node scripts/audit-no-removed-network.mjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; smoke warnings may remain for `background.js` and `sidepanel/sidepanel.js` until later phases.

- [ ] **Step 4: Commit**

```powershell
git add docs/superpowers/plans/2026-07-06-codebase-decomposition-phase-three-plan.md
git commit -m "docs: add decomposition phase three results"
```

## Self-Review

- Spec coverage: covers the known fallback compatibility issue, one background extraction, one sidepanel extraction, smoke guards, tests, and final documentation.
- Placeholder scan: no placeholder markers, unnamed files, or generic “write tests” steps remain; each code/test task provides concrete code and commands.
- Type consistency: module globals are `MultiPageBackgroundAutoRunStatus`, `SidepanelAutoRunState`, and `SidepanelAutoRunNormalizers`; wrapper function names match existing callers in `background.js` and `sidepanel/sidepanel.js`.
- Scope check: this is refactor-only plus one compatibility fix discovered during review; no release, no GitHub push, no business-rule changes.
