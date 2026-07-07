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
    const getUpiCredentialMembershipFlowTitle = typeof context.getUpiCredentialMembershipFlowTitle === 'function'
      ? context.getUpiCredentialMembershipFlowTitle
      : () => '';
    const getMembershipPlanLabel = typeof context.getMembershipPlanLabel === 'function'
      ? context.getMembershipPlanLabel
      : (value = '') => normalizeText(value);
    const normalizeTrialEligibilityStatus = typeof context.normalizeTrialEligibilityStatus === 'function'
      ? context.normalizeTrialEligibilityStatus
      : () => '';
    const getRedeemChannelFailureCount = typeof context.getRedeemChannelFailureCount === 'function'
      ? context.getRedeemChannelFailureCount
      : () => 0;
    const isUpiCredentialMembershipRedeemLocked = typeof context.isUpiCredentialMembershipRedeemLocked === 'function'
      ? context.isUpiCredentialMembershipRedeemLocked
      : () => false;
    const getUpiCredentialMembershipRedeemLockReason = typeof context.getUpiCredentialMembershipRedeemLockReason === 'function'
      ? context.getUpiCredentialMembershipRedeemLockReason
      : () => '';
    const isDuplicateCdkeyPendingMembershipRow = typeof context.isDuplicateCdkeyPendingMembershipRow === 'function'
      ? context.isDuplicateCdkeyPendingMembershipRow
      : () => false;
    const isActiveUpiRedeemRemoteStatus = typeof context.isActiveUpiRedeemRemoteStatus === 'function'
      ? context.isActiveUpiRedeemRemoteStatus
      : () => false;
    const getUpiCredentialMembershipFailureLimit = typeof context.getUpiCredentialMembershipFailureLimit === 'function'
      ? context.getUpiCredentialMembershipFailureLimit
      : () => 0;
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => normalizeText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    const getRedeemChannelLabel = typeof context.getRedeemChannelLabel === 'function'
      ? context.getRedeemChannelLabel
      : (value = '') => normalizeText(value).toUpperCase();
    const isPreSubmitUpiCredentialMembershipBlockedRow = typeof context.isPreSubmitUpiCredentialMembershipBlockedRow === 'function'
      ? context.isPreSubmitUpiCredentialMembershipBlockedRow
      : () => false;
    const isManualLoginRetryableUpiCredentialMembershipRow = typeof context.isManualLoginRetryableUpiCredentialMembershipRow === 'function'
      ? context.isManualLoginRetryableUpiCredentialMembershipRow
      : () => false;
    const getTrialEligibilityChannelBlockedDetail = typeof context.getTrialEligibilityChannelBlockedDetail === 'function'
      ? context.getTrialEligibilityChannelBlockedDetail
      : () => '';
    const compactMembershipReason = typeof context.compactMembershipReason === 'function'
      ? context.compactMembershipReason
      : (value = '') => normalizeText(value);
    const getUpiCredentialMembershipCheckingEmail = typeof context.getUpiCredentialMembershipCheckingEmail === 'function'
      ? context.getUpiCredentialMembershipCheckingEmail
      : () => '';
    const getUpiCredentialMembershipLoginEmail = typeof context.getUpiCredentialMembershipLoginEmail === 'function'
      ? context.getUpiCredentialMembershipLoginEmail
      : () => '';
    const getUpiCredentialMembershipRedeemProgressMeta = typeof context.getUpiCredentialMembershipRedeemProgressMeta === 'function'
      ? context.getUpiCredentialMembershipRedeemProgressMeta
      : () => ({});

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
      const credentialHasPasskey = sourceCredential.passkeyEnabled === true || Boolean(credentialPasskeyCredentialId);
      const resultHasPasskey = sourceResult.passkeyEnabled === true || Boolean(resultPasskeyCredentialId);
      const passkeyNumericMetadataPatch = collectPasskeyNumericMetadataPatch(sourceResult, sourceCredential);
      const passkeyPatch = credentialHasPasskey && !resultHasPasskey
        ? {
          passkeyEnabled: true,
          passkeyEnabledAt: normalizeText(sourceCredential.passkeyEnabledAt),
          passkeyCredentialId: credentialPasskeyCredentialId,
          passkeyFactorId: normalizeText(sourceCredential.passkeyFactorId || sourceCredential.factorId || sourceCredential.factor_id),
          passkeyRpId: normalizeText(sourceCredential.passkeyRpId || sourceCredential.rpId || sourceCredential.rp_id),
          passkeyUserHandle: normalizeText(sourceCredential.passkeyUserHandle || sourceCredential.userHandle || sourceCredential.user_handle),
          passkeyPrivateJwk: sourceCredential.passkeyPrivateJwk && typeof sourceCredential.passkeyPrivateJwk === 'object' && !Array.isArray(sourceCredential.passkeyPrivateJwk)
            ? sourceCredential.passkeyPrivateJwk
            : null,
          passkeyPublicKeyCose: normalizeText(sourceCredential.passkeyPublicKeyCose || sourceCredential.publicKeyCose || sourceCredential.public_key_cose),
          ...passkeyNumericMetadataPatch,
          passkeyApiPersisted: sourceCredential.passkeyApiPersisted === true || sourceCredential.persisted === true,
          twoFactorEnabled: true,
        }
        : {};
      return {
        ...sourceCredential,
        ...sourceResult,
        ...(normalizeText(sourceResult.password) ? {} : {
          password: normalizeText(sourceCredential.password),
          gptPassword: normalizeText(sourceCredential.gptPassword || sourceCredential.password),
        }),
        ...passkeyPatch,
        ...passkeyNumericMetadataPatch,
      };
    }

    function buildUpiCredentialMembershipResultLookup(items = []) {
      const lookup = {};
      (Array.isArray(items) ? items : []).forEach((rawItem) => {
        const item = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? rawItem : {};
        const email = normalizeEmail(item.email);
        if (!email) {
          return;
        }
        lookup[email] = item;
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
      getUpiCredentialMembershipPoolRows().forEach((credential) => {
        const email = normalizeEmail(credential?.email);
        if (!email || deletedEmailSet.has(email)) {
          return;
        }
        const storedResult = resultLookup[email] || {};
        const fallbackFreeResult = storedResult.status ? {} : {
          status: 'free',
          planType: 'free',
          reason: 'Free 分组账号，有试用资格',
        };
        const row = applyUpiRedeemSuccessMembershipPatch(sanitizeUpiCredentialMembershipDisplayRow({
          ...mergeUpiCredentialMembershipDisplayCredentialResult(credential, {
            ...fallbackFreeResult,
            ...storedResult,
          }),
          email,
          source: credential.source || getUpiCredentialMembershipPoolSource() || safeResults.source || '',
          enabled: !isUpiCredentialMembershipEmailDisabled(email),
        }), successLookup);
        const rowKey = buildUpiCredentialMembershipDisplayRowKey(row, email);
        if (!rowKey || seen.has(rowKey)) {
          return;
        }
        seen.add(rowKey);
        if (isRedeemPlusDeletedDisplayRow(row, plusDeletedEmailSets)) {
          return;
        }
        rows.push(row);
      });
      (Array.isArray(safeResults.items) ? safeResults.items : []).forEach((result) => {
        const email = normalizeEmail(result?.email);
        if (!email || deletedEmailSet.has(email)) {
          return;
        }
        const row = applyUpiRedeemSuccessMembershipPatch(sanitizeUpiCredentialMembershipDisplayRow({
          ...result,
          email,
          source: safeResults.source || '',
          enabled: !isUpiCredentialMembershipEmailDisabled(email),
        }), successLookup);
        const rowKey = buildUpiCredentialMembershipDisplayRowKey(row, email);
        if (!rowKey || seen.has(rowKey)) {
          return;
        }
        seen.add(rowKey);
        if (isRedeemPlusDeletedDisplayRow(row, plusDeletedEmailSets)) {
          return;
        }
        rows.push(row);
      });
      return buildMembershipViewModelRows(rows);
    }

    function getUpiCredentialMembershipRowStatusMeta(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      const safeRow = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
      const safeResults = results && typeof results === 'object' && !Array.isArray(results) ? results : {};
      const rowEmail = normalizeEmail(safeRow.email);
      const currentEmail = normalizeEmail(safeResults.flowStageEmail);
      const checkingEmail = normalizeEmail(getUpiCredentialMembershipCheckingEmail());
      const loginEmail = normalizeEmail(getUpiCredentialMembershipLoginEmail());
      if (loginEmail && rowEmail === loginEmail) {
        return { className: 'pending', label: '登录中', detail: '正在登录' };
      }
      if (checkingEmail && rowEmail === checkingEmail) {
        return { className: 'pending', label: '检测中', detail: '正在单独检测是否有 Plus/Pro/Team 会员' };
      }
      const redeemStatus = String(safeRow.redeemStatus || '').trim().toLowerCase();
      const isStoppedResult = String(safeRow.status || '').trim().toLowerCase() === 'stopped'
        || redeemStatus === 'stopped'
        || (rowEmail && currentEmail && rowEmail === currentEmail && (safeResults.stoppedAt || safeResults.redeemStoppedAt));
      if (isStoppedResult) {
        return {
          className: 'pending',
          label: '已停止',
          detail: safeRow.redeemReason || safeRow.reason || getUpiCredentialMembershipFlowTitle(safeResults.flowStage),
        };
      }
      if ((safeResults.running || safeResults.redeeming) && rowEmail && currentEmail && rowEmail === currentEmail) {
        return {
          className: 'pending',
          label: safeResults.redeeming ? '兑换中' : '核验中',
          detail: getUpiCredentialMembershipFlowTitle(safeResults.flowStage),
        };
      }
      const status = String(safeRow.status || '').trim().toLowerCase();
      if (status === 'paid') {
        const paidDetail = redeemStatus === 'skipped'
          ? (safeRow.redeemReason || safeRow.reason || '重新核验已是会员，未消耗 CDK')
          : (safeRow.reason || safeRow.redeemReason || '已确认会员');
        return {
          className: 'used',
          label: `有会员 ${getMembershipPlanLabel(safeRow.planType)}`,
          detail: paidDetail,
        };
      }
      if (status === 'free') {
        const trialStatus = normalizeTrialEligibilityStatus(safeRow.trialEligibilityStatus);
        const trialReason = safeRow.trialEligibilityReason || safeRow.reason || '';
        const no2faDetailPrefix = safeRow.no2faFreeRoute === true ? '免 2FA Free；' : '';
        const upiFailureCount = getRedeemChannelFailureCount(safeRow, 'upi');
        const idealFailureCount = getRedeemChannelFailureCount(safeRow, 'ideal');
        if (isUpiCredentialMembershipRedeemLocked(safeRow)) {
          return { className: 'failed', label: '已封存', detail: getUpiCredentialMembershipRedeemLockReason(safeRow) };
        }
        if (isDuplicateCdkeyPendingMembershipRow(safeRow)) {
          return {
            className: 'active',
            label: '可兑换',
            detail: `${no2faDetailPrefix}${safeRow.redeemReason || safeRow.reason || 'CDK 重复提交，当前账号未提交成功'}；账号已回到 Free，可重新兑换。`,
          };
        }
        if (isActiveUpiRedeemRemoteStatus(redeemStatus)) {
          return {
            className: 'pending',
            label: '等待远端结果',
            detail: `${no2faDetailPrefix}${safeRow.redeemReason || safeRow.reason || 'CDK 已提交，等待远端系统返回最终结果'}`,
          };
        }
        if (redeemStatus === 'canceled') {
          return {
            className: 'pending',
            label: '已取消',
            detail: `${no2faDetailPrefix}${safeRow.redeemReason || safeRow.reason || '后端已取消兑换；如需继续请手动重新兑换。'}`,
          };
        }
        if (redeemStatus === 'blocked' || isPreSubmitUpiCredentialMembershipBlockedRow(safeRow)) {
          const blockedReason = safeRow.redeemReason || safeRow.reason || '登录或读取 accessToken 未完成';
          const blockedLabel = /登录|验证码|accessToken|AT|密码|2FA/i.test(blockedReason) ? '登录受阻' : '未提交 CDK';
          return {
            className: 'pending',
            label: blockedLabel,
            detail: isManualLoginRetryableUpiCredentialMembershipRow(safeRow)
              ? `${no2faDetailPrefix}${blockedReason}；点击可重新登录/手动接管后继续。`
              : `${no2faDetailPrefix}${blockedReason}`,
          };
        }
        if (redeemStatus === 'failed') {
          const redeemFailureLimit = getUpiCredentialMembershipFailureLimit(safeRow);
          const channel = normalizeRedeemChannel(safeRow.redeemChannel || safeRow.channel);
          const channelLabel = getRedeemChannelLabel(channel);
          const channelFailureCount = getRedeemChannelFailureCount(safeRow, channel);
          const progressText = `UPI ${upiFailureCount}/${redeemFailureLimit} · IDEAL ${idealFailureCount}/${redeemFailureLimit}`;
          return {
            className: channelFailureCount >= redeemFailureLimit && channel === 'ideal' ? 'failed' : 'pending',
            label: `${channelLabel} ${channelFailureCount}/${redeemFailureLimit}`,
            detail: `${no2faDetailPrefix}${safeRow.redeemReason || safeRow.reason || '历史 CDK 兑换失败'}；${progressText}；${trialStatus === 'eligible' ? '账号有试用资格。' : '账号保留在 Free。'}`,
          };
        }
        if (!normalizeText(safeRow.accessToken)) {
          return {
            className: 'pending',
            label: '缺 AT',
            detail: `${no2faDetailPrefix}账号有试用资格，但缺少 AT；可点击“一键补充 AT”。`,
          };
        }
        if (trialStatus === 'eligible') {
          const upiChannelBlockedDetail = getTrialEligibilityChannelBlockedDetail(safeRow, 'upi');
          const idealChannelBlockedDetail = getTrialEligibilityChannelBlockedDetail(safeRow, 'ideal');
          if (upiChannelBlockedDetail && idealChannelBlockedDetail) {
            return {
              className: 'pending',
              label: '渠道不可用',
              detail: `${no2faDetailPrefix}${upiChannelBlockedDetail}；${idealChannelBlockedDetail}。账号有试用资格，但当前没有可用兑换渠道。`,
            };
          }
          const channelDetail = [
            upiChannelBlockedDetail ? `UPI 不可用：${upiChannelBlockedDetail}` : '',
            idealChannelBlockedDetail ? `IDEAL 不可用：${idealChannelBlockedDetail}` : '',
          ].filter(Boolean).join('；');
          return {
            className: 'active',
            label: safeRow.no2faFreeRoute === true ? '免2FA待兑换' : '待兑换',
            detail: `${no2faDetailPrefix}${trialReason || '试用资格已确认，等待分配 CDK 兑换'}${channelDetail ? `；${channelDetail}` : ''}`,
          };
        }
        if (trialStatus === 'ineligible') {
          return { className: 'failed', label: '无试用资格', detail: `${no2faDetailPrefix}${trialReason || '账号无试用资格'}` };
        }
        if (trialStatus === 'failed') {
          return { className: 'failed', label: '试用检测失败', detail: `${no2faDetailPrefix}${trialReason || '试用资格检测失败，账号已保留'}` };
        }
        if (trialStatus === 'skipped') {
          return { className: 'pending', label: '未检测资格', detail: `${no2faDetailPrefix}${trialReason || '缺少必要信息，未检测试用资格'}` };
        }
        return {
          className: 'active',
          label: safeRow.no2faFreeRoute === true
            ? (normalizeText(safeRow.accessToken) ? '免2FA待兑换' : '免2FA Free')
            : (normalizeText(safeRow.accessToken) ? '待兑换' : '有试用资格'),
          detail: `${no2faDetailPrefix}${safeRow.trialEligibilityReason || safeRow.reason || 'Free 分组账号，等待分配 CDK 兑换'}`,
        };
      }
      if (status === 'failed') {
        const reason = safeRow.reason || '核验失败';
        return { className: 'failed', label: `失败：${compactMembershipReason(reason, 30)}`, detail: reason };
      }
      if (safeResults.running) {
        return { className: 'pending', label: '待核验', detail: '等待批量核验' };
      }
      return {
        className: safeRow.enabled === false ? '' : 'active',
        label: safeRow.enabled === false ? '停用' : '待核验',
        detail: safeRow.source === 'txt' ? 'TXT 导入' : '本地备份',
      };
    }

    return {
      buildUpiCredentialMembershipResultLookup,
      sanitizeUpiCredentialMembershipDisplayRow,
      mergeUpiCredentialMembershipDisplayCredentialResult,
      buildUpiCredentialMembershipDisplayRows,
      getUpiCredentialMembershipRowStatusMeta,
    };
  }
  const api = { createAccountRecordsDisplayModel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsDisplayModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
