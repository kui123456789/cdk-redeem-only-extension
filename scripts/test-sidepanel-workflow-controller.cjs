const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelWorkflowController;
const workflowController = require('../sidepanel/workflow-controller.js');

test('workflow controller re-renders missing step rows when nodes are available', () => {
  let hasStepRow = false;
  let renderCount = 0;
  const button = { disabled: true };
  const controller = workflowController.createWorkflowController({
    dom: {
      btnReset: { disabled: false },
      btnStop: { disabled: false },
      document: {
        querySelector: () => button,
        querySelectorAll: () => [],
      },
      stepsList: {
        querySelector: () => (hasStepRow ? {} : null),
      },
    },
    managers: {
      workflowButtonStateManager: {
        getStepButtonState: () => ({ disabled: false }),
        isResetDisabled: () => false,
      },
      workflowStateView: {
        renderStepsList: () => {
          renderCount += 1;
          hasStepRow = true;
        },
        updateProgressCounter: () => {},
      },
    },
    state: {
      getLatestState: () => ({ nodeStatuses: { 'open-chatgpt': 'pending' } }),
    },
    workflow: {
      getNodeIds: () => ['open-chatgpt'],
      getNodeStatuses: () => ({ 'open-chatgpt': 'pending' }),
      getWorkflowNodes: () => [{ nodeId: 'open-chatgpt', title: '打开 ChatGPT 官网' }],
    },
    helpers: {
      escapeCssValue: (value) => String(value || ''),
    },
  });

  controller.updateButtonStates();
  assert.equal(renderCount, 1);
  assert.equal(button.disabled, false);

  controller.updateButtonStates();
  assert.equal(renderCount, 1);
});
