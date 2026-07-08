const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageSignupPageOrchestrator;
delete globalThis.SignupPageOrchestrator;
require('../content/signup-page-orchestrator.js');

function createRequiredHandler(name) {
  return () => {
    throw new Error(`${name} should not be called`);
  };
}

test('signup page orchestrator forwards resend timeout payload', async () => {
  const calls = [];
  const orchestrator = globalThis.MultiPageSignupPageOrchestrator.createSignupPageOrchestrator({
    fillVerificationCode: createRequiredHandler('fillVerificationCode'),
    serializeLoginAuthState: createRequiredHandler('serializeLoginAuthState'),
    inspectLoginAuthState: createRequiredHandler('inspectLoginAuthState'),
    submitAddEmailAndContinue: createRequiredHandler('submitAddEmailAndContinue'),
    getStep5SubmitState: createRequiredHandler('getStep5SubmitState'),
    getSignupVerificationPostSubmitState: createRequiredHandler('getSignupVerificationPostSubmitState'),
    skipCreateAccountEnrollPasskey: createRequiredHandler('skipCreateAccountEnrollPasskey'),
    prepareSignupVerificationFlow: createRequiredHandler('prepareSignupVerificationFlow'),
    recoverCurrentAuthRetryPage: createRequiredHandler('recoverCurrentAuthRetryPage'),
    recoverStep5SubmitRetryPage: createRequiredHandler('recoverStep5SubmitRetryPage'),
    triggerStep5ProfileSubmit: createRequiredHandler('triggerStep5ProfileSubmit'),
    resendVerificationCode: async (step, timeout, payload) => {
      calls.push({ step, timeout, payload });
      return { resent: true };
    },
    ensureSignupEntryReady: createRequiredHandler('ensureSignupEntryReady'),
    ensureSignupPasswordPageReady: createRequiredHandler('ensureSignupPasswordPageReady'),
    startSetGptPasswordResetFlow: createRequiredHandler('startSetGptPasswordResetFlow'),
    prepareSetGptPasswordFlow: createRequiredHandler('prepareSetGptPasswordFlow'),
    submitSetGptPasswordVerificationCode: createRequiredHandler('submitSetGptPasswordVerificationCode'),
    setGptPasswordOnResetPage: createRequiredHandler('setGptPasswordOnResetPage'),
    getSetGptPasswordPageState: createRequiredHandler('getSetGptPasswordPageState'),
    recoverSetGptPasswordAuthRetryPage: createRequiredHandler('recoverSetGptPasswordAuthRetryPage'),
    readChatGptSessionExportData: createRequiredHandler('readChatGptSessionExportData'),
    step8FindAndClick: createRequiredHandler('step8FindAndClick'),
    getStep8State: createRequiredHandler('getStep8State'),
    step8TriggerContinue: createRequiredHandler('step8TriggerContinue'),
  });

  const result = await orchestrator.handleCommand({
    type: 'RESEND_VERIFICATION_CODE',
    payload: {
      visibleStep: 6,
      resendTimeoutMs: 8000,
    },
  });

  assert.deepEqual(result, { resent: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].step, 6);
  assert.equal(calls[0].timeout, 8000);
  assert.equal(calls[0].payload.resendTimeoutMs, 8000);
});
