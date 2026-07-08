const assert = require('node:assert/strict');
const test = require('node:test');

delete globalThis.MultiPageAuthPageDetectors;
const detectors = require('../content/auth-page-detectors.js');
globalThis.window = globalThis;
require('../content/signup-entry-page.js');
require('../content/signup-page-detector.js');
require('../content/signup-verification-page.js');

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

test('rejects non-auth action lookalikes', () => {
  assert.equal(detectors.isSignupEntryText('Registered devices'), false);
  assert.equal(detectors.isSignupEntryText('Registration status'), false);
  assert.equal(detectors.isSignupEntryText('View plans and pricing'), false);
  assert.equal(detectors.isSignupEntryText('प्लान्स और प्राइसिंग देखें'), false);
  assert.equal(detectors.isContinueText('Continue with Google'), false);
  assert.equal(detectors.isContinueText('Continue with Microsoft'), false);
  assert.equal(detectors.isResendEmailText('Resend marketing email'), false);
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

function makeAction(text, options = {}) {
  const {
    visible = true,
    enabled = true,
    attrs = {},
  } = options;
  return {
    textContent: text,
    value: '',
    disabled: !enabled,
    visible,
    tagName: 'BUTTON',
    getAttribute(name) {
      if (name === 'aria-disabled') return enabled ? 'false' : 'true';
      return attrs[name] || '';
    },
  };
}

function makeDocument(actions) {
  return {
    body: { textContent: '', innerText: '' },
    title: '',
    readyState: 'complete',
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return actions;
    },
  };
}

const domContext = {
  isVisibleElement: (el) => el?.visible !== false,
  isActionEnabled: (el) => Boolean(el && !el.disabled && el.getAttribute?.('aria-disabled') !== 'true'),
  getActionText: (el) => detectors.normalizePageText([el?.textContent, el?.value].filter(Boolean).join(' ')),
  getPageTextSnapshot: () => '',
};

test('signup entry helper uses shared auth detectors for candidates', () => {
  const registeredDevices = makeAction('Registered devices');
  const signup = makeAction('Sign up');
  const helper = globalThis.MultiPageSignupEntryPage.createSignupEntryPage({
    ...domContext,
    authPageDetectors: detectors,
    documentRef: makeDocument([registeredDevices, signup]),
    windowRef: { innerWidth: 1024, innerHeight: 768, outerWidth: 1024, outerHeight: 768 },
  });

  assert.equal(helper.findSignupEntryTrigger(), signup);
  assert.equal(helper.isSignupEntryTriggerText('Registered devices'), false);
});

test('signup entry helper ignores OAuth provider continue buttons', () => {
  const provider = makeAction('Continue with Google');
  const continueButton = makeAction('Continue');
  const helper = globalThis.MultiPageSignupEntryPage.createSignupEntryPage({
    ...domContext,
    authPageDetectors: detectors,
    documentRef: makeDocument([provider, continueButton]),
    windowRef: { innerWidth: 1024, innerHeight: 768, outerWidth: 1024, outerHeight: 768 },
  });

  assert.equal(helper.getSignupEmailContinueButton(), continueButton);
});

test('page detector and verification helper use shared action detectors', () => {
  const provider = makeAction('Continue with Google');
  const continueButton = makeAction('Continue');
  const pageDetector = globalThis.MultiPageSignupPageDetector.createSignupPageDetector({
    authPageDetectors: detectors,
    documentRef: makeDocument([provider, continueButton]),
    locationRef: { href: 'https://auth.openai.com/', pathname: '/' },
    getSignupDomUtils: () => domContext,
    getSignupVerificationPageHelpers: () => ({}),
  });
  assert.equal(pageDetector.findContinueButton(), continueButton);

  const marketing = makeAction('Resend marketing email');
  const resend = makeAction('Resend email');
  const verification = globalThis.MultiPageSignupVerificationPage.createSignupVerificationPage({
    ...domContext,
    authPageDetectors: detectors,
    documentRef: makeDocument([marketing, resend]),
    locationRef: { pathname: '/email-verification' },
    verificationCodeInputSelector: 'input[name="code"]',
    loginTotpVerificationPattern: /totp/i,
    oneTimeCodeLoginPattern: /one-time/i,
    resendVerificationCodePattern: /resend/i,
    invalidVerificationCodePattern: /invalid/i,
    getAssociatedInputText: () => '',
  });
  assert.equal(verification.findResendVerificationCodeTrigger(), resend);
});

test('verification helper falls back to visible Resend email text nodes', () => {
  const clickableParent = makeAction('', { attrs: { role: 'button' } });
  const resendText = {
    textContent: 'Resend email',
    value: '',
    visible: true,
    disabled: false,
    getAttribute(name) {
      return name === 'aria-disabled' ? 'false' : '';
    },
    closest() {
      return clickableParent;
    },
  };
  const verification = globalThis.MultiPageSignupVerificationPage.createSignupVerificationPage({
    ...domContext,
    authPageDetectors: detectors,
    documentRef: {
      ...makeDocument([]),
      querySelectorAll(selector) {
        return String(selector || '').includes('span') ? [resendText] : [];
      },
    },
    locationRef: { pathname: '/email-verification' },
    verificationCodeInputSelector: 'input[name="code"]',
    loginTotpVerificationPattern: /totp/i,
    oneTimeCodeLoginPattern: /one-time/i,
    resendVerificationCodePattern: /resend/i,
    invalidVerificationCodePattern: /invalid/i,
    getAssociatedInputText: () => '',
  });

  assert.equal(verification.findResendVerificationCodeTrigger(), clickableParent);
});
