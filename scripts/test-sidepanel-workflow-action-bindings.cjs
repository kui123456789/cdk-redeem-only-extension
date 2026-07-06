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
