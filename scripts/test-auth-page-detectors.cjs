const assert = require('node:assert/strict');
const test = require('node:test');

delete globalThis.MultiPageAuthPageDetectors;
const detectors = require('../content/auth-page-detectors.js');

test('exports detector global and CommonJS API', () => {
  assert.equal(globalThis.MultiPageAuthPageDetectors, detectors);
  assert.equal(typeof detectors.normalizePageText, 'function');
});

test('recognizes Hindi auth labels', () => {
  assert.equal(detectors.isLoginEntryText('लॉग इन करें'), true);
  assert.equal(detectors.isContinueText('जारी रखें'), true);
  assert.equal(detectors.isResendEmailText('ईमेल दोबारा भेजें'), true);
});

test('does not treat Hindi plans/pricing as signup', () => {
  assert.equal(detectors.isSignupEntryText('प्लान्स और प्राइसिंग देखें'), false);
});

test('recognizes English auth labels', () => {
  assert.equal(detectors.isSignupEntryText('Sign up'), true);
  assert.equal(detectors.isLoginEntryText('Log in'), true);
  assert.equal(detectors.isContinueText('Continue'), true);
  assert.equal(detectors.isResendEmailText('Resend email'), true);
});

test('recognizes auth URL detectors', () => {
  assert.equal(detectors.isPasswordPageUrl('https://auth.openai.com/create-account/password'), true);
  assert.equal(detectors.isAboutYouUrl('https://auth.openai.com/about-you'), true);
  assert.equal(detectors.isSignupProfileUrl('https://accounts.openai.com/u/signup/profile?x=1'), true);
  assert.equal(detectors.isChatGptHomeUrl('https://chatgpt.com/'), true);
});
