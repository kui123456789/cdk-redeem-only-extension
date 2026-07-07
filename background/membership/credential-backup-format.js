(function attachMembershipCredentialBackupFormat(root, factory) {
  const api = factory();
  root.MultiPageMembershipCredentialBackupFormat = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipCredentialBackupFormatModule() {
  function createCredentialBackupFormat(deps = {}) {
    const {
      buildPasskeyNumericMetadataPatch,
      getMembershipCredentialFormat,
      getPasskeyCredentialIdFromExportMarker,
      isLikelyCredentialTimestamp,
      isLikelyVerificationUrl,
      isPasskeyExportMarker,
      normalizeEmail,
      normalizeNo2faFreeExportTimestamp,
      normalizeNo2faFreeVerificationUrlForExport,
      normalizeString,
      normalizeTotpSecret,
      parsePasskeyExportMarker,
    } = deps;

    function parseCredentialBackupParts(parts = []) { const helper = getMembershipCredentialFormat().parseCredentialParts; return typeof helper === 'function' ? helper(parts, { nowMs: Date.now() }) : parseCredentialBackupPartsFallback(parts); }
  
    function parseCredentialBackupPartsFallback(parts = []) {
      if (parts.length === 4 && isLikelyVerificationUrl(parts[1])) {
        const recordedAt = normalizeNo2faFreeExportTimestamp(parts[3]);
        return {
          email: normalizeEmail(parts[0] || ''),
          password: '',
          totpMfaSecret: '',
          gptPassword: '',
          verificationUrl: normalizeString(parts[1] || ''),
          accessToken: normalizeString(parts[2] || ''),
          accessTokenUpdatedAt: normalizeString(parts[3] || ''),
          checkedAt: normalizeString(parts[3] || ''),
          recordedAt,
          no2faFreeRoute: true,
          twoFactorEnabled: false,
        };
      }
      if (parts.length >= 3 && isPasskeyExportMarker(parts[2])) {
        const passkeyMarker = typeof parsePasskeyExportMarker === 'function'
          ? parsePasskeyExportMarker(parts[2])
          : { credentialId: getPasskeyCredentialIdFromExportMarker(parts[2]) };
        const passkeyMetadataPatch = buildPasskeyNumericMetadataPatch(passkeyMarker);
        if (isLikelyVerificationUrl(parts[3])) {
          const timestamp = parts[5] || '';
          return {
            email: normalizeEmail(parts[0] || ''),
            password: normalizeString(parts[1] || ''),
            totpMfaSecret: '',
            gptPassword: normalizeString(parts[1] || ''),
            verificationUrl: normalizeNo2faFreeVerificationUrlForExport(parts[3] || ''),
            passkeyEnabled: true,
            passkeyCredentialId: passkeyMarker.credentialId || '',
            ...passkeyMetadataPatch,
            accessToken: normalizeString(parts[4] || ''),
            accessTokenUpdatedAt: normalizeString(timestamp),
            checkedAt: normalizeString(timestamp),
            recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
            no2faFreeRoute: false,
            twoFactorEnabled: true,
          };
        }
        const accessTokenOrTimestamp = parts[3] || '';
        const explicitTimestamp = parts[4] || '';
        const fourthPartIsTimestamp = !explicitTimestamp && isLikelyCredentialTimestamp(accessTokenOrTimestamp);
        const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
        return {
          email: normalizeEmail(parts[0] || ''),
          password: normalizeString(parts[1] || ''),
          totpMfaSecret: '',
          gptPassword: normalizeString(parts[1] || ''),
          passkeyEnabled: true,
          passkeyCredentialId: passkeyMarker.credentialId || '',
          ...passkeyMetadataPatch,
          accessToken: fourthPartIsTimestamp ? '' : normalizeString(accessTokenOrTimestamp),
          accessTokenUpdatedAt: normalizeString(timestamp),
          checkedAt: normalizeString(timestamp),
          recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
          no2faFreeRoute: false,
          twoFactorEnabled: true,
        };
      }
      if (parts.length >= 5 && isLikelyVerificationUrl(parts[3])) {
        const timestamp = parts[5] || '';
        return {
          email: normalizeEmail(parts[0] || ''),
          password: normalizeString(parts[1] || ''),
          totpMfaSecret: normalizeTotpSecret(parts[2] || ''),
          verificationUrl: normalizeNo2faFreeVerificationUrlForExport(parts[3] || ''),
          accessToken: normalizeString(parts[4] || ''),
          accessTokenUpdatedAt: normalizeString(timestamp),
          checkedAt: normalizeString(timestamp),
          recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
          no2faFreeRoute: false,
          twoFactorEnabled: true,
        };
      }
      const accessTokenOrTimestamp = parts[3] || '';
      const explicitTimestamp = parts[4] || '';
      const fourthPartIsTimestamp = !explicitTimestamp && isLikelyCredentialTimestamp(accessTokenOrTimestamp);
      const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
      return {
        email: normalizeEmail(parts[0] || ''),
        password: normalizeString(parts[1] || ''),
        totpMfaSecret: normalizeTotpSecret(parts[2] || ''),
        accessToken: fourthPartIsTimestamp ? '' : normalizeString(accessTokenOrTimestamp),
        accessTokenUpdatedAt: normalizeString(timestamp),
      };
    }
  
    function parseCredentialBackupText(text = '') {
      const seen = new Set();
      return String(text || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line, index) => {
          const rawLine = line.trim();
          if (!rawLine || rawLine.startsWith('#')) return null;
          const parts = rawLine.split(/---+/).map((part) => part.trim());
          const { email, password, totpMfaSecret, gptPassword, verificationUrl, accessToken, accessTokenUpdatedAt, checkedAt, recordedAt, no2faFreeRoute, twoFactorEnabled, passkeyEnabled, passkeyCredentialId, passkeySignCount, passkeyAlg } = parseCredentialBackupParts(parts);
          if (!email) {
            return {
              email: '', password, totpMfaSecret, gptPassword, verificationUrl,
              recordedAt, no2faFreeRoute, twoFactorEnabled, passkeyEnabled, passkeyCredentialId, passkeySignCount, passkeyAlg,
              status: 'failed',
              reason: `第 ${index + 1} 行缺少邮箱`,
            };
          }
          if (seen.has(email)) return null;
          seen.add(email);
          return {
            email, password, totpMfaSecret, gptPassword, verificationUrl,
            accessToken, recordedAt, no2faFreeRoute, twoFactorEnabled, passkeyEnabled, passkeyCredentialId, passkeySignCount, passkeyAlg,
            accessTokenUpdatedAt,
            checkedAt: checkedAt || accessTokenUpdatedAt,
          };
        })
        .filter(Boolean);
    }
  
    function normalizeCredentialBackupMap(value = {}) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      const records = {};
      Object.entries(value).forEach(([key, rawRecord]) => {
        const record = rawRecord && typeof rawRecord === 'object' && !Array.isArray(rawRecord)
          ? rawRecord
          : {};
        const email = normalizeEmail(record.email || key);
        if (!email) return;
        const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(record);
        records[email] = {
          ...record,
          email,
          password: normalizeString(record.password || record.gptPassword || ''),
          totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret || record.totpSecret || ''),
          passkeyEnabled: record.passkeyEnabled === true || Boolean(normalizeString(record.passkeyCredentialId || record.credentialId || record.credential_id)),
          passkeyEnabledAt: normalizeString(record.passkeyEnabledAt || ''), passkeyCredentialId: normalizeString(record.passkeyCredentialId || record.credentialId || record.credential_id),
          passkeyFactorId: normalizeString(record.passkeyFactorId || record.factorId || record.factor_id), passkeyRpId: normalizeString(record.passkeyRpId || record.rpId || record.rp_id),
          passkeyUserHandle: normalizeString(record.passkeyUserHandle || record.userHandle || record.user_handle),
          passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk) ? record.passkeyPrivateJwk : null,
          passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose || record.publicKeyCose || record.public_key_cose), ...passkeyNumericMetadataPatch,
          passkeyApiPersisted: record.passkeyApiPersisted === true || record.persisted === true,
          updatedAt: normalizeString(record.updatedAt || ''),
        };
      });
      return records;
    }
  
    function buildCredentialRowsFromBackupMap(backups = {}) {
      const seen = new Set();
      return Object.values(normalizeCredentialBackupMap(backups))
        .sort((left, right) => Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || ''))
        .map((record) => {
          const email = normalizeEmail(record.email);
          if (!email || seen.has(email)) return null;
          seen.add(email);
          const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(record);
          return {
            email,
            password: normalizeString(record.password),
            totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret),
            verificationUrl: normalizeString(record.verificationUrl || record.emailVerificationUrl || record.url),
            passkeyEnabled: record.passkeyEnabled === true, passkeyEnabledAt: normalizeString(record.passkeyEnabledAt),
            passkeyCredentialId: normalizeString(record.passkeyCredentialId), passkeyFactorId: normalizeString(record.passkeyFactorId),
            passkeyRpId: normalizeString(record.passkeyRpId), passkeyUserHandle: normalizeString(record.passkeyUserHandle),
            passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk) ? record.passkeyPrivateJwk : null,
            passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose), ...passkeyNumericMetadataPatch,
            passkeyApiPersisted: record.passkeyApiPersisted === true,
            accessToken: normalizeString(record.accessToken || record.token || record.access_token),
            accessTokenUpdatedAt: normalizeString(record.accessTokenUpdatedAt || record.updatedAt),
          };
        })
        .filter(Boolean);
    }

    return {
      buildCredentialRowsFromBackupMap,
      normalizeCredentialBackupMap,
      parseCredentialBackupParts,
      parseCredentialBackupPartsFallback,
      parseCredentialBackupText,
    };
  }

  return {
    createCredentialBackupFormat,
  };
});
