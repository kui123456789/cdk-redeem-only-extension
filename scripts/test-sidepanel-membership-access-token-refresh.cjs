const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('sidepanel wires batch invalid-AT refresh from button to background service', () => {
  const renderer = read('sidepanel/account-records-membership-results-renderer.js');
  const actions = read('sidepanel/account-records-membership-actions.js');
  const accessTokenActions = read('sidepanel/account-records-membership-access-token-actions.js');
  const events = read('sidepanel/account-records-panel-events.js');
  const manager = read('sidepanel/account-records-manager.js');
  const checker = read('background/upi-credential-membership-checker.js');
  const messageRouter = read('background/message-router.js');
  const dispatcher = read('background/router/message-dispatcher.js');
  const background = read('background.js');

  assert.match(renderer, /data-upi-membership-refresh-invalid-at/);
  assert.match(accessTokenActions, /REFRESH_UPI_CREDENTIAL_MEMBERSHIP_ACCESS_TOKENS/);
  assert.match(events, /refreshUpiCredentialMembershipAccessTokens/);
  assert.match(manager, /refreshUpiCredentialMembershipAccessTokens/);
  assert.match(checker, /refreshUpiCredentialMembershipAccessTokens: refreshMembershipAccessTokens/);
  assert.match(messageRouter, /refreshUpiCredentialMembershipAccessTokens/);
  assert.match(dispatcher, /case 'REFRESH_UPI_CREDENTIAL_MEMBERSHIP_ACCESS_TOKENS'/);
  assert.match(background, /refreshUpiCredentialMembershipAccessTokens: \(\.\.\.args\)/);
});
