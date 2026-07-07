const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/chatgpt-session-reader-settings.js');

function normalizeBoundedInteger(value, fallback, min, max) {
  const numeric = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(numeric)) {
    return Math.max(min, Math.min(max, Number(fallback) || min));
  }
  return Math.max(min, Math.min(max, numeric));
}

function createSettings() {
  return moduleApi.createChatgptSessionReaderSettings({
    chatgptSessionReaderModeUs: 'us_pp',
    chatgptSessionReaderModeJp: 'jp_pp',
    defaultChatgptSessionReaderMode: 'us_pp',
    normalizePlusRemovedContactOauthDelaySeconds: (value) => normalizeBoundedInteger(value, 10, 0, 3600),
    normalizeRemovedContactResendWaitSeconds: (value, fallback = 20) => normalizeBoundedInteger(value, fallback, 0, 3600),
    normalizeRemovedContactVerificationResendMaxAttempts: (value, fallback = 1) => normalizeBoundedInteger(value, fallback, 0, 20),
    normalizeRemovedContactVerificationPollAttempts: (value, fallback = 6) => normalizeBoundedInteger(value, fallback, 1, 60),
    normalizeRemovedContactVerificationPollIntervalSeconds: (value, fallback = 5) => normalizeBoundedInteger(value, fallback, 1, 120),
    normalizeChatgptSessionReaderConversionProxyUrlValue(value = '') {
      const rawValue = String(value || '').trim();
      if (!rawValue) return '';
      try {
        const parsed = new URL(rawValue);
        const protocol = String(parsed.protocol || '').replace(/:$/g, '').trim().toLowerCase();
        const host = String(parsed.hostname || '').trim();
        const port = String(parsed.port || '').trim();
        if (!['http', 'https', 'socks4', 'socks5', 'socks5h'].includes(protocol) || !host || !port) {
          return rawValue;
        }
        return `${protocol}://${host}:${port}`;
      } catch {
        return rawValue;
      }
    },
    normalizeChatgptSessionReaderCloudConversionApiUrlValue(value = '') {
      const rawValue = String(value || '').trim();
      if (!rawValue) return '';
      try {
        const parsed = new URL(rawValue);
        parsed.hash = '';
        return parsed.toString();
      } catch {
        return rawValue;
      }
    },
    normalizeChatgptSessionReaderCloudConversionApiKeyValue: (value = '') => String(value || '').trim(),
    normalizeRemovedContactVerificationUrlValue(value = '') {
      const rawValue = String(value || '').trim();
      if (!rawValue) return '';
      const parsed = new URL(rawValue);
      parsed.searchParams.delete('t');
      return parsed.toString();
    },
  });
}

test('normalizes session reader profiles with legacy values and URL cleanup', () => {
  const settings = createSettings();
  const profile = settings.normalizeChatgptSessionReaderProfileValue({
    plusRemovedContactOauthDelaySeconds: '99',
    chatgptSessionReaderCloudConversionEnabled: 1,
    chatgptSessionReaderCloudConversionApiUrl: 'https://example.com/path?x=1#drop',
    chatgptSessionReaderCloudConversionApiKey: ' key ',
    chatgptSessionReaderConversionProxyUrl: 'SOCKS5://127.0.0.1:1080',
    removedContactVerificationUrl: 'https://mail.example/open.php?mail=a%40b.com&t=123',
    removedContactFirstResendWaitSeconds: '-5',
    removedContactVerificationPollAttempts: '99',
  });

  assert.equal(profile.plusRemovedContactOauthDelaySeconds, 99);
  assert.equal(profile.chatgptSessionReaderCloudConversionEnabled, true);
  assert.equal(profile.chatgptSessionReaderCloudConversionApiUrl, 'https://example.com/path?x=1');
  assert.equal(profile.chatgptSessionReaderCloudConversionApiKey, 'key');
  assert.equal(profile.chatgptSessionReaderConversionProxyUrl, 'socks5://127.0.0.1:1080');
  assert.equal(profile.removedContactVerificationUrl, 'https://mail.example/open.php?mail=a%40b.com');
  assert.equal(profile.removedContactFirstResendWaitSeconds, 0);
  assert.equal(profile.removedContactVerificationPollAttempts, 60);
});

test('normalizes profile maps and inherits JP from US when JP is missing', () => {
  const settings = createSettings();
  const profiles = settings.normalizeChatgptSessionReaderProfilesValue({
    us_pp: {
      removedContactVerificationUrl: 'https://mail.example/open.php?mail=us%40example.com&t=1',
      removedContactCardDeclinedRetryEnabled: false,
    },
  });

  assert.equal(profiles.us_pp.removedContactVerificationUrl, 'https://mail.example/open.php?mail=us%40example.com');
  assert.equal(profiles.jp_pp.removedContactVerificationUrl, profiles.us_pp.removedContactVerificationUrl);
  assert.equal(profiles.jp_pp.removedContactCardDeclinedRetryEnabled, false);
});

test('builds legacy patch from only profile setting keys', () => {
  const settings = createSettings();
  const patch = settings.buildChatgptSessionReaderLegacyPatchFromProfile({
    removedContactVerificationUrl: 'https://mail.example/open.php?mail=a%40b.com&t=123',
    removedContactCardDeclinedRetryEnabled: false,
    chatgptSessionReaderCloudConversionApiKey: 'should-not-export',
  });

  assert.deepEqual(Object.keys(patch), [
    'removedContactVerificationUrl',
    'removedContactCardDeclinedRetryEnabled',
    'removedContactFirstDirectResendEnabled',
    'removedContactFirstResendWaitSeconds',
    'removedContactSubsequentResendWaitSeconds',
    'removedContactVerificationResendMaxAttempts',
    'removedContactVerificationPollAttempts',
    'removedContactVerificationPollIntervalSeconds',
  ]);
  assert.equal(patch.removedContactVerificationUrl, 'https://mail.example/open.php?mail=a%40b.com');
  assert.equal(patch.removedContactCardDeclinedRetryEnabled, false);
});

test('normalizes removed payment worker settings with legacy migration', () => {
  const settings = createSettings();
  const normalized = settings.normalizeRemovedPaymentWorkerSettingsValue({
    removedPaymentWorkerEnabled: 1,
    removedPaymentWorkerBrowserBackend: 'roxybrowser',
    removedPaymentWorkerAdsPowerApiBase: '127.0.0.1:50325/',
    removedPaymentWorkerRoxyBrowserApiBase: 'http://127.0.0.1:50000///',
    removedPaymentWorkerAdsPowerProfileId: ' legacy-profile ',
    removedPaymentWorkerMaxAttempts: '99',
    removedPaymentWorkerCheckoutRebuildMaxAttempts: '0',
    removedPaymentWorkerPaymentLocale: 'bad',
    removedPaymentWorkerProxy: 'socks5://proxy:1080',
  });

  assert.equal(normalized.removedPaymentWorkerEnabled, true);
  assert.equal(normalized.removedPaymentWorkerBrowserBackend, 'roxybrowser');
  assert.equal(normalized.removedPaymentWorkerAdsPowerApiBase, 'http://127.0.0.1:50325');
  assert.equal(normalized.removedPaymentWorkerRoxyBrowserApiBase, 'http://127.0.0.1:50000');
  assert.equal(normalized.removedPaymentWorkerRoxyBrowserProfileId, 'legacy-profile');
  assert.equal(normalized.removedPaymentWorkerMaxAttempts, 20);
  assert.equal(normalized.removedPaymentWorkerCheckoutRebuildMaxAttempts, 1);
  assert.equal(normalized.removedPaymentWorkerPaymentLocale, 'en');
  assert.equal(normalized.removedPaymentWorkerDefaultProxy, 'socks5://proxy:1080');
});
