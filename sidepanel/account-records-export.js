// sidepanel/account-records-export.js - Account record export field helpers.
(function attachSidepanelAccountRecordsExport(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function createAccountRecordsExportHelpers(context = {}) {
    const {
      accountRecordsViewModel = {},
    } = context;

    function buildRecordId(record = {}) {
      if (typeof accountRecordsViewModel.buildRecordId === 'function') {
        return accountRecordsViewModel.buildRecordId(record);
      }
      return normalizeText(record.recordId || record.email || record.accountIdentifier).toLowerCase();
    }

    function getRecordDisplayStatus(record = {}) {
      if (typeof accountRecordsViewModel.getRecordDisplayStatus === 'function') {
        return accountRecordsViewModel.getRecordDisplayStatus(record);
      }
      return normalizeText(record.displayStatus || record.finalStatus).toLowerCase();
    }

    function getRecordExportUrl(record = {}) {
      return normalizeText(
        record.emailVerificationUrl
        || record.emailUrl
        || record.mailVerificationUrl
        || record.verificationUrl
        || record.url
        || record.localhostUrl
        || record.oauthUrl
        || record.callbackUrl
        || record.contributionCallbackUrl
        || record.plusReturnUrl
        || record.finalUrl
        || ''
      );
    }

    function getRecordTotpMfaSecret(record = {}) {
      return normalizeText(
        record.totpMfaSecret
        || record.totpSecret
        || record.twoFactorSecret
        || record.twoFaSecret
        || ''
      );
    }

    function getRecordGptPassword(record = {}) {
      return normalizeText(
        record.password
        || record.gptPassword
        || record.chatGptPassword
        || record.openAiPassword
        || record.accountPassword
        || record.customPassword
        || ''
      );
    }

    function sanitizeExportField(value = '') {
      return normalizeText(value).replace(/[\r\n]+/g, ' ').trim();
    }

    function isUpiRedeemSuccessRecord(record = {}) {
      return record?.upiRedeemSuccess === true
        || normalizeText(record?.upiRedeemSuccess).toLowerCase() === 'true';
    }

    function getRecordUpiRedeemCdkey(record = {}) {
      return normalizeText(record.upiRedeemCdkey || record.cdkey);
    }

    function getRecordUpiRedeemAccessToken(record = {}) {
      return normalizeText(
        record.upiRedeemAccessToken
        || record.accessToken
        || record.chatGptAccessToken
        || record.acToken
        || record.token
        || ''
      );
    }

    return {
      buildRecordId,
      getRecordDisplayStatus,
      getRecordExportUrl,
      getRecordTotpMfaSecret,
      getRecordGptPassword,
      sanitizeExportField,
      isUpiRedeemSuccessRecord,
      getRecordUpiRedeemCdkey,
      getRecordUpiRedeemAccessToken,
    };
  }

  const api = {
    createAccountRecordsExportHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsExport = api;
})(typeof window !== 'undefined' ? window : globalThis);
