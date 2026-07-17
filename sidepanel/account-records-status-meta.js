(function attachSidepanelAccountRecordsStatusMeta(globalScope) {
  function createAccountRecordsStatusMeta(context = {}) {
    const normalizeEmail = context.normalizeEmail || ((value = '') => String(value || '').trim().toLowerCase());
    const normalizeText = context.normalizeText || ((value = '') => String(value || '').trim());
    const getUpiCredentialMembershipCheckResults = typeof context.getUpiCredentialMembershipCheckResults === 'function'
      ? context.getUpiCredentialMembershipCheckResults
      : () => ({});
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
      : (value = '') => {
        const normalized = normalizeText(value).toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      };
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
        return { className: 'used', label: `有会员 ${getMembershipPlanLabel(safeRow.planType)}`, detail: paidDetail };
      }
      if (status === 'free') return buildFreeStatusMeta(safeRow, redeemStatus);
      if (status === 'failed') {
        const reason = safeRow.reason || '核验失败';
        return { className: 'failed', label: `失败：${compactMembershipReason(reason, 30)}`, detail: reason };
      }
      if (safeResults.running) return { className: 'pending', label: '待核验', detail: '等待批量核验' };
      return {
        className: safeRow.enabled === false ? '' : 'active',
        label: safeRow.enabled === false ? '停用' : '待核验',
        detail: safeRow.source === 'txt' ? 'TXT 导入' : '本地备份',
      };
    }

    function buildFreeStatusMeta(row = {}, redeemStatus = '') {
      const trialStatus = normalizeTrialEligibilityStatus(row.trialEligibilityStatus);
      const trialReason = row.trialEligibilityReason || row.reason || '';
      const no2faDetailPrefix = row.no2faFreeRoute === true ? '免 2FA Free；' : '';
      const upiFailureCount = getRedeemChannelFailureCount(row, 'upi');
      const idealFailureCount = getRedeemChannelFailureCount(row, 'ideal');
      const pixFailureCount = getRedeemChannelFailureCount(row, 'pix');
      if (isUpiCredentialMembershipRedeemLocked(row)) {
        return { className: 'failed', label: '已封存', detail: getUpiCredentialMembershipRedeemLockReason(row) };
      }
      if (isDuplicateCdkeyPendingMembershipRow(row)) {
        return {
          className: 'active',
          label: '可兑换',
          detail: `${no2faDetailPrefix}${row.redeemReason || row.reason || 'CDK 重复提交，当前账号未提交成功'}；账号已回到 Free，可重新兑换。`,
        };
      }
      if (isActiveUpiRedeemRemoteStatus(redeemStatus)) {
        return {
          className: 'pending',
          label: '等待远端结果',
          detail: `${no2faDetailPrefix}${row.redeemReason || row.reason || 'CDK 已提交，等待远端系统返回最终结果'}`,
        };
      }
      if (redeemStatus === 'canceled') {
        return {
          className: 'pending',
          label: '已取消',
          detail: `${no2faDetailPrefix}${row.redeemReason || row.reason || '后端已取消兑换；如需继续请手动重新兑换。'}`,
        };
      }
      if (redeemStatus === 'blocked' || isPreSubmitUpiCredentialMembershipBlockedRow(row)) {
        const blockedReason = row.redeemReason || row.reason || '登录或读取 accessToken 未完成';
        const blockedLabel = /登录|验证码|accessToken|AT|密码|2FA/i.test(blockedReason) ? '登录受阻' : '未提交 CDK';
        return {
          className: 'pending',
          label: blockedLabel,
          detail: isManualLoginRetryableUpiCredentialMembershipRow(row)
            ? `${no2faDetailPrefix}${blockedReason}；点击可重新登录/手动接管后继续。`
            : `${no2faDetailPrefix}${blockedReason}`,
        };
      }
      if (redeemStatus === 'failed') {
        const redeemFailureLimit = getUpiCredentialMembershipFailureLimit(row);
        const channel = normalizeRedeemChannel(row.redeemChannel || row.channel);
        const channelLabel = getRedeemChannelLabel(channel);
        const channelFailureCount = getRedeemChannelFailureCount(row, channel);
        const progressText = `UPI ${upiFailureCount}/${redeemFailureLimit} · IDEAL ${idealFailureCount}/${redeemFailureLimit} · PIX ${pixFailureCount}/${redeemFailureLimit}`;
        return {
          className: channelFailureCount >= redeemFailureLimit && channel === 'ideal' ? 'failed' : 'pending',
          label: `${channelLabel} ${channelFailureCount}/${redeemFailureLimit}`,
          detail: `${no2faDetailPrefix}${row.redeemReason || row.reason || '历史 CDK 兑换失败'}；${progressText}；${trialStatus === 'eligible' ? '账号有试用资格。' : '账号保留在 Free。'}`,
        };
      }
      if (!normalizeText(row.accessToken)) {
        return {
          className: 'pending',
          label: '缺 AT',
          detail: `${no2faDetailPrefix}账号有试用资格，但缺少 AT；可点击“一键补充 AT”。`,
        };
      }
      if (trialStatus === 'eligible') return buildEligibleFreeStatusMeta(row, no2faDetailPrefix, trialReason);
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
        label: row.no2faFreeRoute === true
          ? (normalizeText(row.accessToken) ? '免2FA待兑换' : '免2FA Free')
          : (normalizeText(row.accessToken) ? '待兑换' : '有试用资格'),
        detail: `${no2faDetailPrefix}${row.trialEligibilityReason || row.reason || 'Free 分组账号，等待分配 CDK 兑换'}`,
      };
    }

    function buildEligibleFreeStatusMeta(row, no2faDetailPrefix, trialReason) {
      const upiChannelBlockedDetail = getTrialEligibilityChannelBlockedDetail(row, 'upi');
      const idealChannelBlockedDetail = getTrialEligibilityChannelBlockedDetail(row, 'ideal');
      const pixChannelBlockedDetail = getTrialEligibilityChannelBlockedDetail(row, 'pix');
      if (upiChannelBlockedDetail && idealChannelBlockedDetail && pixChannelBlockedDetail) {
        return {
          className: 'pending',
          label: '渠道不可用',
          detail: `${no2faDetailPrefix}${upiChannelBlockedDetail}；${idealChannelBlockedDetail}；${pixChannelBlockedDetail}。账号有试用资格，但当前没有可用兑换渠道。`,
        };
      }
      const channelDetail = [
        upiChannelBlockedDetail ? `UPI 不可用：${upiChannelBlockedDetail}` : '',
        idealChannelBlockedDetail ? `IDEAL 不可用：${idealChannelBlockedDetail}` : '',
        pixChannelBlockedDetail ? `PIX 不可用：${pixChannelBlockedDetail}` : '',
      ].filter(Boolean).join('；');
      return {
        className: 'active',
        label: row.no2faFreeRoute === true ? '免2FA待兑换' : '待兑换',
        detail: `${no2faDetailPrefix}${trialReason || '试用资格已确认，等待分配 CDK 兑换'}${channelDetail ? `；${channelDetail}` : ''}`,
      };
    }

    return { getUpiCredentialMembershipRowStatusMeta };
  }

  const api = { createAccountRecordsStatusMeta };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsStatusMeta = api;
})(typeof window !== 'undefined' ? window : globalThis);
