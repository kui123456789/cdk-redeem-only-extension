// sidepanel/account-records-export-builders.js - Export row builders for account records.
(function attachSidepanelAccountRecordsExportBuilders(globalScope) {
  function createAccountRecordsExportBuilders(context = {}) {
    const {
      buildSubscriptionCheckId = () => '',
      getRecordEmail = () => '',
      getRecordGptPassword = () => '',
      getRecordTotpMfaSecret = () => '',
      getRecordUpiRedeemAccessToken = () => '',
      getRecordUpiRedeemCdkey = () => '',
      isRecordPaidSubscription = () => false,
      isRemoteRedeemSuccess = () => false,
      isUpiRedeemSuccessRecord = () => false,
      sanitizeExportField = (value = '') => String(value || '').trim(),
    } = context;

    function buildUpiRedeemSuccessEmailExportRows(records = [], options = {}) {
      const seen = new Set();
      const seenCdkeys = new Set();
      const usage = options?.usage || {};
      const requireRemoteSuccess = Boolean(options?.requireRemoteSuccess);
      const requirePaidSubscription = Boolean(options?.requirePaidSubscription);
      const subscriptionResults = options?.subscriptionResults || null;
      return records
        .filter((record) => isUpiRedeemSuccessRecord(record))
        .map((record) => {
          const cdkey = getRecordUpiRedeemCdkey(record);
          if (requireRemoteSuccess && (!cdkey || !isRemoteRedeemSuccess(cdkey, usage))) {
            return '';
          }
          const email = sanitizeExportField(getRecordEmail(record));
          const password = sanitizeExportField(getRecordGptPassword(record));
          const secret = sanitizeExportField(getRecordTotpMfaSecret(record));
          if (!email || !password || !secret) {
            return '';
          }
          if (requirePaidSubscription && !isRecordPaidSubscription(record, subscriptionResults)) {
            return '';
          }
          const cdkeyKey = cdkey.toLowerCase();
          if (cdkeyKey && seenCdkeys.has(cdkeyKey)) {
            return '';
          }
          const key = `${email.toLowerCase()}---${password}---${secret}`;
          if (seen.has(key)) {
            return '';
          }
          if (cdkeyKey) {
            seenCdkeys.add(cdkeyKey);
          }
          seen.add(key);
          return `${email}---${password}---${secret}`;
        })
        .filter(Boolean);
    }

    function summarizeUpiRedeemSuccessExportEligibility(records = [], options = {}) {
      const usage = options?.usage || {};
      const seen = new Set();
      const seenCdkeys = new Set();
      const summary = {
        successCount: 0,
        candidateCount: 0,
        remoteNotSuccessCount: 0,
        missingAccessTokenCount: 0,
        subscriptionNotActiveCount: 0,
        missingPasswordCount: 0,
        missingTotpMfaSecretCount: 0,
        duplicateCdkeyCount: 0,
        duplicateRowCount: 0,
        exportableCount: 0,
      };
      const requirePaidSubscription = Boolean(options?.requirePaidSubscription);
      const subscriptionResults = options?.subscriptionResults || null;

      records
        .filter((record) => isUpiRedeemSuccessRecord(record))
        .forEach((record) => {
          summary.successCount += 1;
          const email = sanitizeExportField(getRecordEmail(record));
          const password = sanitizeExportField(getRecordGptPassword(record));
          const secret = sanitizeExportField(getRecordTotpMfaSecret(record));
          if (!email) {
            return;
          }
          if (!password) {
            summary.missingPasswordCount += 1;
            return;
          }
          if (!secret) {
            summary.missingTotpMfaSecretCount += 1;
            return;
          }
          summary.candidateCount += 1;

          const cdkey = getRecordUpiRedeemCdkey(record);
          if (!cdkey || !isRemoteRedeemSuccess(cdkey, usage)) {
            summary.remoteNotSuccessCount += 1;
            return;
          }

          if (requirePaidSubscription) {
            if (!getRecordUpiRedeemAccessToken(record)) {
              summary.missingAccessTokenCount += 1;
              return;
            }
            if (!isRecordPaidSubscription(record, subscriptionResults)) {
              summary.subscriptionNotActiveCount += 1;
              return;
            }
          }

          const cdkeyKey = cdkey.toLowerCase();
          if (cdkeyKey && seenCdkeys.has(cdkeyKey)) {
            summary.duplicateCdkeyCount += 1;
            return;
          }
          const rowKey = `${email.toLowerCase()}---${password}---${secret}`;
          if (seen.has(rowKey)) {
            summary.duplicateRowCount += 1;
            return;
          }
          if (cdkeyKey) {
            seenCdkeys.add(cdkeyKey);
          }
          seen.add(rowKey);
          summary.exportableCount += 1;
        });

      return summary;
    }

    function buildUpiRedeemSuccessExportBlockedMessage(summary = {}) {
      const blockers = [];
      if (summary.missingTotpMfaSecretCount) {
        blockers.push(`${summary.missingTotpMfaSecretCount} 条缺少 2FA 密钥`);
      }
      if (summary.missingPasswordCount) {
        blockers.push(`${summary.missingPasswordCount} 条缺少 GPT 密码`);
      }
      if (summary.remoteNotSuccessCount) {
        blockers.push(`${summary.remoteNotSuccessCount} 条远端未确认成功`);
      }
      if (summary.missingAccessTokenCount) {
        blockers.push(`${summary.missingAccessTokenCount} 条缺少 accessToken，无法确认会员状态`);
      }
      if (summary.subscriptionNotActiveCount) {
        blockers.push(`${summary.subscriptionNotActiveCount} 条不是 Plus/Pro/Team 会员`);
      }

      if (!summary.candidateCount) {
        if (blockers.length) {
          return `未导出：${blockers.join('，')}。旧记录缺少 GPT 密码/2FA 的需要重新兑换生成成功记录。`;
        }
        return '没有可导出的 UPI 兑换成功邮箱 GPT 密码 2FA 记录。';
      }
      const suffix = summary.missingTotpMfaSecretCount || summary.missingPasswordCount
        ? '旧记录缺少 GPT 密码/2FA 的需要重新兑换生成成功记录。'
        : (summary.missingAccessTokenCount || summary.subscriptionNotActiveCount
          ? '请确认账号仍是 Plus/Pro/Team 会员。'
          : '请确认远端 CDK 状态。');
      return `未导出：${blockers.join('，') || '没有符合条件的记录'}。${suffix}`;
    }

    function getUpiRedeemSuccessExportSubscriptionItems(records = [], options = {}) {
      const usage = options?.usage || {};
      const seen = new Set();
      return records
        .filter((record) => isUpiRedeemSuccessRecord(record))
        .filter((record) => getRecordGptPassword(record) && getRecordTotpMfaSecret(record))
        .filter((record) => {
          const cdkey = getRecordUpiRedeemCdkey(record);
          return cdkey && isRemoteRedeemSuccess(cdkey, usage);
        })
        .map((record) => {
          const id = buildSubscriptionCheckId(record);
          const email = getRecordEmail(record);
          const cdkey = getRecordUpiRedeemCdkey(record);
          const token = getRecordUpiRedeemAccessToken(record);
          return {
            id,
            email,
            cdkey,
            token,
          };
        })
        .filter((item) => {
          const key = String(item.id || item.email || item.cdkey || '').trim().toLowerCase();
          if (!key || !item.token || seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
    }

    function getUpiRedeemSuccessExportCdkeys(records = []) {
      const seen = new Set();
      return records
        .filter((record) => isUpiRedeemSuccessRecord(record))
        .filter((record) => getRecordTotpMfaSecret(record))
        .map((record) => getRecordUpiRedeemCdkey(record))
        .filter((cdkey) => {
          if (!cdkey || seen.has(cdkey)) {
            return false;
          }
          seen.add(cdkey);
          return true;
        });
    }

    function buildUpiRedeemSuccessEmailExportFileName() {
      const stamp = new Date().toISOString()
        .replace(/\.\d{3}Z$/, '')
        .replace(/[^\dT]/g, '')
        .replace('T', '-');
      return `upi-redeem-success-password-2fa-${stamp}.txt`;
    }

    return {
      buildUpiRedeemSuccessEmailExportRows,
      summarizeUpiRedeemSuccessExportEligibility,
      buildUpiRedeemSuccessExportBlockedMessage,
      getUpiRedeemSuccessExportSubscriptionItems,
      getUpiRedeemSuccessExportCdkeys,
      buildUpiRedeemSuccessEmailExportFileName,
    };
  }

  const api = {
    createAccountRecordsExportBuilders,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsExportBuilders = api;
})(typeof window !== 'undefined' ? window : globalThis);
