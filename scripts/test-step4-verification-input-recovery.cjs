const assert = require('node:assert/strict');
const test = require('node:test');

require('../background/verification/resend-controller.js');

const { createVerificationResendController } = globalThis.MultiPageVerificationResendController;

test('step 4 reloads a stale email-verification page before filling a fetched code', async () => {
  const messages = [];
  const reloads = [];
  let prepareAttempts = 0;

  const controller = createVerificationResendController({
    constants: {
      POST_SUBMIT_CONFIRM_TIMEOUT_MS: 3000,
      POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS: 100,
      STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT: 0,
    },
    addLog: async () => {},
    chrome: {
      tabs: {
        async update() {},
        async get() {
          return {
            id: 41,
            status: 'complete',
            url: 'https://auth.openai.com/email-verification',
          };
        },
        async reload(tabId, options) {
          reloads.push({ tabId, options });
        },
      },
    },
    getTabId: async () => 41,
    isRetryableVerificationTransportError: () => false,
    sendToContentScriptResilient: async (_source, message) => {
      messages.push(message.type);
      if (message.type === 'PREPARE_SIGNUP_VERIFICATION') {
        prepareAttempts += 1;
        if (prepareAttempts === 1) {
          return {
            error: '未找到验证码输入框。URL: https://auth.openai.com/email-verification',
          };
        }
        return { ready: true };
      }
      if (message.type === 'FILL_CODE') {
        return { success: true };
      }
      throw new Error(`unexpected message: ${message.type}`);
    },
    sleepWithStop: async () => {},
    throwIfStopped: () => {},
  });

  const result = await controller.submitVerificationCode(4, '123456');

  assert.equal(result.success, true);
  assert.equal(prepareAttempts, 2);
  assert.deepEqual(reloads, [{ tabId: 41, options: { bypassCache: true } }]);
  assert.deepEqual(messages, [
    'PREPARE_SIGNUP_VERIFICATION',
    'PREPARE_SIGNUP_VERIFICATION',
    'FILL_CODE',
  ]);
});
