const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAutoRunNormalizers;
const { createAutoRunNormalizers } = require('../sidepanel/auto-run-normalizers.js');

const normalizers = createAutoRunNormalizers({
  autoDelayDefaultMinutes: 30,
  autoDelayMaxMinutes: 1440,
  autoDelayMinMinutes: 1,
  autoRunThreadIntervalDefaultMinutes: 0,
  autoRunThreadIntervalMaxMinutes: 1440,
  autoRunThreadIntervalMinMinutes: 0,
  autoStepDelayDefaultSeconds: 10,
  autoStepDelayMaxSeconds: 600,
  autoStepDelayMinSeconds: 0,
});

test('removed contact verification poll attempts use configured defaults for bad fallbacks', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('', 6), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('bad', 6), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('', 0), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('bad', 0), 6);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('0', 6), 1);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollAttempts('99', 6), 60);
});

test('removed contact verification poll interval seconds use configured defaults for bad fallbacks', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('', 5), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('bad', 5), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('', 0), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('bad', 0), 5);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('0', 5), 1);
  assert.equal(normalizers.normalizeRemovedContactVerificationPollIntervalSeconds('99', 5), 60);
});

test('removed contact resend normalizers keep zero-capable fallbacks', () => {
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('bad', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactVerificationResendMaxAttempts('99', 1), 10);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('bad', 0), 0);
  assert.equal(normalizers.normalizeRemovedContactResendWaitSeconds('999', 20), 300);
});
