const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('sidepanel exposes and wires the PIX CDK pool controls', () => {
  const html = read('sidepanel/sidepanel.html');
  const bindings = read('sidepanel/dom-bindings.js');
  const controller = read('sidepanel/upi-redeem-cdk-controller.js');
  const statusView = read('sidepanel/upi-redeem-cdk-status-view.js');
  const manager = read('sidepanel/cdk-pool-manager.js');
  const app = read('sidepanel/sidepanel-app-controller.js');

  for (const id of [
    'input-pix-redeem-cdkey-pool',
    'btn-import-pix-cdk-pool',
    'btn-delete-all-pix-cdk-pool',
    'pix-redeem-cdkey-pool-summary',
    'pix-redeem-cdkey-status-list',
  ]) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.match(bindings, new RegExp(id));
  }

  assert.match(html, /data-cdk-channel="pix"/);
  assert.match(controller, /\['upi', 'ideal', 'pix'\]/);
  assert.match(statusView, /pixRedeemCdkeyStatusList/);
  assert.match(manager, /btnImportPixCdkPool/);
  assert.match(app, /inputPixRedeemCdkeyPool/);
});

