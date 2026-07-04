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
  'background/steps/submit-signup-email.js',
  'background/steps/fill-password.js',
  'background/steps/fetch-signup-code.js',
  'shared/flow-capabilities.js',
  'sidepanel/sidepanel.js',
  'sidepanel/sidepanel.html',
  'sidepanel/styles/settings.css',
  'sidepanel/sidepanel.css',
  'scripts/audit-smoke-tests.mjs',
];

const REMOVED_CONTENT_SCRIPT = 'content/signup-phone-page.js';

const PHONE_SMS_PATTERNS = [
  { label: 'signup phone content script reference', pattern: /signup-phone-page|content\/signup-phone-page\.js/ },
  { label: 'phone signup capability flag', pattern: /\b(?:SIGNUP_METHOD_PHONE|supportsPhoneSignup|phoneVerificationEnabled)\b/ },
  { label: 'phone signup method branch', pattern: /\bsignupMethod\b.{0,80}['"]phone['"]|['"]phone['"].{0,80}\bsignupMethod\b/ },
  { label: 'phone identity branch', pattern: /\baccountIdentifierType\b.{0,80}['"]phone['"]|['"]phone['"].{0,80}\baccountIdentifierType\b/ },
  { label: 'signup phone state key', pattern: /\bsignupPhone(?:[A-Z]\w*)?\b/ },
  { label: 'phone verification helper', pattern: /\b(?:createPhoneVerificationHelpers|phoneVerificationHelpers|executeSignupPhoneCodeStep|completeSignupPhoneVerificationFlow)\b/ },
  { label: 'phone provider setting key', pattern: /\b\w*(?:removedPhoneProvider|phoneProvider|phoneCode|phoneSignup)\w*\b/i },
  { label: 'SMS provider identifier', pattern: /\b\w*(?:fiveSim|removedSms|removedSmsVendor|removedSmsVendorB|smsVerificationNumber|grizzlySms)\w*\b/i },
  { label: 'removed text pool phone provider', pattern: /\b(?:removedRemovedTextPool|REMOVED_PHONE_PROVIDER_REMOVED_TEXT_POOL|removedTextPool(?:BaseUrl|ApiKey|Country|CountryId|CountryLabel|CountryFallback|MaxPrice|MinPrice|PreferredPrice|Service|ServiceCode))\b|Removed\s+Text\s+Pool/i },
  { label: 'SMS provider label', pattern: /\b(?:5sim|GrizzlySMS)\b|Removed\s+SMS/i },
  { label: 'phone activation/reuse helper', pattern: /\b\w*(?:phoneActivation|freePhoneReuse|supportsPhoneActivationReuseProvider|supportsFreePhoneReuseProvider)\w*\b/i },
  { label: 'phone signup UI text', pattern: /手机接码|手机号注册|短信接码|接码平台|手机号接码|手机验证码/ },
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
