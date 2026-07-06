const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/settings-normalization.js');

function createNormalization() {
  return moduleApi.createSettingsNormalization({
    parseCustomEmailPoolEntryValue(value = '') {
      const raw = String(value || '').trim();
      const parts = raw.split(/-{3,}/).map((part) => part.trim());
      const email = parts[0].toLowerCase();
      const verificationUrl = parts.find((part) => /^https?:\/\//i.test(part)) || '';
      return {
        email,
        credential: verificationUrl ? '' : raw,
        verificationUrl,
      };
    },
    normalizeCustomEmailVerificationUrl(value = '') {
      return /^https?:\/\//i.test(String(value || '').trim()) ? String(value || '').trim() : '';
    },
    cryptoApi: { randomUUID: () => 'uuid-1' },
    verificationResendCountMin: 0,
    verificationResendCountMax: 20,
  });
}

test('normalizes verification resend counts within configured bounds', () => {
  const normalizers = createNormalization();
  assert.equal(normalizers.normalizeVerificationResendCount('', 3), 3);
  assert.equal(normalizers.normalizeVerificationResendCount('abc', 3), 3);
  assert.equal(normalizers.normalizeVerificationResendCount('-1', 3), 0);
  assert.equal(normalizers.normalizeVerificationResendCount('99', 3), 20);
});

test('normalizes custom email pool entries and filters unavailable rows', () => {
  const normalizers = createNormalization();
  const entries = normalizers.normalizeCustomEmailPoolEntryObjects([
    'USER@EXAMPLE.COM----https://assurivo.com/console/open.php?mail=user%40example.com',
    { email: 'used@example.com', used: true },
    { email: 'bad', enabled: true },
    { email: 'locked@example.com', trialEligibilityStatus: 'not-eligible' },
  ]);

  assert.equal(entries.length, 3);
  assert.equal(entries[0].email, 'user@example.com');
  assert.equal(entries[0].id, 'uuid-1');
  assert.equal(normalizers.isCustomEmailPoolEntryAvailable(entries[0]), true);
  assert.equal(normalizers.isCustomEmailPoolEntryAvailable(entries[1]), false);
  assert.equal(normalizers.isCustomEmailPoolEntryAvailable(entries[2]), false);
  assert.deepEqual(normalizers.getActiveCustomEmailPoolEmails?.(entries), undefined);
});

test('formats custom email pool entries with verification URLs', () => {
  const normalizers = createNormalization();
  assert.equal(
    normalizers.formatCustomEmailPoolEntryValue({
      email: 'user@example.com',
      verificationUrl: 'https://assurivo.com/console/open.php?mail=user%40example.com',
    }),
    'user@example.com----https://assurivo.com/console/open.php?mail=user%40example.com'
  );
});

test('normalizes provider domains and base URLs', () => {
  const normalizers = createNormalization();
  assert.equal(normalizers.normalizeCloudflareDomainValue('@Example.COM/path'), 'example.com');
  assert.deepEqual(normalizers.normalizeCloudflareDomains(['example.com', 'EXAMPLE.com', 'bad']), ['example.com']);
  assert.equal(normalizers.normalizeCloudflareTempEmailBaseUrlValue('example.com/api/?x=1#hash'), 'https://example.com/api');
  assert.equal(normalizers.normalizeCloudflareTempEmailReceiveMailboxValue('USER@Example.COM'), 'user@example.com');
  assert.equal(normalizers.normalizeMoemailDomainValue('https://mail.example.com/path'), 'mail.example.com');
});
