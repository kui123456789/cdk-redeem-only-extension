const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/signup-executor-registry.js');

test('creates core signup helpers and step executors with shared inject list', () => {
  const calls = [];
  const root = {
    MultiPageBackgroundPanelBridge: { createPanelBridge: (deps) => { calls.push({ name: 'PanelBridge', deps }); return { name: 'PanelBridge' }; } },
    MultiPageSignupFlowHelpers: { createSignupFlowHelpers: (deps) => { calls.push({ name: 'SignupFlowHelpers', deps }); return { ensureSignupPostIdentityPageReadyInTab: () => {} }; } },
    MultiPageOpenAiMailRules: { createOpenAiMailRules: (deps) => { calls.push({ name: 'OpenAiMailRules', deps }); return { name: 'OpenAiMailRules' }; } },
    MultiPageBackgroundMailRuleRegistry: { createMailRuleRegistry: (deps) => { calls.push({ name: 'MailRuleRegistry', deps }); return { buildVerificationPollPayload: () => ({}) }; } },
    MultiPageBackgroundVerificationFlow: { createVerificationFlowHelpers: (deps) => { calls.push({ name: 'VerificationFlowHelpers', deps }); return { confirmCustomVerificationStepBypass: () => {}, resolveCustomEmailVerificationStep: () => {}, resolveVerificationStep: () => {} }; } },
    MultiPageBackgroundStep1: { createStep1Executor: (deps) => { calls.push({ name: 'Step1', deps }); return { nodeId: 'open-chatgpt' }; } },
    MultiPageBackgroundStep2: { createStep2Executor: (deps) => { calls.push({ name: 'Step2', deps }); return { nodeId: 'submit-signup-email' }; } },
  };

  const registry = moduleApi.createSignupExecutorRegistry({
    root,
    SIGNUP_PAGE_INJECT_FILES: ['content/utils.js', 'content/signup-page.js'],
    SIGNUP_ENTRY_URL: 'https://chatgpt.com/',
    SIGNUP_AUTH_ENTRY_URL: 'https://chatgpt.com/auth/login',
    addLog: () => {},
  });

  assert.equal(registry.executors.step1.nodeId, 'open-chatgpt');
  assert.equal(registry.executors.step2.nodeId, 'submit-signup-email');
  assert.deepEqual(calls.find((call) => call.name === 'Step2').deps.SIGNUP_PAGE_INJECT_FILES, ['content/utils.js', 'content/signup-page.js']);
});

test('keeps trial-ineligible marker out of UPI redeem executor deps', () => {
  const calls = [];
  const markCurrentRegistrationAccountTrialIneligible = () => {};
  const markCurrentRegistrationAccountUsed = () => {};
  const root = {
    MultiPageBackgroundEnableTotpMfa: {
      createEnableTotpMfaExecutor: (deps) => {
        calls.push({ name: 'EnableTotpMfa', deps });
        return { nodeId: 'enable-totp-mfa' };
      },
    },
    MultiPageBackgroundUpiRedeem: {
      createUpiRedeemExecutor: (deps) => {
        calls.push({ name: 'UpiRedeem', deps });
        return { checkRegistrationUpiTrialEligibility: () => ({}) };
      },
    },
  };

  const registry = moduleApi.createSignupExecutorRegistry({
    root,
    markCurrentRegistrationAccountTrialIneligible,
    markCurrentRegistrationAccountUsed,
  });

  const upiCall = calls.find((call) => call.name === 'UpiRedeem');
  assert.ok(upiCall, 'UPI redeem executor should be created');
  assert.equal(
    Object.prototype.hasOwnProperty.call(upiCall.deps, 'markCurrentRegistrationAccountTrialIneligible'),
    false
  );
  assert.equal(upiCall.deps.markCurrentRegistrationAccountUsed, markCurrentRegistrationAccountUsed);
  assert.equal(typeof registry.executors.upiRedeem.checkRegistrationUpiTrialEligibility, 'function');

  const totpCall = calls.find((call) => call.name === 'EnableTotpMfa');
  assert.ok(totpCall, 'TOTP/MFA executor should be created');
  assert.equal(totpCall.deps.markCurrentRegistrationAccountTrialIneligible, markCurrentRegistrationAccountTrialIneligible);
});
