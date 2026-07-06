const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelWorkflowButtonState;
const workflowButtonState = require('../sidepanel/workflow-button-state.js');

function createManager(overrides = {}) {
  return workflowButtonState.createWorkflowButtonStateManager({
    getNodeIds: () => ['open-chatgpt', 'submit-email', 'fetch-code', 'set-password'],
    getIndependentExecuteNodes: () => new Set(['fetch-code']),
    getSkippableNodes: () => new Set(['fetch-code']),
    isDoneStatus: (status) => status === 'completed' || status === 'manual_completed' || status === 'skipped',
    ...overrides,
  });
}

test('first workflow node can run while later nodes wait for completed previous nodes', () => {
  const manager = createManager();
  const statuses = {
    'open-chatgpt': 'pending',
    'submit-email': 'pending',
    'fetch-code': 'pending',
    'set-password': 'pending',
  };

  assert.deepEqual(manager.getStepButtonState({ nodeId: 'open-chatgpt', index: 0, statuses }), {
    canRun: true,
    disabled: false,
  });
  assert.deepEqual(manager.getStepButtonState({ nodeId: 'submit-email', index: 1, statuses }), {
    canRun: false,
    disabled: true,
  });

  statuses['open-chatgpt'] = 'completed';
  assert.deepEqual(manager.getStepButtonState({ nodeId: 'submit-email', index: 1, statuses }), {
    canRun: true,
    disabled: false,
  });
});

test('independent nodes still require all previous nodes ready', () => {
  const manager = createManager();
  const statuses = {
    'open-chatgpt': 'completed',
    'submit-email': 'pending',
    'fetch-code': 'pending',
    'set-password': 'pending',
  };

  assert.equal(manager.canExecuteNodeWithoutPreviousNode('fetch-code', statuses), false);
  statuses['submit-email'] = 'completed';
  assert.equal(manager.canExecuteNodeWithoutPreviousNode('fetch-code', statuses), true);
});

test('auto-run locks disable otherwise runnable step buttons', () => {
  const manager = createManager();
  const statuses = {
    'open-chatgpt': 'completed',
    'submit-email': 'pending',
  };

  assert.equal(manager.getStepButtonState({
    nodeId: 'submit-email',
    index: 1,
    statuses,
    anyRunning: true,
  }).disabled, true);
  assert.equal(manager.getStepButtonState({
    nodeId: 'submit-email',
    index: 1,
    statuses,
    autoScheduled: true,
  }).disabled, true);
});

test('skip button is available only for skippable unfinished nodes with previous node done', () => {
  const manager = createManager();
  const statuses = {
    'open-chatgpt': 'completed',
    'submit-email': 'completed',
    'fetch-code': 'pending',
  };

  assert.deepEqual(manager.getManualSkipButtonState({ nodeId: 'fetch-code', statuses }), {
    canSkip: true,
    visible: true,
    disabled: false,
    title: '跳过节点 fetch-code',
  });

  statuses['fetch-code'] = 'completed';
  assert.deepEqual(manager.getManualSkipButtonState({ nodeId: 'fetch-code', statuses }), {
    canSkip: false,
    visible: false,
    disabled: true,
    title: '当前不可跳过',
  });
});

test('reset and active control state follow running scheduled paused and locked flags', () => {
  const manager = createManager();

  assert.equal(manager.isResetDisabled({}), false);
  assert.equal(manager.isActiveControlEnabled({}), true);
  assert.equal(manager.isResetDisabled({ anyRunning: true }), true);
  assert.equal(manager.isResetDisabled({ autoScheduled: true }), true);
  assert.equal(manager.isResetDisabled({ autoPaused: true }), true);
  assert.equal(manager.isResetDisabled({ autoLocked: true }), true);
  assert.equal(manager.isActiveControlEnabled({ autoLocked: true }), false);
});
