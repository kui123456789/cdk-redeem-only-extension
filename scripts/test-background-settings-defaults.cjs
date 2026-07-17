const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

globalThis.self = globalThis;
delete globalThis.MultiPageBackgroundSettingsDefaults;
delete require.cache[require.resolve('../background/bootstrap/settings-defaults.js')];
require('../background/bootstrap/settings-defaults.js');

test('settings defaults include independent PIX canonical pool state', () => {
  const defaults = globalThis.MultiPageBackgroundSettingsDefaults.create().PERSISTED_SETTING_DEFAULTS;
  assert.equal(defaults.pixChannelRedeemCdkeyPoolText, '');
  assert.deepEqual(defaults.pixChannelRedeemCdkeyUsage, {});
  assert.equal(defaults.pixRedeemCdkeyPoolText, '');
  assert.deepEqual(defaults.pixRedeemCdkeyUsage, {});
});

test('background settings normalization recognizes PIX canonical pool fields', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');
  assert.match(source, /case 'pixChannelRedeemCdkeyPoolText':/);
  assert.match(source, /case 'pixChannelRedeemCdkeyUsage':/);
});
