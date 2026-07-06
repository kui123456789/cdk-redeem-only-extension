# Codebase Decomposition Phase Five Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue reducing `sidepanel/sidepanel.js` by extracting workflow status-bar text and tone rules into a focused, tested module.

**Architecture:** Keep DOM mutation in `sidepanel.js`; move pure status-display decisions into `sidepanel/workflow-status-display.js`. The module exposes `window.SidepanelWorkflowStatusDisplay` for browser use and CommonJS exports for tests.

**Tech Stack:** Plain JavaScript, side panel DOM scripts, CommonJS `node:test`, `node --check`, existing smoke audit.

---

## Current State

| File | Lines | Note |
| --- | ---: | --- |
| `background.js` | 15,901 | Still the largest file; leave for a later background-focused pass. |
| `sidepanel/sidepanel.js` | 10,659 | Still mixes workflow status display, settings/event wiring, and top-level message handling. |
| `sidepanel/workflow-button-state.js` | 137 | Pure workflow button state rules from Phase 4. |

## Execution Results

| Task | Result |
| --- | --- |
| Workflow status display | Extracted status-bar text and tone decisions into `sidepanel/workflow-status-display.js`. |

## File Structure For This Phase

- `sidepanel/workflow-status-display.js`: pure workflow status-bar display decisions.
- `scripts/test-sidepanel-workflow-status-display.cjs`: unit tests for countdown, paused/locked, running/failed/stopped, completed, and ready states.
- `sidepanel/sidepanel.html`: loads the new module before `sidepanel.js`.
- `sidepanel/sidepanel.js`: delegates `updateStatusDisplay()` decision logic to the new module and keeps DOM mutation local.
- `scripts/audit-smoke-tests.mjs`: guards new file presence, global name, factory name, and sidepanel script order.

## Non-Goals

- Do not change workflow behavior, registration logic, trial eligibility, UPI/IDEAL redemption, Passkey/2FA behavior, Free/Plus grouping, export formats, or release behavior.
- Do not move status-bar DOM mutation into the pure status-display module.

---

### Task 1: Extract Sidepanel Workflow Status Display Rules

**Files:**
- Create: `sidepanel/workflow-status-display.js`
- Create: `scripts/test-sidepanel-workflow-status-display.cjs`
- Modify: `sidepanel/sidepanel.html`
- Modify: `sidepanel/sidepanel.js`
- Modify: `scripts/audit-smoke-tests.mjs`

- [x] **Step 1: Add a pure status display module**

Create `sidepanel/workflow-status-display.js` with `createWorkflowStatusDisplayManager()`. It returns `getStatusDisplayState()` and accepts helper functions `isDoneStatus` and `formatCountdown`.

- [x] **Step 2: Add unit tests**

Create `scripts/test-sidepanel-workflow-status-display.cjs` covering:

- active countdown shows remaining time and scheduled/running tone.
- paused auto-run displays paused text.
- locked auto-run displays running nodes or retry text.
- running/failed/stopped node statuses take the expected tone.
- all completed displays completed tone.
- no progress displays `就绪` with empty tone.

- [x] **Step 3: Wire sidepanel loading and wrapper**

Load `workflow-status-display.js` after `workflow-button-state.js` and before `sidepanel.js`. In `sidepanel.js`, create `workflowStatusDisplayManager` and delegate `updateStatusDisplay()` display decision to it.

- [x] **Step 4: Add smoke checks**

Update `scripts/audit-smoke-tests.mjs` to require the new file, assert the `SidepanelWorkflowStatusDisplay` global and `createWorkflowStatusDisplayManager` factory, and check script order before `sidepanel.js`.

- [x] **Step 5: Verify**

Run:

```powershell
node --check sidepanel/workflow-status-display.js
node --check sidepanel/sidepanel.js
node --check scripts/audit-smoke-tests.mjs
node scripts/audit-smoke-tests.mjs
node --test scripts/test-sidepanel-workflow-status-display.cjs
node --test scripts/test-*.cjs
```

Expected: all commands exit `0`; smoke warnings may remain only for existing large tracked files.
