const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/signup-executor-registry.js');

function createFactory(name, calls) {
  return {
    [`create${name}`]: (deps) => {
      calls.push({ name, deps });
      return { name, deps };
    },
  };
}

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
