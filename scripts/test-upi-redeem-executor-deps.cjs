const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('UPI redeem submodules receive CDK pool parser dependency', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'background', 'steps', 'upi-redeem.js'),
    'utf8'
  );
  const sandbox = {
    console,
    Math,
    Date,
    Set,
    String,
    Object,
    Number,
    Boolean,
    Array,
    RegExp,
    Error,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  const capturedContexts = [];
  const factory = (context) => {
    capturedContexts.push(context);
    return {};
  };
  sandbox.MultiPageUpiRedeemSessionMaterial = { createUpiRedeemSessionMaterial: factory };
  sandbox.MultiPageUpiRedeemFreeEntry = { createUpiRedeemFreeEntry: factory };
  sandbox.MultiPageUpiRedeemChannelSubmission = { createUpiRedeemChannelSubmission: factory };
  sandbox.MultiPageUpiRedeemStatusPolling = { createUpiRedeemStatusPolling: factory };
  sandbox.MultiPageUpiRedeemFinalize = { createUpiRedeemFinalize: factory };

  sandbox.MultiPageBackgroundUpiRedeem.createUpiRedeemExecutor({
    chrome: {},
    getTabId: () => 0,
    isTabAlive: () => true,
    registerTab: () => {},
    sendTabMessageUntilStopped: async () => ({}),
  });

  assert.ok(capturedContexts.length >= 5, 'expected all UPI redeem submodules to be initialized');
  for (const context of capturedContexts) {
    assert.equal(typeof context.parseCdkeyPoolText, 'function');
    assert.deepEqual(Array.from(context.parseCdkeyPoolText(' A \r\nB\nA\n\n C \nB')), ['A', 'B', 'C']);
  }
});
