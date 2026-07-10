const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { createAutoRunRetryPolicy } = require('../background/auto-run/retry-policy.js');

function loadFlowCapabilities() {
  const sandbox = { self: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../shared/flow-capabilities.js'), 'utf8'),
    sandbox,
    { filename: 'shared/flow-capabilities.js' }
  );
  return sandbox.self.MultiPageFlowCapabilities;
}

test('custom email pool cannot start auto-run without an available email', () => {
  const registry = loadFlowCapabilities().createFlowCapabilityRegistry();
  const result = registry.validateAutoRunStart({
    state: {
      emailGenerator: 'custom-pool',
      customEmailPoolEntries: [],
      customEmailPool: [],
    },
    totalRuns: 1,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'custom_email_pool_empty');
});

test('custom email pool cannot schedule more rounds than available emails', () => {
  const registry = loadFlowCapabilities().createFlowCapabilityRegistry();
  const result = registry.validateAutoRunStart({
    state: {
      emailGenerator: 'custom-pool',
      customEmailPoolEntries: [
        { email: 'one@example.com', enabled: true, used: false },
        { email: 'used@example.com', enabled: true, used: true },
      ],
      customEmailPool: ['one@example.com'],
    },
    totalRuns: 2,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors[0].code, 'custom_email_pool_insufficient');
});

test('custom email pool exhaustion is terminal and never retryable', () => {
  const policy = createAutoRunRetryPolicy({
    AUTO_RUN_MAX_RETRIES_PER_ROUND: 3,
    getErrorMessage: (error) => error?.message || String(error || ''),
  });
  const result = policy.evaluateAttemptFailure({
    error: new Error('CUSTOM_EMAIL_POOL_EXHAUSTED::自定义邮箱池没有可用邮箱。'),
    attemptRun: 1,
    autoRunSkipFailures: true,
    maxAttemptsForRound: 4,
  });
  const action = policy.selectFailureAction(result);

  assert.equal(result.blockedByCustomEmailPoolEmpty, true);
  assert.equal(result.canRetry, false);
  assert.equal(action.code, 'fail_custom_email_pool_empty');
  assert.equal(action.shouldStop, true);
});
