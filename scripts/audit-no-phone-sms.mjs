import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const TARGET_FILES = [
  'manifest.json',
  'background.js',
  'background/message-router.js',
  'background/auto-run-controller.js',
  'background/runtime-state.js',
  'background/signup-flow-helpers.js',
  'background/account-run-history.js',
  'background/logging-status.js',
  'background/verification-flow.js',
  'background/upi-credential-membership-checker.js',
  'background/registration-email-state.js',
  'background/steps/submit-signup-email.js',
  'background/steps/set-gpt-password.js',
  'background/steps/fill-password.js',
  'background/steps/fetch-signup-code.js',
  'shared/flow-capabilities.js',
  'shared/source-registry.js',
  'content/activation-utils.js',
  'content/utils.js',
  'content/operation-delay.js',
  'content/auth-page-recovery.js',
  'content/signup-dom-utils.js',
  'content/signup-entry-page.js',
  'content/signup-verification-page.js',
  'content/signup-page.js',
  'sidepanel/sidepanel.js',
  'sidepanel/account-records-manager.js',
  'sidepanel/sidepanel.html',
  'sidepanel/styles/settings.css',
  'sidepanel/sidepanel.css',
  'scripts/audit-smoke-tests.mjs',
];

const REMOVED_CONTENT_SCRIPT = 'content/signup-phone-page.js';

const PHONE_SMS_PATTERNS = [
  { label: 'signup phone content script reference', pattern: /signup-phone-page|content\/signup-phone-page\.js/i },
  { label: 'signup phone symbol', pattern: /\b(?:SignupPhone|signupPhone|SIGNUP_PHONE)\w*\b/i },
  { label: 'phone entry state', pattern: /\b(?:phone_entry_page|add_phone_page|phone_verification_page|phone_verification|add_phone)\b/i },
  { label: 'phone auth route slug', pattern: /add[-_]phone|phone[-_]verification/i },
  { label: 'phone auth camelCase branch', pattern: /\b(?:addPhone|phoneVerification)\w*\b/i },
  { label: 'hosted checkout phone/text pool state', pattern: /\bhostedCheckout(?:PhoneNumber|RemovedTextPool\w*)\b/ },
  { label: 'phone identity field', pattern: /\bphoneNumber\b/ },
  { label: 'legacy pay phone setting', pattern: /\blegacyPay(?:Phone|HelperPhone)\w*\b/i },
  { label: 'local SMS helper setting', pattern: /\b(?:localSms|smsHelper)\w*\b|sms-pool/i },
  { label: 'signup phone helper function', pattern: /\b(?:dispatchSignupPhone|ensureSignupPhone|isSignupPhone)\w*\b/i },
  { label: 'phone verification failure classifier', pattern: /\bisPhoneVerificationFailure\b/i },
  { label: 'runtime phone or SMS Chinese text', pattern: /手机号验证|手机号|手机号码|短信|接码/i },
  { label: 'phone verification allow flag', pattern: /allowPhoneVerificationPage/i },
  { label: 'loaded signup phone command', pattern: /\b(?:SUBMIT_PHONE_NUMBER|ENSURE_SIGNUP_PHONE_ENTRY_READY)\b/i },
  { label: 'loaded signup phone selector or trigger', pattern: /\b(?:SIGNUP_PHONE_INPUT_SELECTOR|SIGNUP_SWITCH_TO_PHONE_PATTERN|SIGNUP_PHONE_ACTION_PATTERN|findSignupUsePhoneTrigger|getSignupPhoneInput|waitForSignupPhoneEntryState|submitSignupPhoneNumberAndContinue)\b/i },
  { label: 'loaded signup phone helper module reference', pattern: /\b(?:MultiPageSignupPhonePage|createSignupPhonePage)\b/i },
  { label: 'loaded signup phone operation label', pattern: /signup-phone-entry|submit-signup-phone|switch-to-signup-phone|signup-phone-number/i },
  { label: 'post-login phone verification command', pattern: /post-login-phone-verification/i },
  { label: 'loaded signup phone state branch', pattern: /['"]phone_entry['"]|switchToPhoneTrigger/i },
  { label: 'phone signup capability flag', pattern: /\b(?:SIGNUP_METHOD_PHONE|supportsPhoneSignup|phoneVerificationEnabled)\b/i },
  { label: 'phone signup method branch', pattern: /\bsignupMethod\b\s*={2,3}\s*['"]phone['"]|\bsignupMethod\b.{0,80}['"]phone['"]|['"]phone['"].{0,80}\bsignupMethod\b/i },
  { label: 'phone identity equality branch', pattern: /\baccountIdentifierType\b\s*={2,3}\s*['"]phone['"]/i },
  { label: 'phone identity branch', pattern: /\baccountIdentifierType\b.{0,80}['"]phone['"]|['"]phone['"].{0,80}\baccountIdentifierType\b/i },
  { label: 'signup phone state key', pattern: /\bsignupPhone(?:[A-Z]\w*)?\b/i },
  { label: 'phone verification helper', pattern: /\b(?:createPhoneVerificationHelpers|phoneVerificationHelpers|executeSignupPhoneCodeStep|completeSignupPhoneVerificationFlow)\b/i },
  { label: 'phone provider setting key', pattern: /\b\w*(?:removedPhoneProvider|phoneProvider|phoneCode|phoneSignup)\w*\b/i },
  { label: 'SMS provider identifier', pattern: /\b\w*(?:fiveSim|removedSms|removedSmsVendor|removedSmsVendorB|smsVerificationNumber|grizzlySms)\w*\b/i },
  { label: 'removed text pool phone provider', pattern: /\b(?:removedRemovedTextPool|REMOVED_PHONE_PROVIDER_REMOVED_TEXT_POOL|removedTextPool(?:BaseUrl|ApiKey|Country|CountryId|CountryLabel|CountryFallback|MaxPrice|MinPrice|PreferredPrice|Service|ServiceCode))\b|Removed\s+Text\s+Pool/i },
  { label: 'phone verification URL pool import format', pattern: /phone----verificationUrl/ },
  { label: 'SMS pool UI identifier', pattern: /sms-pool/ },
  { label: 'removed text pool phone CSS', pattern: /removed-text-pool-phone/ },
  { label: 'SMS provider label', pattern: /\b(?:5sim|GrizzlySMS)\b|Removed\s+SMS/i },
  { label: 'phone activation/reuse helper', pattern: /\b\w*(?:phoneActivation|freePhoneReuse|supportsPhoneActivationReuseProvider|supportsFreePhoneReuseProvider)\w*\b/i },
  { label: 'phone signup UI text', pattern: /手机接码|手机号注册|短信接码|接码平台|手机号接码/ },
];

const matches = [];
const removedContentScriptPath = path.join(ROOT_DIR, REMOVED_CONTENT_SCRIPT);
if (fs.existsSync(removedContentScriptPath)) {
  matches.push({
    file: REMOVED_CONTENT_SCRIPT,
    line: 1,
    label: 'deleted phone signup content script still exists',
    text: REMOVED_CONTENT_SCRIPT,
  });
}

for (const relativePath of TARGET_FILES) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing audit target: ${relativePath}`);
  }

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { label, pattern } of PHONE_SMS_PATTERNS) {
      if (pattern.test(line)) {
        matches.push({
          file: relativePath,
          line: index + 1,
          label,
          text: line.trim(),
        });
      }
    }
  });
}

if (matches.length) {
  console.error('Phone SMS signup remnants found:');
  for (const match of matches) {
    console.error(`${match.file}:${match.line}: ${match.label}: ${match.text}`);
  }
  process.exit(1);
}

console.log('No phone SMS signup remnants found.');
