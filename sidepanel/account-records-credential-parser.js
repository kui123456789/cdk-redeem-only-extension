(function attachSidepanelAccountRecordsCredentialParser(globalScope) {
  function createAccountRecordsCredentialParser(context = {}) {
    const normalizeEmail = context.normalizeEmail || ((value = '') => String(value || '').trim().toLowerCase());
    const normalizeText = context.normalizeText || ((value = '') => String(value || '').trim());
    const getPasskeyHelpers = typeof context.getPasskeyHelpers === 'function'
      ? context.getPasskeyHelpers
      : () => {
        const helpers = globalScope.SidepanelAccountRecordsPasskeyHelpers;
        if (!helpers || typeof helpers.createAccountRecordsPasskeyHelpers !== 'function') {
          throw new Error('Account records passkey helper module is not loaded.');
        }
        return helpers.createAccountRecordsPasskeyHelpers({ normalizeText });
      };
    const getMembershipCredentialFormatHelpers = typeof context.getMembershipCredentialFormatHelpers === 'function'
      ? context.getMembershipCredentialFormatHelpers
      : () => {
        const helpers = globalScope.MultiPageMembershipCredentialFormat;
        if (!helpers || typeof helpers.parseCredentialLine !== 'function') {
          throw new Error('Membership credential format module is not loaded.');
        }
        return helpers;
      };
    const passkeyHelpers = getPasskeyHelpers();

    function normalizeUpiCredentialMembershipTotpSecret(value = '') {
      return normalizeText(value).replace(/\s+/g, '').toUpperCase();
    }
    function isLikelyUpiCredentialMembershipTimestamp(value = '') {
      const text = normalizeText(value);
      return Boolean(text && /[\d:T年月日/-]/.test(text) && Number.isFinite(Date.parse(text)));
    }
    function isLikelyUpiCredentialMembershipVerificationUrl(value = '') {
      return /^https?:\/\//i.test(normalizeText(value));
    }
    function buildUpiCredentialMembershipPasskeyNumericMetadataPatch(...sources) {
      return passkeyHelpers.buildUpiCredentialMembershipPasskeyNumericMetadataPatch(...sources);
    }
    function isUpiCredentialMembershipPasskeyMarker(value = '') {
      return passkeyHelpers.isUpiCredentialMembershipPasskeyMarker(value);
    }
    function parseUpiCredentialMembershipPasskeyMarker(value = '') {
      return passkeyHelpers.parseUpiCredentialMembershipPasskeyMarker(value);
    }
    function getUpiCredentialMembershipPasskeyCredentialId(value = '') {
      return passkeyHelpers.getUpiCredentialMembershipPasskeyCredentialId(value);
    }
    function getMembershipCredentialFormat() { return getMembershipCredentialFormatHelpers(); }

    function parseUpiCredentialMembershipParts(parts = []) {
      const helpers = getMembershipCredentialFormatHelpers();
      if (typeof helpers.parseCredentialParts === 'function') return helpers.parseCredentialParts(parts, { source: 'txt', nowMs: Date.now() });
      return helpers.parseCredentialLine((Array.isArray(parts) ? parts : []).join('---'), {
        source: 'txt',
        nowMs: Date.now(),
      });
    }
    function parseUpiCredentialMembershipPartsFallback(parts = []) {
      if (parts.length === 4 && isLikelyUpiCredentialMembershipVerificationUrl(parts[1])) {
        const recordedAt = Math.max(0, Math.floor(Number(parts[3]) || Date.parse(normalizeText(parts[3])) || Date.now()));
        return {
          email: parts[0] || '',
          password: '',
          gptPassword: '',
          totpMfaSecret: '',
          verificationUrl: parts[1] || '',
          accessToken: parts[2] || '',
          accessTokenUpdatedAt: parts[3] || '',
          checkedAt: parts[3] || '',
          recordedAt,
          no2faFreeRoute: true,
          twoFactorEnabled: false,
          source: 'txt',
        };
      }
      if (parts.length >= 3 && isUpiCredentialMembershipPasskeyMarker(parts[2])) {
        const passkeyMarker = parseUpiCredentialMembershipPasskeyMarker(parts[2]);
        const passkeyMetadataPatch = buildUpiCredentialMembershipPasskeyNumericMetadataPatch(passkeyMarker);
        if (isLikelyUpiCredentialMembershipVerificationUrl(parts[3])) {
          const timestamp = parts[5] || '';
          const recordedAt = Math.max(0, Math.floor(Number(timestamp) || Date.parse(normalizeText(timestamp)) || Date.now()));
          return {
            email: parts[0] || '',
            password: parts[1] || '',
            gptPassword: parts[1] || '',
            totpMfaSecret: '',
            verificationUrl: parts[3] || '',
            passkeyEnabled: true,
            passkeyCredentialId: passkeyMarker.credentialId || '',
            ...passkeyMetadataPatch,
            accessToken: parts[4] || '',
            accessTokenUpdatedAt: timestamp,
            checkedAt: timestamp,
            recordedAt,
            no2faFreeRoute: false,
            twoFactorEnabled: true,
            source: 'txt',
          };
        }
        const accessTokenOrTimestamp = parts[3] || '';
        const explicitTimestamp = parts[4] || '';
        const fourthPartIsTimestamp = !explicitTimestamp && isLikelyUpiCredentialMembershipTimestamp(accessTokenOrTimestamp);
        const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
        const recordedAt = Math.max(0, Math.floor(Number(timestamp) || Date.parse(normalizeText(timestamp)) || Date.now()));
        return {
          email: parts[0] || '',
          password: parts[1] || '',
          gptPassword: parts[1] || '',
          totpMfaSecret: '',
          passkeyEnabled: true,
          passkeyCredentialId: passkeyMarker.credentialId || '',
          ...passkeyMetadataPatch,
          accessToken: fourthPartIsTimestamp ? '' : accessTokenOrTimestamp,
          accessTokenUpdatedAt: timestamp,
          checkedAt: timestamp,
          recordedAt,
          no2faFreeRoute: false,
          twoFactorEnabled: true,
          source: 'txt',
        };
      }
      if (parts.length >= 5 && isLikelyUpiCredentialMembershipVerificationUrl(parts[3])) {
        const timestamp = parts[5] || '';
        const recordedAt = Math.max(0, Math.floor(Number(timestamp) || Date.parse(normalizeText(timestamp)) || Date.now()));
        return {
          email: parts[0] || '',
          password: parts[1] || '',
          gptPassword: parts[1] || '',
          totpMfaSecret: parts[2] || '',
          verificationUrl: parts[3] || '',
          accessToken: parts[4] || '',
          accessTokenUpdatedAt: timestamp,
          checkedAt: timestamp,
          recordedAt,
          no2faFreeRoute: false,
          twoFactorEnabled: true,
          source: 'txt',
        };
      }
      const accessTokenOrTimestamp = parts[3] || '';
      const explicitTimestamp = parts[4] || '';
      const fourthPartIsTimestamp = !explicitTimestamp && isLikelyUpiCredentialMembershipTimestamp(accessTokenOrTimestamp);
      return {
        email: parts[0] || '',
        password: parts[1] || '',
        totpMfaSecret: parts[2] || '',
        accessToken: fourthPartIsTimestamp ? '' : accessTokenOrTimestamp,
        accessTokenUpdatedAt: explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : ''),
        checkedAt: explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : ''),
        source: 'txt',
      };
    }
    function normalizeUpiCredentialMembershipCredential(rawItem = {}, fallbackSource = '') {
      const source = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? rawItem : {};
      const formatHelpers = getMembershipCredentialFormatHelpers();
      const normalizeValue = typeof formatHelpers.normalizeText === 'function' ? formatHelpers.normalizeText : normalizeText;
      const normalizeEmailValue = typeof formatHelpers.normalizeEmail === 'function' ? formatHelpers.normalizeEmail : normalizeEmail;
      const normalizeTotpSecret = typeof formatHelpers.normalizeTotpSecret === 'function'
        ? formatHelpers.normalizeTotpSecret
        : normalizeUpiCredentialMembershipTotpSecret;
      const isLikelyTimestamp = typeof formatHelpers.isLikelyTimestamp === 'function'
        ? formatHelpers.isLikelyTimestamp
        : isLikelyUpiCredentialMembershipTimestamp;
      const email = normalizeEmailValue(source.email || source.accountIdentifier);
      if (!email) return null;
      const rawAccessToken = normalizeValue(
        source.accessToken
        || source.token
        || source.access_token
        || source.upiRedeemAccessToken
        || ''
      );
      const rawAccessTokenUpdatedAt = normalizeValue(source.accessTokenUpdatedAt || source.checkedAt || '');
      const accessTokenIsTimestamp = rawAccessToken && !rawAccessTokenUpdatedAt && isLikelyTimestamp(rawAccessToken);
      const accessToken = accessTokenIsTimestamp ? '' : rawAccessToken;
      const accessTokenUpdatedAt = rawAccessTokenUpdatedAt || (accessTokenIsTimestamp ? rawAccessToken : '');
      const no2faFreeRoute = source.no2faFreeRoute === true;
      const passkeyCredentialId = normalizeValue(source.passkeyCredentialId || source.credentialId || source.credential_id || '');
      const passkeyEnabled = !no2faFreeRoute && (source.passkeyEnabled === true || Boolean(passkeyCredentialId));
      const passkeyNumericMetadataPatch = buildUpiCredentialMembershipPasskeyNumericMetadataPatch(source);
      return {
        ...source,
        email,
        password: no2faFreeRoute ? '' : normalizeValue(
          source.password
          || source.gptPassword
          || source.chatGptPassword
          || ''
        ),
        gptPassword: no2faFreeRoute ? '' : normalizeValue(source.gptPassword || source.password || ''),
        totpMfaSecret: no2faFreeRoute ? '' : normalizeTotpSecret(
          source.totpMfaSecret
          || source.totpSecret
          || source.twoFactorSecret
          || ''
        ),
        verificationUrl: normalizeValue(source.verificationUrl || source.emailVerificationUrl || source.url || ''),
        recordedAt: Math.max(0, Math.floor(Number(source.recordedAt || source.no2faFreeRecordedAt) || 0)),
        no2faFreeRoute,
        passkeyEnabled,
        passkeyCredentialId,
        passkeyEnabledAt: normalizeValue(source.passkeyEnabledAt || ''),
        passkeyFactorId: normalizeValue(source.passkeyFactorId || source.factorId || source.factor_id || ''),
        passkeyRpId: normalizeValue(source.passkeyRpId || source.rpId || source.rp_id || ''),
        passkeyUserHandle: normalizeValue(source.passkeyUserHandle || source.userHandle || source.user_handle || ''),
        passkeyPrivateJwk: source.passkeyPrivateJwk && typeof source.passkeyPrivateJwk === 'object' && !Array.isArray(source.passkeyPrivateJwk)
          ? source.passkeyPrivateJwk
          : null,
        passkeyPublicKeyCose: normalizeValue(source.passkeyPublicKeyCose || source.publicKeyCose || source.public_key_cose || ''),
        ...passkeyNumericMetadataPatch,
        passkeyApiPersisted: source.passkeyApiPersisted === true || source.persisted === true,
        twoFactorEnabled: no2faFreeRoute ? false : (
          source.twoFactorEnabled === true
          || Boolean(normalizeTotpSecret(source.totpMfaSecret || source.totpSecret || source.twoFactorSecret || ''))
          || passkeyEnabled
        ),
        accessToken,
        accessTokenMasked: accessToken ? normalizeValue(source.accessTokenMasked || '') : '',
        accessTokenUpdatedAt,
        checkedAt: normalizeValue(source.checkedAt || accessTokenUpdatedAt || ''),
        source: normalizeValue(fallbackSource || source.source),
      };
    }
    function parseUpiCredentialMembershipText(text = '') {
      const formatHelpers = getMembershipCredentialFormatHelpers();
      const seen = new Set();
      return String(text || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => normalizeUpiCredentialMembershipCredential(
          formatHelpers.parseCredentialLine(line, { source: 'txt', nowMs: Date.now() }),
          'txt'
        ))
        .filter((item) => item?.email && !seen.has(item.email) && Boolean(seen.add(item.email)));
    }
    return {
      normalizeEmail, normalizeText, parseUpiCredentialMembershipParts, normalizeUpiCredentialMembershipCredential,
      parseUpiCredentialMembershipText, normalizeUpiCredentialMembershipTotpSecret, parseUpiCredentialMembershipPasskeyMarker,
      getMembershipCredentialFormat, parseUpiCredentialMembershipPartsFallback, getUpiCredentialMembershipPasskeyCredentialId,
    };
  }
  const api = { createAccountRecordsCredentialParser };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsCredentialParser = api;
})(typeof window !== 'undefined' ? window : globalThis);
