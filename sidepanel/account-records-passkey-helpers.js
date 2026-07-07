(function attachSidepanelAccountRecordsPasskeyHelpers(globalScope) {
  function createAccountRecordsPasskeyHelpers(context = {}) {
    const normalizeText = context.normalizeText || ((value = '') => String(value || '').trim());

    function readFirstUpiCredentialMembershipNumericMetadataValue(values = []) {
      for (const value of values) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return numeric;
      }
      return undefined;
    }

    function readUpiCredentialMembershipPasskeySignCount(...sources) {
      const numeric = readFirstUpiCredentialMembershipNumericMetadataValue(sources.flatMap((source) => (
        source && typeof source === 'object' && !Array.isArray(source)
          ? [source.passkeySignCount, source.signCount, source.sign_count]
          : [source]
      )));
      return numeric === undefined ? undefined : Math.max(0, Math.floor(numeric));
    }

    function readUpiCredentialMembershipPasskeyAlg(...sources) {
      return readFirstUpiCredentialMembershipNumericMetadataValue(sources.flatMap((source) => (
        source && typeof source === 'object' && !Array.isArray(source)
          ? [source.passkeyAlg, source.alg]
          : [source]
      )));
    }

    function buildUpiCredentialMembershipPasskeyNumericMetadataPatch(...sources) {
      const signCount = readUpiCredentialMembershipPasskeySignCount(...sources);
      const alg = readUpiCredentialMembershipPasskeyAlg(...sources);
      return {
        ...(signCount !== undefined ? { passkeySignCount: signCount } : {}),
        ...(alg !== undefined ? { passkeyAlg: alg } : {}),
      };
    }

    function isUpiCredentialMembershipPasskeyMarker(value = '') {
      return /^PASSKEY(?::|$)/i.test(normalizeText(value));
    }

    function parseUpiCredentialMembershipPasskeyMarker(value = '') {
      const marker = normalizeText(value);
      if (!isUpiCredentialMembershipPasskeyMarker(marker)) {
        return { credentialId: '' };
      }
      const [credentialIdPart, ...metadataParts] = marker.replace(/^PASSKEY:?/i, '').trim().split(';');
      const metadata = {};
      metadataParts.forEach((part) => {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex <= 0) return;
        const key = normalizeText(part.slice(0, separatorIndex)).toLowerCase();
        const rawValue = normalizeText(part.slice(separatorIndex + 1));
        if (!rawValue) return;
        if (key === 'signcount' || key === 'sign_count') {
          metadata.signCount = rawValue;
        } else if (key === 'alg') {
          metadata.alg = rawValue;
        }
      });
      return {
        credentialId: normalizeText(credentialIdPart),
        ...buildUpiCredentialMembershipPasskeyNumericMetadataPatch(metadata),
      };
    }

    function getUpiCredentialMembershipPasskeyCredentialId(value = '') {
      return parseUpiCredentialMembershipPasskeyMarker(value).credentialId || '';
    }

    return {
      buildUpiCredentialMembershipPasskeyNumericMetadataPatch,
      isUpiCredentialMembershipPasskeyMarker,
      parseUpiCredentialMembershipPasskeyMarker,
      getUpiCredentialMembershipPasskeyCredentialId,
    };
  }

  const api = { createAccountRecordsPasskeyHelpers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsPasskeyHelpers = api;
})(typeof window !== 'undefined' ? window : globalThis);
