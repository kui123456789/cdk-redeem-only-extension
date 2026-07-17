# PIX Redeem Channel Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add an independent PIX redemption channel and change “一键兑换全部” to let the user choose exactly one CDK pool before running.

**Architecture:** Extend the shared redeem-channel registry from the current UPI/IDEAL binary to explicit upi, ideal, and pix metadata. Keep legacy pixRedeem* aliases mapped to UPI, while new PIX pool/usage state uses pixChannelRedeem*. Thread the selected channel through the existing API, membership result, status refresh, cancel/retry, and sidepanel paths. Reuse the existing Action Modal with three channel actions and disabled unavailable choices.

**Tech Stack:** Chrome Manifest V3, plain JavaScript, browser storage, existing Action Modal, Node node:test/node:assert/strict, static smoke audit.

## Global Constraints

- Preserve legacy pixRedeem* fields as UPI compatibility aliases; never reinterpret them as the new PIX pool.
- New API redemption/status/cancel/retry requests use channel: "pix".
- “一键兑换全部” executes exactly one user-selected channel; it does not auto-fallback to another channel.
- PIX ordinary failures use the existing non-UPI three-failure channel limit; existing IDEAL account-lock behavior remains unchanged.
- Use two-space indentation, existing namespace/module patterns, and apply_patch for edits.
- Every production behavior change must have a failing test observed before the implementation is added.

---

### Task 1: Add the three-channel registry and channel-state policy

**Files:**
- Modify: shared/redeem-channel-state.js
- Modify: sidepanel/membership-row-policy.js
- Modify: sidepanel/membership-view-model.js
- Test: scripts/test-redeem-channel-state.cjs

**Interfaces:**
- Export REDEEM_CHANNELS = ['upi', 'ideal', 'pix'].
- normalizeRedeemChannel(value) returns only upi, ideal, or pix; unknown values fall back to upi.
- getRedeemChannelLabel(channel) returns UPI, IDEAL, or PIX.
- Failure and daily-limit field helpers return channel-specific fields for all three channels.
- isRedeemAccountLocked keeps the existing global lock and IDEAL legacy lock only.

- [ ] Step 1: Write the failing tests.

Add these tests:

~~~javascript
test('normalizes PIX and exposes all channel labels', () => {
  assert.equal(policy.normalizeRedeemChannel('pix'), 'pix');
  assert.equal(policy.normalizeRedeemChannel('PIX'), 'pix');
  assert.equal(policy.normalizeRedeemChannel('unknown'), 'upi');
  assert.deepEqual(policy.REDEEM_CHANNELS, ['upi', 'ideal', 'pix']);
  assert.equal(policy.getRedeemChannelLabel('pix'), 'PIX');
});

test('PIX failure and daily-limit fields stay isolated', () => {
  assert.equal(policy.getRedeemChannelFailureField('pix'), 'pixRedeemFailureCount');
  assert.equal(policy.getRedeemChannelDailyLimitBlockedUntilField('pix'), 'pixRedeemDailyLimitBlockedUntil');
  assert.equal(policy.getRedeemChannelFailureCount({ pixRedeemFailureCount: 2 }, 'pix'), 2);
  assert.equal(policy.getRedeemChannelFailureCount({ pixRedeemFailureCount: 2 }, 'upi'), 0);
});

test('PIX becomes unavailable after its channel failure limit without changing UPI state', () => {
  const item = { trialEligibilityStatus: 'eligible', pixRedeemFailureCount: 3 };
  assert.equal(policy.shouldRedeemItemUseChannel(item, 'pix'), false);
  assert.equal(policy.shouldRedeemItemUseChannel(item, 'upi'), true);
});
~~~

- [ ] Step 2: Run the focused test and verify RED.

Run: node --test scripts/test-redeem-channel-state.cjs

Expected: FAIL because pix currently normalizes to upi and the registry/label/field helpers do not exist.

- [ ] Step 3: Implement the minimal registry and policy.

Add frozen channel metadata in shared/redeem-channel-state.js:

~~~javascript
const REDEEM_CHANNELS = Object.freeze(['upi', 'ideal', 'pix']);
const REDEEM_CHANNEL_METADATA = Object.freeze({
  upi: { label: 'UPI', failureField: 'upiRedeemFailureCount', dailyLimitPrefix: 'upiRedeem' },
  ideal: { label: 'IDEAL', failureField: 'idealRedeemFailureCount', dailyLimitPrefix: 'idealRedeem' },
  pix: { label: 'PIX', failureField: 'pixRedeemFailureCount', dailyLimitPrefix: 'pixRedeem' },
});
~~~

Make existing helpers read metadata, export the registry and label helper, and update sidepanel fallbacks to recognize pix and pix-plus while preserving IDEAL locking.

- [ ] Step 4: Run the focused test and verify GREEN.

Run: node --test scripts/test-redeem-channel-state.cjs

Expected: all channel-state tests pass.

- [ ] Step 5: Commit.

~~~powershell
git add shared/redeem-channel-state.js sidepanel/membership-row-policy.js sidepanel/membership-view-model.js scripts/test-redeem-channel-state.cjs
git commit -m "feat: add PIX redeem channel policy"
~~~

### Task 2: Add independent PIX pool/usage storage without breaking legacy aliases

**Files:**
- Modify: background/redeem/redeem-cdkey-usage.js
- Modify: background/bootstrap/settings-defaults.js
- Modify: background/bootstrap/state-patch-helpers.js
- Modify: background/upi-credential-membership-checker.js
- Modify: background.js
- Modify: sidepanel/cdk-pool-state.js
- Modify: sidepanel/account-records-cdk-pool-text.js
- Test: scripts/test-redeem-cdkey-usage.cjs
- Test: scripts/test-sidepanel-cdk-pool-state.cjs
- Test: scripts/test-background-state-patch-helpers.cjs

**Interfaces:**
- Canonical PIX keys are pixChannelRedeemCdkeyPoolText and pixChannelRedeemCdkeyUsage.
- getRedeemChannelPoolKey, getRedeemChannelUsageKey, getRedeemChannelPoolText, getRedeemChannelUsage, and buildRedeemChannelUsageUpdates support pix.
- pixRedeemCdkeyPoolText and pixRedeemCdkeyUsage remain legacy UPI aliases only.
- A PIX sidepanel patch writes only canonical PIX fields; UPI keeps its existing aliases.

- [ ] Step 1: Write the failing tests.

~~~javascript
test('PIX uses independent canonical pool and usage keys', () => {
  const pixUsage = { PIX_A: { remoteStatus: 'failed' } };
  assert.equal(usage.getRedeemChannelPoolKey('pix'), 'pixChannelRedeemCdkeyPoolText');
  assert.equal(usage.getRedeemChannelUsageKey('pix'), 'pixChannelRedeemCdkeyUsage');
  assert.equal(usage.getRedeemChannelPoolText({ pixChannelRedeemCdkeyPoolText: 'PIX_A' }, 'pix'), 'PIX_A');
  assert.deepEqual(usage.getRedeemChannelUsage({ pixChannelRedeemCdkeyUsage: pixUsage }, 'pix'), pixUsage);
  assert.deepEqual(usage.buildRedeemChannelUsageUpdates('pix', pixUsage), { pixChannelRedeemCdkeyUsage: pixUsage });
});

test('legacy pixRedeem pool aliases remain UPI aliases', () => {
  assert.equal(usage.getRedeemChannelPoolText({ pixRedeemCdkeyPoolText: 'OLD_UPI' }, 'upi'), 'OLD_UPI');
  assert.equal(usage.getRedeemChannelPoolText({ pixRedeemCdkeyPoolText: 'OLD_UPI' }, 'pix'), '');
});
~~~

Add PIX patch assertions to the existing state-patch and sidepanel pool tests, including the invariant that a PIX patch does not write UPI aliases.

- [ ] Step 2: Run focused tests and verify RED.

Run: node --test scripts/test-redeem-cdkey-usage.cjs scripts/test-sidepanel-cdk-pool-state.cjs scripts/test-background-state-patch-helpers.cjs

Expected: FAIL on missing PIX keys and isolation assertions.

- [ ] Step 3: Implement canonical PIX storage and settings defaults.

Add empty canonical PIX fields to settings-defaults.js, branch state-patch helpers on channel === 'pix', and update all pool/usage readers to use shared key helpers. Keep legacy alias arrays. Update background.js settings normalization/export/import to preserve old UPI aliases and include new PIX fields.

- [ ] Step 4: Run focused tests and verify GREEN.

Run the same focused command. Expected: all pool/state tests pass and existing UPI alias assertions remain green.

- [ ] Step 5: Commit.

~~~powershell
git add background/redeem/redeem-cdkey-usage.js background/bootstrap/settings-defaults.js background/bootstrap/state-patch-helpers.js background/upi-credential-membership-checker.js background.js sidepanel/cdk-pool-state.js sidepanel/account-records-cdk-pool-text.js scripts/test-redeem-cdkey-usage.cjs scripts/test-sidepanel-cdk-pool-state.cjs scripts/test-background-state-patch-helpers.cjs
git commit -m "feat: isolate PIX redeem pool state"
~~~

### Task 3: Thread PIX through eligibility, result normalization, and membership grouping

**Files:**
- Modify: shared/trial-eligibility-api.js
- Modify: background/membership/trial-eligibility-service.js
- Modify: background/membership/free-pool-service.js
- Modify: background/membership/result-state.js
- Modify: background/membership/membership-result-sync.js
- Modify: sidepanel/account-records-membership-helpers.js
- Modify: sidepanel/account-records-trial-eligibility.js
- Modify: sidepanel/membership-renderer.js
- Test: scripts/test-trial-eligibility-api.cjs
- Test: scripts/test-membership-result-state.cjs
- Test: scripts/test-membership-view-model.cjs

**Interfaces:**
- Eligibility normalization exposes pixChannelEligibilityStatus and pixChannelEligibilityReason.
- Result normalization preserves PIX eligibility, failure, daily-limit, and channel fields.
- Membership view-model maps paid PIX rows to pix-plus and supports paid-pix UI group filtering.

- [ ] Step 1: Write the failing tests.

Add this fixture to test-trial-eligibility-api.cjs and PIX paid-row fixtures to result/view-model tests:

~~~javascript
test('trial eligibility preserves PIX channel status and reason', () => {
  const decision = normalizeTrialEligibilityDecision({
    trial_eligible: true,
    channels: { pix: { status: 'eligible', reason: 'pix-ok' } },
  });
  assert.equal(decision.pixChannelEligibilityStatus, 'eligible');
  assert.equal(decision.pixChannelEligibilityReason, 'pix-ok');
  assert.equal(isTrialEligibilityChannelAllowed(decision, 'pix'), true);
});
~~~

- [ ] Step 2: Run focused tests and verify RED.

Run: node --test scripts/test-trial-eligibility-api.cjs scripts/test-membership-result-state.cjs scripts/test-membership-view-model.cjs

Expected: FAIL because unknown channels collapse to UPI and no PIX group exists.

- [ ] Step 3: Implement PIX normalization and grouping.

Extend channel-specific response parsing and result sanitization with PIX fields. If the backend response has no PIX channel object, leave PIX status unknown rather than copying UPI/IDEAL. Update group labels, summary counters, and row-policy dependencies.

- [ ] Step 4: Run focused tests and verify GREEN.

Run the same command. Expected: PIX fixtures and all existing UPI/IDEAL fixtures pass.

- [ ] Step 5: Commit.

~~~powershell
git add shared/trial-eligibility-api.js background/membership/trial-eligibility-service.js background/membership/free-pool-service.js background/membership/result-state.js background/membership/membership-result-sync.js sidepanel/account-records-membership-helpers.js sidepanel/account-records-trial-eligibility.js sidepanel/membership-renderer.js scripts/test-trial-eligibility-api.cjs scripts/test-membership-result-state.cjs scripts/test-membership-view-model.cjs
git commit -m "feat: normalize PIX membership results"
~~~

### Task 4: Thread the selected channel through redeem submission and remote job operations

**Files:**
- Modify: background/steps/upi-redeem.js
- Modify: background/steps/upi-redeem/channel-submission.js
- Modify: background/steps/upi-redeem/status-polling.js
- Modify: background/steps/upi-redeem/finalize.js
- Modify: background/redeem/upi-redeem-api-client.js
- Modify: background/membership/redeem-candidate-service.js
- Modify: background/membership/redeem-service.js
- Modify: background/membership/redeem-status-sync.js
- Modify: background/router/redeem-refresh-service.js
- Modify: background/router/core-routes.js
- Test: scripts/test-upi-redeem-api-client.cjs
- Test: scripts/test-redeem-channel-state.cjs
- Test: scripts/test-membership-redeem-progress.cjs

**Interfaces:**
- Redeem, refresh, cancel, and retry requests preserve normalized channel.
- Candidate selection uses channel pool/usage helpers for PIX and writes PIX usage only.
- redeemChannel: 'pix' reaches the remote API body and status persistence.

- [ ] Step 1: Write the failing tests.

Add this API test and state-isolation cases:

~~~javascript
test('redeemCdkey sends the PIX channel to the remote API', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return { ok: true, text: async () => JSON.stringify({ status: 'queued' }) };
    },
  });
  await client.redeemCdkey({ apiUrl: 'https://example.test/redeem', cdkey: 'PIX_A', channel: 'pix' });
  assert.equal(requests[0].channel, 'pix');
});
~~~

- [ ] Step 2: Run focused tests and verify RED.

Run: node --test scripts/test-upi-redeem-api-client.cjs scripts/test-redeem-channel-state.cjs scripts/test-membership-redeem-progress.cjs

Expected: the new PIX request/state-isolation assertions fail.

- [ ] Step 3: Implement channel propagation.

Replace remaining binary fallbacks with the shared registry, pass normalized channel to submission/status/finalize helpers, and make refresh/cancel/retry payloads include PIX canonical pool text plus channel: 'pix'. Preserve existing UPI legacy payload aliases for old callers.

- [ ] Step 4: Run focused tests and verify GREEN.

Run the same focused command. Expected: all API/progress tests pass.

- [ ] Step 5: Commit.

~~~powershell
git add background/steps/upi-redeem.js background/steps/upi-redeem/channel-submission.js background/steps/upi-redeem/status-polling.js background/steps/upi-redeem/finalize.js background/redeem/upi-redeem-api-client.js background/membership/redeem-candidate-service.js background/membership/redeem-service.js background/membership/redeem-status-sync.js background/router/redeem-refresh-service.js background/router/core-routes.js scripts/test-upi-redeem-api-client.cjs scripts/test-redeem-channel-state.cjs scripts/test-membership-redeem-progress.cjs
git commit -m "feat: submit and track PIX redemptions"
~~~

### Task 5: Add PIX card-pool UI and status operations

**Files:**
- Modify: sidepanel/sidepanel.html
- Modify: sidepanel/dom-bindings.js
- Modify: sidepanel/cdk-pool-state.js
- Modify: sidepanel/cdk-pool-manager.js
- Modify: sidepanel/upi-redeem-cdk-controller.js
- Modify: sidepanel/upi-redeem-cdk-status-view.js
- Modify: sidepanel/sidepanel-app-controller.js
- Modify: sidepanel/sidepanel.css
- Test: scripts/test-sidepanel-cdk-pool-state.cjs

**Interfaces:**
- DOM exposes PIX pool input/import/delete/summary/status-list nodes.
- Pool controller, status view, and refresh iteration accept pix.
- PIX pool edits produce canonical pixChannelRedeemCdkeyPoolText/pixChannelRedeemCdkeyUsage patches.

- [ ] Step 1: Write the failing test.

~~~javascript
test('PIX pool patch uses canonical PIX fields without UPI aliases', () => {
  const patch = helpers.buildCdkPoolStatePatch('PIX_A', { PIX_A: { enabled: true } }, 'pix');
  assert.equal(patch.pixChannelRedeemCdkeyPoolText, 'PIX_A');
  assert.ok(patch.pixChannelRedeemCdkeyUsage.PIX_A);
  assert.equal(patch.upiRedeemCdkeyPoolText, undefined);
  assert.equal(patch.pixRedeemCdkeyPoolText, undefined);
});
~~~

- [ ] Step 2: Run the focused test and verify RED.

Run: node --test scripts/test-sidepanel-cdk-pool-state.cjs

Expected: FAIL because the helper only has UPI and IDEAL branches.

- [ ] Step 3: Add the PIX panel and wire controllers.

Duplicate the IDEAL panel markup in sidepanel/sidepanel.html with PIX IDs and data-cdk-channel="pix". Bind the nodes, extend channel lists to ['upi', 'ideal', 'pix'], and use channel metadata for labels and stored values. Add only the minimum CSS needed for the existing grid/list layout.

- [ ] Step 4: Run focused test and syntax checks.

Run:
~~~powershell
node --test scripts/test-sidepanel-cdk-pool-state.cjs
node --check sidepanel/cdk-pool-state.js
node --check sidepanel/upi-redeem-cdk-controller.js
node --check sidepanel/upi-redeem-cdk-status-view.js
~~~

Expected: PASS with exit code 0.

- [ ] Step 5: Commit.

~~~powershell
git add sidepanel/sidepanel.html sidepanel/dom-bindings.js sidepanel/cdk-pool-state.js sidepanel/cdk-pool-manager.js sidepanel/upi-redeem-cdk-controller.js sidepanel/upi-redeem-cdk-status-view.js sidepanel/sidepanel-app-controller.js sidepanel/sidepanel.css scripts/test-sidepanel-cdk-pool-state.cjs
git commit -m "feat: add PIX CDK pool controls"
~~~

### Task 6: Add the channel chooser and selected-channel all-redeem flow

**Files:**
- Modify: sidepanel/action-modal-service.js
- Modify: sidepanel/sidepanel-app-controller.js
- Modify: sidepanel/account-records-redeem-actions.js
- Modify: sidepanel/account-records-panel-events.js
- Modify: sidepanel/account-records-membership-results-renderer.js
- Test: scripts/test-account-records-redeem-actions.cjs
- Test: scripts/test-action-modal-service.cjs (create)

**Interfaces:**
- openActionModal honors action.disabled without resolving when disabled.
- openRedeemChannelChoiceDialog(options) returns Promise<'upi'|'ideal'|'pix'|null>.
- startUpiCredentialMembershipAllRedeem(channel) accepts the selected channel and runs only that channel.

- [ ] Step 1: Write the failing tests.

Create test-action-modal-service.cjs with a fake DOM asserting disabled PIX cannot resolve and enabled PIX resolves pix. Add a redeem-actions case asserting startUpiCredentialMembershipAllRedeem('pix') calls startUpiCredentialMembershipFreeRedeem exactly once with channel pix and fromAll true, never with UPI or IDEAL.

~~~javascript
test('selected PIX all-redeem path runs only PIX', async () => {
  const calls = [];
  const actions = createActionsForTest({
    startUpiCredentialMembershipFreeRedeem: async (_rows, options) => {
      calls.push(options);
      return { results: { items: [], freeCount: 0, paidCount: 0, failedCount: 0 } };
    },
  });
  await actions.startUpiCredentialMembershipAllRedeem('pix');
  assert.deepEqual(calls.map((item) => item.channel), ['pix']);
  assert.equal(calls[0].fromAll, true);
});
~~~

- [ ] Step 2: Run focused tests and verify RED.

Run: node --test scripts/test-action-modal-service.cjs scripts/test-account-records-redeem-actions.cjs

Expected: FAIL because all-redeem is hard-coded UPI then IDEAL and the modal has no disabled-action support.

- [ ] Step 3: Implement chooser and selected flow.

Add disabled handling to configureActionModalButton, add a controller wrapper that builds three actions from current candidate/CDK counts, and update the panel event handler to await the chooser before calling the selected-channel all-redeem function. Re-fetch state after selection, build candidates for only that channel, and keep direct UPI/IDEAL behavior unchanged. Add a direct PIX button and count/title to the Free action row.

- [ ] Step 4: Run focused tests and syntax checks.

Run:
~~~powershell
node --test scripts/test-action-modal-service.cjs scripts/test-account-records-redeem-actions.cjs
node --check sidepanel/action-modal-service.js
node --check sidepanel/account-records-redeem-actions.js
node --check sidepanel/account-records-membership-results-renderer.js
~~~

Expected: PASS with exit code 0.

- [ ] Step 5: Commit.

~~~powershell
git add sidepanel/action-modal-service.js sidepanel/sidepanel-app-controller.js sidepanel/account-records-redeem-actions.js sidepanel/account-records-panel-events.js sidepanel/account-records-membership-results-renderer.js scripts/test-account-records-redeem-actions.cjs scripts/test-action-modal-service.cjs
git commit -m "feat: choose redeem pool for all accounts"
~~~

### Task 7: Add PIX Plus rendering, export, deletion, and operation labels

**Files:**
- Modify: sidepanel/account-records-membership-results-renderer.js
- Modify: sidepanel/account-records-membership-groups.js
- Modify: sidepanel/account-records-export-builders.js
- Modify: sidepanel/account-records-deletion-state.js
- Modify: sidepanel/account-records-redeem-status.js
- Modify: sidepanel/account-records-status-meta.js
- Modify: background/membership/import-export-service.js
- Test: scripts/test-membership-import-export-service.cjs
- Test: scripts/test-account-records-redeem-actions.cjs

**Interfaces:**
- PIX rows render as PIX Plus and export/delete filters accept paid-pix.
- Import/export sanitization preserves PIX channel fields and canonical pool keys.
- Cancel/retry/delete operations preserve channel pix.

- [ ] Step 1: Write failing tests.

Add import/export fixtures containing a PIX paid row and canonical PIX pool/usage state. Assert round-trip preservation, paid-pix export selection, and PIX cancel/retry payload channel.

- [ ] Step 2: Run focused tests and verify RED.

Run: node --test scripts/test-membership-import-export-service.cjs scripts/test-account-records-redeem-actions.cjs

Expected: FAIL because result grouping and export filters only recognize UPI and IDEAL.

- [ ] Step 3: Implement PIX group and operation handling.

Extend group maps, summary counters, export builders, deletion state, status metadata, and import/export sanitizers with PIX. Update all hard-coded paid-group lists to include paid-pix, and ensure operation payloads use the row’s normalized channel.

- [ ] Step 4: Run focused tests and verify GREEN.

Run the same focused command. Expected: PIX round-trip/group/operation tests and existing tests pass.

- [ ] Step 5: Commit.

~~~powershell
git add sidepanel/account-records-membership-results-renderer.js sidepanel/account-records-membership-groups.js sidepanel/account-records-export-builders.js sidepanel/account-records-deletion-state.js sidepanel/account-records-redeem-status.js sidepanel/account-records-status-meta.js background/membership/import-export-service.js scripts/test-membership-import-export-service.cjs scripts/test-account-records-redeem-actions.cjs
git commit -m "feat: render and export PIX memberships"
~~~

### Task 8: Run full verification and reconcile remaining binary assumptions

**Files:**
- Modify: remaining files reported by the channel search only when a failing test or smoke audit identifies a PIX omission.
- Test: scripts/audit-smoke-tests.mjs

- [ ] Step 1: Search for remaining binary channel assumptions.

Run:
~~~powershell
rg -n "\['upi', 'ideal'\]|=== 'ideal'|=== 'upi'|pixRedeemCdkeyPoolText|pixRedeemCdkeyUsage" background sidepanel shared scripts
~~~

Review each match. Legacy alias matches are allowed only in UPI compatibility maps; executable channel branches must use the shared registry or include PIX explicitly.

- [ ] Step 2: Run the full test suite and syntax checks.

~~~powershell
node --test scripts/test-*.cjs
node scripts/audit-smoke-tests.mjs
node --check background.js
node --check sidepanel/sidepanel.js
node --check background/steps/upi-redeem.js
git diff --check
~~~

Expected: all Node tests pass, smoke audit exits successfully (pre-existing warnings documented if unchanged), syntax checks exit 0, and diff check is clean.

- [ ] Step 3: Verify the working tree and sensitive-data boundary.

~~~powershell
git status --short
git log -8 --oneline --decorate
~~~

Confirm only intended PIX implementation commits are present and no sensitive settings, credentials, tokens, cookies, proxies, phone numbers, or generated exports were added.

- [ ] Step 4: Commit any final focused fix.

Only if Step 2 identifies a real regression, add a focused regression test first, observe RED, implement the minimal fix, rerun the affected test and full suite, then commit with a behavior-specific fix: message.

