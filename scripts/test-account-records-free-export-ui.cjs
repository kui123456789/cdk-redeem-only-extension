const test = require('node:test');
const assert = require('node:assert/strict');

const rendererApi = require('../sidepanel/account-records-membership-results-renderer.js');
const accountRendererApi = require('../sidepanel/account-records-renderer.js');
const panelEventsApi = require('../sidepanel/account-records-panel-events.js');
const resultOpsApi = require('../sidepanel/account-records-membership-result-ops.js');

function renderWithPreference(includeVerificationUrl) {
  const container = {
    innerHTML: '',
    querySelector: () => null,
  };
  const renderer = rendererApi.createAccountRecordsMembershipResultsRenderer({
    dom: { upiCredentialMembershipCheckResults: container },
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({ items: [{}], completed: 1, total: 1 }),
    buildUpiCredentialMembershipDisplayRows: () => [{
      email: 'free@example.com', status: 'free', enabled: true, accessToken: 'at-token',
    }],
    getUpiCredentialMembershipUiGroup: () => 'free',
    summarizeMembershipViewModelRows: () => ({ free: 1, 'upi-plus': 0, 'ideal-plus': 0 }),
    getFreeExportIncludeVerificationUrl: () => includeVerificationUrl,
  });
  renderer.renderUpiCredentialMembershipCheckResults();
  return container.innerHTML;
}

test('Free export verification URL toggle renders its persisted state', () => {
  assert.match(renderWithPreference(true), /<button(?=[^>]*is-active)(?=[^>]*data-upi-membership-toggle-export-verification-url)/);
  assert.match(renderWithPreference(true), /aria-pressed="true"/);
  assert.match(renderWithPreference(true), /取件地址：开/);
  assert.match(renderWithPreference(false), /取件地址：关/);
  assert.match(renderWithPreference(false), /aria-pressed="false"/);
  assert.doesNotMatch(renderWithPreference(false), /<button(?=[^>]*is-active)(?=[^>]*data-upi-membership-toggle-export-verification-url)/);
});

test('account renderer forwards the Free export verification URL preference', () => {
  const container = { innerHTML: '', querySelector: () => null };
  const renderer = accountRendererApi.createAccountRecordsRenderer({
    dom: { upiCredentialMembershipCheckResults: container },
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({ items: [{}], completed: 1, total: 1 }),
    buildUpiCredentialMembershipDisplayRows: () => [{
      email: 'free@example.com', status: 'free', enabled: true, accessToken: 'at-token',
    }],
    getUpiCredentialMembershipUiGroup: () => 'free',
    summarizeMembershipViewModelRows: () => ({ free: 1, 'upi-plus': 0, 'ideal-plus': 0 }),
    getFreeExportIncludeVerificationUrl: () => false,
  });

  renderer.renderUpiCredentialMembershipCheckResults();

  assert.match(container.innerHTML, /取件地址：关/);
});

test('Free export verification URL toggle persists and re-renders on click', () => {
  let toggles = 0;
  let renders = 0;
  const target = {};
  const events = panelEventsApi.createAccountRecordsPanelEvents({
    findClosest: (_target, selector) => selector === '[data-upi-membership-toggle-export-verification-url]' ? target : null,
    toggleFreeExportIncludeVerificationUrl: () => {
      toggles += 1;
      return false;
    },
    render: () => {
      renders += 1;
    },
  });

  events.handleUpiCredentialMembershipCheckResultsClick({ target });

  assert.equal(toggles, 1);
  assert.equal(renders, 1);
});

test('membership exports send the verification URL preference only for Free rows', async () => {
  const messages = [];
  const operations = resultOpsApi.createAccountRecordsMembershipResultOps({
    getFreeExportIncludeVerificationUrl: () => false,
    getUpiCredentialMembershipCheckResults: () => ({ items: [] }),
    refreshUpiCredentialMembershipCheckResults: async () => null,
    buildUpiCredentialMembershipDisplayRows: () => [
      { email: 'free@example.com', status: 'free' },
      { email: 'paid@example.com', status: 'paid' },
    ],
    isUpiCredentialMembershipRowInResultGroup: (item, status) => item.status === status,
    runtime: {
      sendMessage: async (message) => {
        messages.push(message);
        return { fileContent: 'export', fileName: 'members.txt' };
      },
    },
    helpers: { downloadTextFile: async () => ({}) },
  });

  await operations.exportUpiCredentialMembershipCheckResultTextFile('free');
  await operations.exportUpiCredentialMembershipCheckResultTextFile('paid');

  assert.equal(messages[0].payload.includeVerificationUrl, false);
  assert.equal(Object.hasOwn(messages[1].payload, 'includeVerificationUrl'), false);
});
