const test = require('node:test');
const assert = require('node:assert/strict');

const api = require('../sidepanel/account-records-free-export-preferences.js');

test('Free export verification URL preference defaults on and persists off', () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
  };
  const prefs = api.createFreeExportPreferences({ storage });
  assert.equal(prefs.getIncludeVerificationUrl(), true);
  assert.equal(prefs.setIncludeVerificationUrl(false), false);
  assert.equal(values.get('upiFreeExportIncludeVerificationUrl'), 'false');
  assert.equal(prefs.getIncludeVerificationUrl(), false);
  assert.equal(prefs.toggleIncludeVerificationUrl(), true);
});

test('Free export preference falls back on for invalid or unavailable storage', () => {
  const invalid = api.createFreeExportPreferences({ storage: { getItem: () => 'broken' } });
  assert.equal(invalid.getIncludeVerificationUrl(), true);
  const unavailable = api.createFreeExportPreferences({ storage: { getItem: () => { throw new Error('blocked'); } } });
  assert.equal(unavailable.getIncludeVerificationUrl(), true);
});
