const test = require('node:test');
const assert = require('node:assert/strict');

const appStateModule = require('../sidepanel/app-state.js');
const runtimeMessageControllerModule = require('../sidepanel/runtime-message-controller.js');

test('runtime message controller registers listener once', () => {
  const listeners = [];
  const controller = runtimeMessageControllerModule.createRuntimeMessageController({
    appState: appStateModule.createSidepanelAppState({
      latestState: {},
      currentAutoRun: { autoRunning: false, phase: 'idle' },
    }),
    chromeApi: {
      runtime: {
        onMessage: {
          addListener(listener) {
            listeners.push(listener);
          },
        },
      },
    },
  });

  controller.start();
  controller.start();

  assert.equal(listeners.length, 1);
});

test('runtime message controller resolves custom verification confirmation requests', async () => {
  const listeners = [];
  const controller = runtimeMessageControllerModule.createRuntimeMessageController({
    appState: appStateModule.createSidepanelAppState({
      latestState: {},
      currentAutoRun: { autoRunning: false, phase: 'idle' },
    }),
    chromeApi: {
      runtime: {
        onMessage: {
          addListener(listener) {
            listeners.push(listener);
          },
        },
      },
    },
    scopeValues: {
      openCustomVerificationConfirmDialog: async (step) => ({ confirmed: step === 6 }),
    },
  });

  controller.start();

  let response = null;
  const shouldKeepPortOpen = listeners[0](
    { type: 'REQUEST_CUSTOM_VERIFICATION_BYPASS_CONFIRMATION', payload: { step: 6 } },
    {},
    (payload) => {
      response = payload;
    }
  );

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(shouldKeepPortOpen, true);
  assert.deepEqual(response, { confirmed: true });
});
