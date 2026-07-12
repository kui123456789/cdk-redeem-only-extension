const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backgroundSource = fs.readFileSync(path.join(__dirname, '..', 'background.js'), 'utf8');

test('fetch-signup-code missing verification input is parked by timer before restart', () => {
  assert.match(backgroundSource, /function\s+isSignupVerificationInputMissingFailure\s*\(/);
  assert.match(backgroundSource, /未找到验证码输入框/);
  assert.match(backgroundSource, /isSignupVerificationInputMissingFailure\(err\)[\s\S]{0,240}parkFetchSignupCodeRestart\(/);
});
