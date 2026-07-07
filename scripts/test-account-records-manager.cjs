const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAccountRecordsViewModel;
delete globalThis.SidepanelAccountRecordsExport;
delete globalThis.SidepanelAccountRecordsSubscription;
delete globalThis.SidepanelAccountRecordsMembershipGroups;
delete globalThis.SidepanelAccountRecordsRedeemStatus;
delete globalThis.SidepanelAccountRecordsCdkPoolText;
delete globalThis.SidepanelAccountRecordsDeletionState;
delete globalThis.SidepanelAccountRecordsExportBuilders;
delete globalThis.SidepanelAccountRecordsRedeemPolicy;
delete globalThis.SidepanelAccountRecordsPasskeyHelpers;
delete globalThis.SidepanelAccountRecordsCredentialParser;
delete globalThis.SidepanelAccountRecordsStatusMeta;
delete globalThis.SidepanelAccountRecordsDisplayModel;
delete globalThis.SidepanelAccountRecordsFlowView;
delete globalThis.SidepanelAccountRecordsMembershipResultsRenderer;
delete globalThis.SidepanelAccountRecordsRenderer;
delete globalThis.SidepanelMembershipRedeemProgress;
delete globalThis.SidepanelAccountRecordsManager;
delete require.cache[require.resolve('../sidepanel/account-records-export.js')];
delete require.cache[require.resolve('../sidepanel/account-records-subscription.js')];
delete require.cache[require.resolve('../sidepanel/account-records-membership-groups.js')];
delete require.cache[require.resolve('../sidepanel/account-records-redeem-status.js')];
delete require.cache[require.resolve('../sidepanel/account-records-cdk-pool-text.js')];
delete require.cache[require.resolve('../sidepanel/account-records-deletion-state.js')];
delete require.cache[require.resolve('../sidepanel/account-records-export-builders.js')];
delete require.cache[require.resolve('../sidepanel/account-records-redeem-policy.js')];
delete require.cache[require.resolve('../sidepanel/account-records-passkey-helpers.js')];
delete require.cache[require.resolve('../sidepanel/account-records-credential-parser.js')];
delete require.cache[require.resolve('../sidepanel/account-records-status-meta.js')];
delete require.cache[require.resolve('../sidepanel/account-records-display-model.js')];
delete require.cache[require.resolve('../sidepanel/account-records-flow-view.js')];
delete require.cache[require.resolve('../sidepanel/account-records-membership-results-renderer.js')];
delete require.cache[require.resolve('../sidepanel/account-records-renderer.js')];
delete require.cache[require.resolve('../shared/membership-credential-format.js')];
delete require.cache[require.resolve('../sidepanel/account-records-manager.js')];
require('../sidepanel/account-records-export.js');
require('../sidepanel/account-records-subscription.js');
require('../sidepanel/account-records-membership-groups.js');
require('../sidepanel/account-records-redeem-status.js');
require('../sidepanel/account-records-cdk-pool-text.js');
require('../sidepanel/account-records-deletion-state.js');
require('../sidepanel/account-records-export-builders.js');
require('../sidepanel/account-records-redeem-policy.js');
require('../sidepanel/account-records-passkey-helpers.js');
require('../shared/membership-credential-format.js');
require('../sidepanel/account-records-credential-parser.js');
require('../sidepanel/account-records-status-meta.js');
require('../sidepanel/account-records-display-model.js');
require('../sidepanel/account-records-flow-view.js');
require('../sidepanel/account-records-membership-results-renderer.js');
require('../sidepanel/account-records-renderer.js');
require('../sidepanel/account-records-manager.js');

function createDisplayModel(overrides = {}) {
  return globalThis.SidepanelAccountRecordsDisplayModel.createAccountRecordsDisplayModel({
    createAccountRecordsStatusMeta: () => ({
      getUpiCredentialMembershipRowStatusMeta: () => ({}),
    }),
    buildMembershipViewModelRows: (rows) => rows,
    getMembershipCredentialFormatHelpers: () => ({
      isLikelyTimestamp: () => false,
    }),
    ...overrides,
  });
}

function createStubElement() {
  const listeners = new Map();
  const childNodes = new Map();
  return {
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    dispatchEvent(event) {
      const handler = listeners.get(event.type);
      if (handler) handler(event);
    },
    querySelector(selector) {
      if (!childNodes.has(selector)) {
        childNodes.set(selector, createStubElement());
      }
      return childNodes.get(selector);
    },
    querySelectorAll() {
      return [];
    },
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    focus() {},
    classList: {
      add() {},
      remove() {},
      toggle() { return false; },
      contains() { return false; },
    },
    style: {},
    dataset: {},
    scrollTop: 0,
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    hidden: false,
    checked: false,
  };
}

function createDomStub() {
  const elements = new Map();
  const dom = new Proxy({}, {
    get(_target, prop) {
      if (typeof prop !== 'string') {
        return undefined;
      }
      if (!elements.has(prop)) {
        elements.set(prop, createStubElement());
      }
      return elements.get(prop);
    },
  });
  return {
    dom,
    getElement(name) {
      if (!elements.has(name)) {
        elements.set(name, createStubElement());
      }
      return elements.get(name);
    },
  };
}

test('account records credential parser exposes the expected factory helpers', () => {
  const parser = globalThis.SidepanelAccountRecordsCredentialParser.createAccountRecordsCredentialParser({
    getMembershipCredentialFormatHelpers: () => require('../shared/membership-credential-format.js'),
  });

  assert.equal(typeof parser.parseUpiCredentialMembershipText, 'function');
  assert.equal(typeof parser.normalizeUpiCredentialMembershipCredential, 'function');
  assert.equal(typeof parser.parseUpiCredentialMembershipParts, 'function');
  assert.equal(typeof parser.normalizeUpiCredentialMembershipTotpSecret, 'function');
  assert.equal(typeof parser.parseUpiCredentialMembershipPasskeyMarker, 'function');
});

test('account records renderer exposes the expected factory helpers', () => {
  const rendererApi = globalThis.SidepanelAccountRecordsRenderer;
  assert.equal(typeof rendererApi?.createAccountRecordsRenderer, 'function');

  const renderer = rendererApi.createAccountRecordsRenderer();
  assert.equal(typeof renderer.renderAccountRecordsPanel, 'function');
  assert.equal(typeof renderer.renderUpiCredentialMembershipCheckResults, 'function');
  assert.equal(typeof renderer.updateHeader, 'function');
  assert.equal(typeof renderer.updateStats, 'function');
  assert.equal(typeof renderer.updatePagination, 'function');
});

test('display model does not backfill source passkey state when result already enables passkey', () => {
  const displayModel = createDisplayModel();

  const merged = displayModel.mergeUpiCredentialMembershipDisplayCredentialResult(
    {
      email: 'alpha@example.com',
      passkeyEnabled: true,
      passkeyCredentialId: 'credential-passkey',
      passkeyFactorId: 'source-factor',
      persisted: true,
    },
    {
      email: 'alpha@example.com',
      passkeyEnabled: true,
      twoFactorEnabled: false,
    }
  );

  assert.equal(merged.twoFactorEnabled, false);
  assert.equal(merged.passkeyApiPersisted, undefined);
});

test('display model marks deleted row keys as seen before filtering duplicates', () => {
  const displayModel = createDisplayModel({
    getUpiCredentialMembershipPoolRows: () => [
      { email: 'duplicate@example.com', source: 'pool' },
    ],
    getUpiCredentialMembershipCheckResults: () => ({
      items: [
        { email: 'duplicate@example.com', source: 'results', status: 'active' },
      ],
    }),
    buildUpiCredentialMembershipDisplayRowKey: (row, email) => String(row.email || email || '').trim().toLowerCase(),
    isRedeemPlusDeletedDisplayRow: (row) => row.source === 'pool',
  });

  assert.deepEqual(displayModel.buildUpiCredentialMembershipDisplayRows(), []);
});

test('createAccountRecordsManager fails loudly when redeem progress module is unavailable', () => {
  assert.throws(
    () => globalThis.SidepanelAccountRecordsManager.createAccountRecordsManager({}),
    /Membership redeem progress module is not loaded/
  );
});

test('summarizeAccountRunHistory preserves counts when view model global is unavailable', () => {
  assert.equal(globalThis.SidepanelAccountRecordsViewModel, undefined);
  globalThis.SidepanelMembershipRedeemProgress = {
    clampRedeemProgressPercent: () => 0,
    getUpiCredentialMembershipRedeemProgressMeta: () => ({}),
    renderUpiCredentialMembershipRedeemProgress: () => '',
  };
  const manager = globalThis.SidepanelAccountRecordsManager.createAccountRecordsManager({});

  assert.deepEqual(manager.summarizeAccountRunHistory([
    { displayStatus: 'success', retryCount: 0 },
    { finalStatus: 'running', retryCount: '2' },
    { displayStatus: 'failed', retryCount: 1 },
    { finalStatus: 'stopped', retryCount: -1 },
    { displayStatus: 'unknown', retryCount: 'bad' },
  ]), {
    total: 5,
    success: 1,
    running: 1,
    failed: 1,
    stopped: 1,
    retryRecordCount: 2,
    retryTotal: 3,
  });
});

test('login-only membership flow renders the login title in the status header', () => {
  globalThis.SidepanelMembershipRedeemProgress = {
    clampRedeemProgressPercent: () => 0,
    getUpiCredentialMembershipRedeemProgressMeta: () => ({}),
    renderUpiCredentialMembershipRedeemProgress: () => '',
  };

  const state = {
    getLatestState: () => ({
      accountRunHistory: [],
      upiCredentialMembershipCheckResults: {
        items: [
          {
            email: 'alpha@example.com',
            status: 'free',
          },
        ],
        flowMode: 'login-only',
        flowStage: 'login',
        flowStageEmail: 'alpha@example.com',
        running: true,
        total: 1,
        completed: 1,
      },
    }),
  };
  const domStub = createDomStub();
  const manager = globalThis.SidepanelAccountRecordsManager.createAccountRecordsManager({
    state,
    dom: domStub.dom,
    helpers: {},
    runtime: {},
    constants: {},
  });

  manager.render();

  const rendered = domStub.getElement('upiCredentialMembershipCheckResults').innerHTML;
  assert.match(rendered, /当前 alpha@example\.com · 登录/);
  assert.doesNotMatch(rendered, /当前 alpha@example\.com · 处理中/);
});
