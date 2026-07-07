(function attachSidepanelAccountRecordsDisplayModel(globalScope) {
  function createAccountRecordsDisplayModel(context = {}) {
    const normalizeEmail = context.normalizeEmail || ((value = '') => String(value || '').trim().toLowerCase());
    const normalizeText = context.normalizeText || ((value = '') => String(value || '').trim());
    const getMembershipCredentialFormatHelpers = typeof context.getMembershipCredentialFormatHelpers === 'function'
      ? context.getMembershipCredentialFormatHelpers
      : () => {
        const helpers = globalScope.MultiPageMembershipCredentialFormat;
        if (!helpers || typeof helpers.parseCredentialLine !== 'function') {
          throw new Error('Membership credential format module is not loaded.');
        }
        return helpers;
      };
    const collectPasskeyNumericMetadataPatch = typeof context.collectPasskeyNumericMetadataPatch === 'function'
      ? context.collectPasskeyNumericMetadataPatch
      : () => ({});
    const getUpiCredentialMembershipCheckResults = typeof context.getUpiCredentialMembershipCheckResults === 'function'
      ? context.getUpiCredentialMembershipCheckResults
      : () => ({});
    const buildRedeemPlusDeletedEmailSets = typeof context.buildRedeemPlusDeletedEmailSets === 'function'
      ? context.buildRedeemPlusDeletedEmailSets
      : () => ({});
    const buildUpiRedeemSuccessMembershipLookup = typeof context.buildUpiRedeemSuccessMembershipLookup === 'function'
      ? context.buildUpiRedeemSuccessMembershipLookup
      : () => ({});
    const getLatestState = typeof context.getLatestState === 'function' ? context.getLatestState : () => ({});
    const getUpiCredentialMembershipPoolRows = typeof context.getUpiCredentialMembershipPoolRows === 'function'
      ? context.getUpiCredentialMembershipPoolRows
      : () => [];
    const getUpiCredentialMembershipPoolSource = typeof context.getUpiCredentialMembershipPoolSource === 'function'
      ? context.getUpiCredentialMembershipPoolSource
      : () => '';
    const isUpiCredentialMembershipEmailDisabled = typeof context.isUpiCredentialMembershipEmailDisabled === 'function'
      ? context.isUpiCredentialMembershipEmailDisabled
      : () => false;
    const getLocallyDeletedUpiCredentialMembershipEmails = typeof context.getLocallyDeletedUpiCredentialMembershipEmails === 'function'
      ? context.getLocallyDeletedUpiCredentialMembershipEmails
      : () => [];
    const applyUpiRedeemSuccessMembershipPatch = typeof context.applyUpiRedeemSuccessMembershipPatch === 'function'
      ? context.applyUpiRedeemSuccessMembershipPatch
      : (row) => row;
    const buildMembershipViewModelRows = typeof context.buildMembershipViewModelRows === 'function'
      ? context.buildMembershipViewModelRows
      : (rows) => Array.isArray(rows) ? rows : [];
    const buildUpiCredentialMembershipDisplayRowKey = typeof context.buildUpiCredentialMembershipDisplayRowKey === 'function'
      ? context.buildUpiCredentialMembershipDisplayRowKey
      : (row = {}, email = '') => normalizeText(row.email || email);
    const isRedeemPlusDeletedDisplayRow = typeof context.isRedeemPlusDeletedDisplayRow === 'function'
      ? context.isRedeemPlusDeletedDisplayRow
      : () => false;
    const createAccountRecordsStatusMeta = typeof context.createAccountRecordsStatusMeta === 'function'
      ? context.createAccountRecordsStatusMeta
      : getStatusMetaFactory();

    function sanitizeUpiCredentialMembershipDisplayRow(row = {}) {
      const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
      const accessToken = normalizeText(source.accessToken);
      const accessTokenUpdatedAt = normalizeText(source.accessTokenUpdatedAt || source.tokenUpdatedAt);
      const isLikelyTimestamp = getMembershipCredentialFormatHelpers().isLikelyTimestamp;
      if (!accessToken || accessTokenUpdatedAt || typeof isLikelyTimestamp !== 'function' || !isLikelyTimestamp(accessToken)) {
        return source;
      }
      return {
        ...source,
        accessToken: '',
        accessTokenMasked: '',
        accessTokenUpdatedAt: accessToken,
      };
    }

    function mergeUpiCredentialMembershipDisplayCredentialResult(credential = {}, result = {}) {
      const sourceCredential = credential && typeof credential === 'object' && !Array.isArray(credential) ? credential : {};
      const sourceResult = result && typeof result === 'object' && !Array.isArray(result) ? result : {};
      const credentialPasskeyCredentialId = normalizeText(
        sourceCredential.passkeyCredentialId || sourceCredential.credentialId || sourceCredential.credential_id
      );
      const resultPasskeyCredentialId = normalizeText(
        sourceResult.passkeyCredentialId || sourceResult.credentialId || sourceResult.credential_id
      );
      const passkeyNumericMetadataPatch = collectPasskeyNumericMetadataPatch(sourceResult, sourceCredential);
      return {
        ...sourceCredential,
        ...sourceResult,
        ...(normalizeText(sourceResult.password) ? {} : {
          password: normalizeText(sourceCredential.password),
          gptPassword: normalizeText(sourceCredential.gptPassword || sourceCredential.password),
        }),
        ...buildPasskeyPatch(sourceCredential, credentialPasskeyCredentialId, resultPasskeyCredentialId, passkeyNumericMetadataPatch),
        ...passkeyNumericMetadataPatch,
      };
    }

    function buildUpiCredentialMembershipResultLookup(items = []) {
      const lookup = {};
      (Array.isArray(items) ? items : []).forEach((rawItem) => {
        const item = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? rawItem : {};
        const email = normalizeEmail(item.email);
        if (email) lookup[email] = item;
      });
      return lookup;
    }

    function buildUpiCredentialMembershipDisplayRows(results = getUpiCredentialMembershipCheckResults()) {
      const safeResults = results && typeof results === 'object' && !Array.isArray(results) ? results : {};
      const rows = [];
      const seen = new Set();
      const deletedEmailSet = new Set([
        ...(Array.isArray(safeResults.redeemAutoDeletedEmails) ? safeResults.redeemAutoDeletedEmails : []),
        ...getLocallyDeletedUpiCredentialMembershipEmails(),
      ].map(normalizeEmail).filter(Boolean));
      const plusDeletedEmailSets = buildRedeemPlusDeletedEmailSets(safeResults.redeemPlusDeletedEmailsByChannel);
      const resultLookup = buildUpiCredentialMembershipResultLookup(safeResults.items);
      const successLookup = buildUpiRedeemSuccessMembershipLookup({
        ...getLatestState(),
        upiCredentialMembershipCheckResults: safeResults,
      });
      appendCredentialRows(rows, seen, deletedEmailSet, plusDeletedEmailSets, resultLookup, safeResults, successLookup);
      appendResultRows(rows, seen, deletedEmailSet, plusDeletedEmailSets, safeResults, successLookup);
      return buildMembershipViewModelRows(rows);
    }

    const { getUpiCredentialMembershipRowStatusMeta } = createAccountRecordsStatusMeta(context);
    return {
      buildUpiCredentialMembershipResultLookup,
      sanitizeUpiCredentialMembershipDisplayRow,
      mergeUpiCredentialMembershipDisplayCredentialResult,
      buildUpiCredentialMembershipDisplayRows,
      getUpiCredentialMembershipRowStatusMeta,
    };

    function appendCredentialRows(rows, seen, deletedEmailSet, plusDeletedEmailSets, resultLookup, safeResults, successLookup) {
      getUpiCredentialMembershipPoolRows().forEach((credential) => {
        const email = normalizeEmail(credential?.email);
        if (!email || deletedEmailSet.has(email)) return;
        const storedResult = resultLookup[email] || {};
        const row = buildDisplayRow({
          ...mergeUpiCredentialMembershipDisplayCredentialResult(credential, {
            ...(storedResult.status ? {} : buildFallbackFreeResult()),
            ...storedResult,
          }),
          email,
          source: credential.source || getUpiCredentialMembershipPoolSource() || safeResults.source || '',
          enabled: !isUpiCredentialMembershipEmailDisabled(email),
        }, successLookup);
        pushDisplayRow(rows, seen, row, email, plusDeletedEmailSets);
      });
    }

    function appendResultRows(rows, seen, deletedEmailSet, plusDeletedEmailSets, safeResults, successLookup) {
      (Array.isArray(safeResults.items) ? safeResults.items : []).forEach((result) => {
        const email = normalizeEmail(result?.email);
        if (!email || deletedEmailSet.has(email)) return;
        const row = buildDisplayRow({
          ...result,
          email,
          source: safeResults.source || '',
          enabled: !isUpiCredentialMembershipEmailDisabled(email),
        }, successLookup);
        pushDisplayRow(rows, seen, row, email, plusDeletedEmailSets);
      });
    }

    function buildDisplayRow(row, successLookup) {
      return applyUpiRedeemSuccessMembershipPatch(sanitizeUpiCredentialMembershipDisplayRow(row), successLookup);
    }

    function pushDisplayRow(rows, seen, row, email, plusDeletedEmailSets) {
      const rowKey = buildUpiCredentialMembershipDisplayRowKey(row, email);
      if (!rowKey || seen.has(rowKey) || isRedeemPlusDeletedDisplayRow(row, plusDeletedEmailSets)) return;
      seen.add(rowKey);
      rows.push(row);
    }

    function buildFallbackFreeResult() {
      return { status: 'free', planType: 'free', reason: 'Free 分组账号，有试用资格' };
    }

    function buildPasskeyPatch(sourceCredential, credentialId, resultCredentialId, metadataPatch) {
      const hasCredentialPasskey = sourceCredential.passkeyEnabled === true || Boolean(credentialId);
      const hasResultPasskey = Boolean(resultCredentialId);
      if (!hasCredentialPasskey || hasResultPasskey) return {};
      return {
        passkeyEnabled: true,
        passkeyEnabledAt: normalizeText(sourceCredential.passkeyEnabledAt),
        passkeyCredentialId: credentialId,
        passkeyFactorId: normalizeText(sourceCredential.passkeyFactorId || sourceCredential.factorId || sourceCredential.factor_id),
        passkeyRpId: normalizeText(sourceCredential.passkeyRpId || sourceCredential.rpId || sourceCredential.rp_id),
        passkeyUserHandle: normalizeText(sourceCredential.passkeyUserHandle || sourceCredential.userHandle || sourceCredential.user_handle),
        passkeyPrivateJwk: sourceCredential.passkeyPrivateJwk && typeof sourceCredential.passkeyPrivateJwk === 'object' && !Array.isArray(sourceCredential.passkeyPrivateJwk)
          ? sourceCredential.passkeyPrivateJwk
          : null,
        passkeyPublicKeyCose: normalizeText(sourceCredential.passkeyPublicKeyCose || sourceCredential.publicKeyCose || sourceCredential.public_key_cose),
        ...metadataPatch,
        passkeyApiPersisted: sourceCredential.passkeyApiPersisted === true || sourceCredential.persisted === true,
        twoFactorEnabled: true,
      };
    }

    function getStatusMetaFactory() {
      const helpers = globalScope.SidepanelAccountRecordsStatusMeta;
      if (!helpers || typeof helpers.createAccountRecordsStatusMeta !== 'function') {
        throw new Error('Account records status meta module is not loaded.');
      }
      return helpers.createAccountRecordsStatusMeta;
    }
  }

  const api = { createAccountRecordsDisplayModel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsDisplayModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
