# Codebase Decomposition Phase Four Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue reducing `sidepanel/sidepanel.js` by extracting workflow button enablement rules into a focused, tested module.

**Architecture:** Keep the Chrome MV3 no-bundler architecture. The new sidepanel file exposes `window.SidepanelWorkflowButtonState` and is loaded before `sidepanel.js`. `sidepanel.js` keeps DOM wiring and compatibility function names while delegating pure state decisions to the new module.

**Tech Stack:** Plain JavaScript, side panel DOM scripts, CommonJS `node:test`, `node --check`, existing smoke audit.

---

## Current State

| File | Lines | Note |
| --- | ---: | --- |
| `background.js` | 15,901 | Still the largest file; leave for a later background-focused pass. |
| `sidepanel/sidepanel.js` | 10,659 | Still mixes workflow UI rules, settings/event wiring, and top-level message handling. |
| `sidepanel/workflow-state-view.js` | 129 | Renders workflow rows and status icons only. |

## Execution Results

| Task | Result |
| --- | --- |
| Workflow button state | Extracted manual execute, skip, reset, and active-control decision rules into `sidepanel/workflow-button-state.js`. |

## File Structure For This Phase

- `sidepanel/workflow-button-state.js`: pure workflow button enablement and visibility decisions.
- `scripts/test-sidepanel-workflow-button-state.cjs`: unit tests for manual execute, skip, reset, and active control rules.
- `sidepanel/sidepanel.html`: loads the new module before `sidepanel.js`.
- `sidepanel/sidepanel.js`: delegates existing button state calculations to the new module while keeping DOM updates local.
- `scripts/audit-smoke-tests.mjs`: guards new file presence, global name, factory name, and sidepanel script order.

## Non-Goals

- Do not change workflow behavior, registration logic, trial eligibility, UPI/IDEAL redemption, Passkey/2FA behavior, Free/Plus grouping, export formats, or release behavior.
- Do not move DOM querying into the pure button state module.

---

### Task 1: Extract Sidepanel Workflow Button State Rules

**Files:**
- Create: `sidepanel/workflow-button-state.js`
- Create: `scripts/test-sidepanel-workflow-button-state.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [x] **Step 1: Add a pure workflow button state module**

Create `sidepanel/workflow-button-state.js` with a `createWorkflowButtonStateManager()` factory. The manager accepts `nodeIds`, `independentExecuteNodes`, `skippableNodes`, and `isDoneStatus`, and returns `arePreviousNodesReadyForManualExecute()`, `canExecuteNodeWithoutPreviousNode()`, `getStepButtonState()`, `getManualSkipButtonState()`, `isResetDisabled()`, and `isActiveControlEnabled()`.

- [x] **Step 2: Add unit tests**

Create `scripts/test-sidepanel-workflow-button-state.cjs` covering:

- First node can run when idle.
- Later nodes require previous nodes done.
- Independent nodes can run only when previous nodes are ready.
- Running or scheduled auto-run disables step buttons.
- Skip button is visible only for skippable, unfinished nodes whose previous node is done.
- Reset is disabled when running/scheduled/paused/locked.

- [x] **Step 3: Wire sidepanel loading and wrappers**

Load `workflow-button-state.js` after `workflow-state-view.js` and before `sidepanel.js`. In `sidepanel.js`, create `workflowButtonStateManager` and delegate the existing `arePreviousNodesReadyForManualExecute()`, `canExecuteNodeWithoutPreviousNode()`, and `updateButtonStates()` calculations to it.

- [x] **Step 4: Add smoke checks**

Update `scripts/audit-smoke-tests.mjs` to require the new file, assert the `SidepanelWorkflowButtonState` global and `createWorkflowButtonStateManager` factory, and check script order before `sidepanel.js`.

- [x] **Step 5: Verify**

Run:

```powershell
node --check sidepanel/workflow-button-state.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-workflow-button-state.cjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; smoke warnings may remain only for existing large tracked files.
