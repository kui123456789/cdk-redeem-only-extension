(function attachMembershipCredentialFormat(root, factory) {
  const api = factory();
  root.MultiPageMembershipCredentialFormat = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipCredentialFormat() {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function normalizeTotpSecret(value = '') {
    return normalizeText(value).replace(/\s+/g, '').toUpperCase();
  }

  function isLikelyVerificationUrl(value = '') {
    return /^https?:\/\//i.test(normalizeText(value));
  }

  function isLikelyTimestamp(value = '') {
    const text = normalizeText(value);
    if (!text || !/[\d:T年月日/-]/.test(text)) return false;
    return Number.isFinite(Date.parse(text));
  }

  function isNo2faFreeRouteTimestamp(value = '') {
    const text = normalizeText(value);
    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
      || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(text);
  }

  function normalizeVerificationUrlForCredential(value = '') {
    const text = normalizeText(value);
    if (!text) return '';
    try {
      const parsed = new URL(text);
      if (
        /^assurivo\.com$/i.test(parsed.hostname)
        && parsed.pathname.toLowerCase() === '/console/feed.php'
      ) {
        parsed.pathname = '/console/open.php';
      }
      if (
        /^mail\.334401\.xyz$/i.test(parsed.hostname)
        && /^\/show\//i.test(parsed.pathname)
      ) {
        parsed.pathname = parsed.pathname.replace(/^\/show\//i, '/json/');
      }
      return parsed.toString();
    } catch (_error) {
      return text
        .replace('/console/feed.php', '/console/open.php')
        .replace(/^(https?:\/\/mail\.334401\.xyz)\/show\//i, '$1/json/');
    }
  }

  function normalizeVerificationUrlForExport(value = '') {
    const normalized = normalizeVerificationUrlForCredential(value);
    if (!normalized) return '';
    try {
      const parsed = new URL(normalized);
      if (
        /^mail\.334401\.xyz$/i.test(parsed.hostname)
        && /^\/json\//i.test(parsed.pathname)
      ) {
        parsed.pathname = parsed.pathname.replace(/^\/json\//i, '/show/');
      }
      return parsed.toString();
    } catch (_error) {
      return normalized.replace(/^(https?:\/\/mail\.334401\.xyz)\/json\//i, '$1/show/');
    }
  }

  function normalizeRecordedAt(value = '', options = {}) {
    const numeric = Math.floor(Number(value) || 0);
    if (numeric > 0) return numeric;
    const parsed = Date.parse(normalizeText(value));
    if (Number.isFinite(parsed)) return parsed;
    return Math.max(0, Math.floor(Number(options.nowMs) || Date.now()));
  }

  function readFirstFiniteNumericMetadataValue(values = []) {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return undefined;
  }

  function readPasskeySignCountMetadata(...sources) {
    const numeric = readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeySignCount, source.signCount, source.sign_count]
        : [source]
    )));
    return numeric === undefined ? undefined : Math.max(0, Math.floor(numeric));
  }

  function readPasskeyAlgMetadata(...sources) {
    return readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeyAlg, source.alg]
        : [source]
    )));
  }

  function buildPasskeyNumericMetadataPatch(...sources) {
    const signCount = readPasskeySignCountMetadata(...sources);
    const alg = readPasskeyAlgMetadata(...sources);
    return {
      ...(signCount !== undefined ? { passkeySignCount: signCount } : {}),
      ...(alg !== undefined ? { passkeyAlg: alg } : {}),
    };
  }

  function isPasskeyMarker(value = '') {
    return /^PASSKEY(?::|$)/i.test(normalizeText(value));
  }

  function parsePasskeyMarker(value = '') {
    const marker = normalizeText(value);
    if (!isPasskeyMarker(marker)) return { credentialId: '' };
    const [credentialIdPart, ...metadataParts] = marker.replace(/^PASSKEY:?/i, '').trim().split(';');
    const metadata = {};
    for (const part of metadataParts) {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = normalizeText(part.slice(0, separatorIndex)).toLowerCase();
      const rawValue = normalizeText(part.slice(separatorIndex + 1));
      if (!rawValue) continue;
      if (key === 'signcount' || key === 'sign_count') metadata.signCount = rawValue;
      if (key === 'alg') metadata.alg = rawValue;
    }
    return {
      credentialId: normalizeText(credentialIdPart),
      ...buildPasskeyNumericMetadataPatch(metadata),
    };
  }

  function buildPasskeyMarker(item = {}) {
    const credentialId = normalizeText(item.passkeyCredentialId || item.credentialId || item.credential_id);
    if (!credentialId) return 'PASSKEY';
    const metadata = buildPasskeyNumericMetadataPatch(item);
    const segments = [`PASSKEY:${credentialId}`];
    if (metadata.passkeySignCount !== undefined) segments.push(`signCount=${metadata.passkeySignCount}`);
    if (metadata.passkeyAlg !== undefined) segments.push(`alg=${metadata.passkeyAlg}`);
    return segments.join(';');
  }

  function buildCredentialRow(fields = {}, options = {}) {
    const no2faFreeRoute = fields.no2faFreeRoute === true;
    const passkeyEnabled = no2faFreeRoute ? false : fields.passkeyEnabled === true;
    const timestamp = normalizeText(fields.accessTokenUpdatedAt || fields.checkedAt);
    const hasTwoFactorEnabled = Object.prototype.hasOwnProperty.call(fields, 'twoFactorEnabled');
    return {
      email: normalizeEmail(fields.email),
      password: no2faFreeRoute ? '' : normalizeText(fields.password),
      gptPassword: no2faFreeRoute ? '' : normalizeText(fields.gptPassword || fields.password),
      totpMfaSecret: no2faFreeRoute || passkeyEnabled ? '' : normalizeTotpSecret(fields.totpMfaSecret),
      verificationUrl: normalizeVerificationUrlForCredential(fields.verificationUrl),
      accessToken: normalizeText(fields.accessToken),
      accessTokenUpdatedAt: timestamp,
      checkedAt: normalizeText(fields.checkedAt || timestamp),
      recordedAt: normalizeRecordedAt(fields.recordedAt || timestamp, options),
      ...(no2faFreeRoute ? { no2faFreeRoute: true, twoFactorEnabled: false } : {}),
      ...(!no2faFreeRoute && hasTwoFactorEnabled ? { twoFactorEnabled: fields.twoFactorEnabled === true } : {}),
      passkeyEnabled,
      passkeyCredentialId: passkeyEnabled ? normalizeText(fields.passkeyCredentialId) : '',
      passkeySignCount: undefined,
      passkeyAlg: undefined,
      ...(passkeyEnabled ? buildPasskeyNumericMetadataPatch(fields) : {}),
      source: normalizeText(options.source || fields.source || 'txt'),
    };
  }

  function parseCredentialParts(parts = [], options = {}) {
    const normalizedParts = (Array.isArray(parts) ? parts : [])
      .map((part) => normalizeText(part));
    if (normalizedParts.length === 4 && isLikelyVerificationUrl(normalizedParts[1])) {
      return buildCredentialRow({
        email: normalizedParts[0],
        verificationUrl: normalizedParts[1],
        accessToken: normalizedParts[2],
        accessTokenUpdatedAt: normalizedParts[3],
        checkedAt: normalizedParts[3],
        no2faFreeRoute: true,
        twoFactorEnabled: false,
      }, options);
    }

    if (normalizedParts.length === 3 && isNo2faFreeRouteTimestamp(normalizedParts[2])) {
      return buildCredentialRow({
        email: normalizedParts[0],
        accessToken: normalizedParts[1],
        accessTokenUpdatedAt: normalizedParts[2],
        checkedAt: normalizedParts[2],
        no2faFreeRoute: true,
        twoFactorEnabled: false,
      }, options);
    }

    if (normalizedParts.length >= 3 && isPasskeyMarker(normalizedParts[2])) {
      const passkeyMarker = parsePasskeyMarker(normalizedParts[2]);
      if (isLikelyVerificationUrl(normalizedParts[3])) {
        return buildCredentialRow({
          email: normalizedParts[0],
          password: normalizedParts[1],
          gptPassword: normalizedParts[1],
          verificationUrl: normalizedParts[3],
          accessToken: normalizedParts[4],
          accessTokenUpdatedAt: normalizedParts[5],
          checkedAt: normalizedParts[5],
          passkeyEnabled: true,
          passkeyCredentialId: passkeyMarker.credentialId,
          twoFactorEnabled: true,
          ...passkeyMarker,
        }, options);
      }
      const accessTokenOrTimestamp = normalizedParts[3] || '';
      const explicitTimestamp = normalizedParts[4] || '';
      const fourthPartIsTimestamp = !explicitTimestamp && isLikelyTimestamp(accessTokenOrTimestamp);
      const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
      return buildCredentialRow({
        email: normalizedParts[0],
        password: normalizedParts[1],
        gptPassword: normalizedParts[1],
        accessToken: fourthPartIsTimestamp ? '' : accessTokenOrTimestamp,
        accessTokenUpdatedAt: timestamp,
        checkedAt: timestamp,
        passkeyEnabled: true,
        passkeyCredentialId: passkeyMarker.credentialId,
        twoFactorEnabled: true,
        ...passkeyMarker,
      }, options);
    }

    if (normalizedParts.length >= 5 && isLikelyVerificationUrl(normalizedParts[3])) {
      return buildCredentialRow({
        email: normalizedParts[0],
        password: normalizedParts[1],
        gptPassword: normalizedParts[1],
        totpMfaSecret: normalizedParts[2],
        verificationUrl: normalizedParts[3],
        accessToken: normalizedParts[4],
        accessTokenUpdatedAt: normalizedParts[5],
        checkedAt: normalizedParts[5],
        twoFactorEnabled: true,
      }, options);
    }

    const accessTokenOrTimestamp = normalizedParts[3] || '';
    const explicitTimestamp = normalizedParts[4] || '';
    const fourthPartIsTimestamp = !explicitTimestamp && isLikelyTimestamp(accessTokenOrTimestamp);
    const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
    return buildCredentialRow({
      email: normalizedParts[0],
      password: normalizedParts[1],
      gptPassword: normalizedParts[1],
      totpMfaSecret: normalizedParts[2],
      accessToken: fourthPartIsTimestamp ? '' : accessTokenOrTimestamp,
      accessTokenUpdatedAt: timestamp,
      checkedAt: timestamp,
    }, options);
  }

  function parseCredentialLine(line = '', options = {}) {
    return parseCredentialParts(String(line || '').trim().split(/---+/).map((part) => part.trim()), options);
  }

  function formatFreeCredentialLine(item = {}, options = {}) {
    const email = normalizeEmail(item.email);
    const verificationUrl = normalizeVerificationUrlForExport(item.verificationUrl || item.emailVerificationUrl || item.url);
    const accessToken = normalizeText(item.accessToken || item.token || item.access_token || item.upiRedeemAccessToken);
    const timestamp = normalizeText(item.checkedAt || item.accessTokenUpdatedAt || item.tokenUpdatedAt);
    const includeVerificationUrl = options.includeVerificationUrl !== false;
    if (item.no2faFreeRoute === true) {
      return includeVerificationUrl
        ? [email, verificationUrl, accessToken, timestamp].join('---')
        : [email, accessToken, timestamp].join('---');
    }
    const password = normalizeText(item.password || item.gptPassword || item.chatGptPassword);
    const totpMfaSecret = normalizeTotpSecret(item.totpMfaSecret || item.totpSecret || item.twoFactorSecret);
    const hasPasskeyMaterial = item.passkeyEnabled === true
      || Boolean(normalizeText(item.passkeyCredentialId || item.credentialId || item.credential_id));
    const secretOrMarker = hasPasskeyMaterial && !totpMfaSecret
      ? buildPasskeyMarker(item)
      : totpMfaSecret;
    if (includeVerificationUrl && verificationUrl) {
      return [email, password, secretOrMarker, verificationUrl, accessToken, timestamp].join('---');
    }
    return [email, password, secretOrMarker, accessToken, timestamp].join('---');
  }

  return {
    normalizeText,
    normalizeEmail,
    normalizeTotpSecret,
    isLikelyVerificationUrl,
    isLikelyTimestamp,
    normalizeVerificationUrlForExport,
    normalizeRecordedAt,
    isPasskeyMarker,
    parsePasskeyMarker,
    buildPasskeyMarker,
    parseCredentialParts,
    parseCredentialLine,
    formatFreeCredentialLine,
  };
});
