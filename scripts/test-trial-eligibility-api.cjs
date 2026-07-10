const assert = require('node:assert/strict');
const test = require('node:test');
const {
  normalizeTrialEligibilityApiItem,
  isTrialEligibilityAccountIneligibleDecision,
  isTrialEligibilityTokenInvalidDecision,
  isTrialEligibilityEligibleDecision,
  isTrialEligibilityChannelAllowed,
  isTrialEligibilityDecisionEmailMismatch,
  buildTrialEligibilityEmailMismatchReason,
} = require('../shared/trial-eligibility-api.js');

test('eligible coupon enters Free even when UPI channel is denied', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: true,
    reason: 'eligible',
    upi_eligible: false,
    upi_eligible_reason: 'account-not-phone',
    ideal_eligible: true,
    ideal_eligible_reason: null,
    reg_type: 'email',
    email: 'a@example.com',
  });

  assert.equal(isTrialEligibilityEligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'eligible');
  assert.equal(decision.upiChannelEligibilityStatus, 'ineligible');
  assert.equal(decision.upiChannelEligibilityReason, 'account-not-phone');
  assert.equal(decision.idealChannelEligibilityStatus, 'eligible');
  assert.equal(isTrialEligibilityChannelAllowed(decision, 'upi'), false);
  assert.equal(isTrialEligibilityChannelAllowed(decision, 'ideal'), true);
});

test('eligible coupon enters Free even when both channels are denied', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: true,
    reason: 'eligible',
    upi_eligible: false,
    upi_eligible_reason: 'feature-disabled',
    ideal_eligible: false,
    ideal_eligible_reason: 'email-not-whitelisted',
  });

  assert.equal(isTrialEligibilityEligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'eligible');
  assert.equal(decision.upiChannelEligibilityStatus, 'ineligible');
  assert.equal(decision.idealChannelEligibilityStatus, 'ineligible');
});

test('not eligible coupon is account ineligible and should not enter Free', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: false,
    reason: 'not-eligible',
    message: '账号没有试用资格',
  });

  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), true);
  assert.equal(decision.trialEligibilityStatus, 'ineligible');
  assert.match(decision.trialEligibilityReason, /账号没有试用资格|not-eligible/);
});

test('token invalid is not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: false,
    reason: 'jwt-expired',
    message: 'JWT 已过期',
  });

  assert.equal(isTrialEligibilityTokenInvalidDecision(decision), true);
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityStatus, 'failed');
});

test('missing eligible field is incomplete check, not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'eligible',
    upi_eligible: true,
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.match(decision.trialEligibilityReason, /缺少 eligible/);
});

test('missing token_ok field is incomplete check, not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    eligible: true,
    reason: 'eligible',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.match(decision.trialEligibilityReason, /缺少 token_ok/);
});

test('unknown coupon state without explicit eligible false is failed check', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'unknown-coupon-state',
    message: 'OpenAI 优惠状态未知',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityRetryable, true);
  assert.equal(decision.trialEligibilityTransientFailure, true);
});

test('fetch-error is retryable network fluctuation and not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    reason: 'fetch-error',
    message: '后端请求 OpenAI 失败',
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityRetryable, true);
  assert.equal(decision.trialEligibilityTransientFailure, true);
});

test('HTML buffer response is retryable failure and not account ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: false,
    reason: {
      type: 'Buffer',
      data: [60, 104, 116, 109, 108, 62, 10, 32, 60, 104, 101, 97, 100, 62],
    },
  });

  assert.equal(decision.trialEligibilityStatus, 'failed');
  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), false);
  assert.equal(decision.trialEligibilityRetryable, true);
  assert.equal(decision.trialEligibilityTransientFailure, true);
  assert.equal(decision.trialEligibilityReasonCode, 'html-response');
  assert.match(decision.trialEligibilityReason, /HTML 页面/);
});

test('response email mismatch is detected before marking target ineligible', () => {
  const decision = normalizeTrialEligibilityApiItem({
    token_ok: true,
    eligible: false,
    reason: 'not-eligible',
    email: 'other@icloud.com',
  });

  assert.equal(isTrialEligibilityAccountIneligibleDecision(decision), true);
  assert.equal(isTrialEligibilityDecisionEmailMismatch(decision, 'target@icloud.com'), true);
  assert.match(buildTrialEligibilityEmailMismatchReason(decision, 'target@icloud.com'), /other@icloud\.com.*target@icloud\.com/);
  assert.equal(isTrialEligibilityDecisionEmailMismatch(decision, 'other@icloud.com'), false);
});
