// sidepanel/account-records-membership-access-token-actions.js - Batch AT validation and refresh action.
(function attachSidepanelAccountRecordsMembershipAccessTokenActions(globalScope) {
  function createAccountRecordsMembershipAccessTokenActions(context = {}) {
    const {
      state = {},
      helpers = {},
      runtime = {},
      getMembershipCheckSettingsPayload = () => ({}),
      getEnabledFreeUpiCredentialMembershipRowsWithAt = () => [],
      mergeManualFreeMembershipOverridesIntoResults = (results) => results,
      normalizeUpiCredentialMembershipText = (value = '') => String(value || '').trim(),
      refreshUpiCredentialMembershipCheckResults = async () => null,
      setUpiCredentialMembershipCheckBusy = () => {},
      setExportButtonsBusy = () => {},
      render = () => {},
    } = context;

    function syncMembershipResults(results) {
      if (!results || typeof state.syncLatestState !== 'function') return;
      state.syncLatestState({
        upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(results),
      });
    }

    async function refreshUpiCredentialMembershipAccessTokens() {
      const credentials = getEnabledFreeUpiCredentialMembershipRowsWithAt();
      if (!credentials.length) {
        helpers.showToast?.('Free/失败分组没有带 AT 的启用账号。', 'warn', 2000);
        return;
      }
      try {
        setUpiCredentialMembershipCheckBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage?.({
          type: 'REFRESH_UPI_CREDENTIAL_MEMBERSHIP_ACCESS_TOKENS',
          source: 'sidepanel',
          payload: {
            source: 'free-refresh-invalid-at',
            credentials,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) throw new Error(response.error);
        if (response?.results) syncMembershipResults(response.results);
        const failedReason = Array.isArray(response?.failed) && response.failed.length
          ? normalizeUpiCredentialMembershipText(response.failed[0]?.reason || '')
          : '';
        helpers.showToast?.(
          `AT 检查完成：有效 ${response?.valid?.length || 0}，刷新成功 ${response?.refreshed?.length || 0}，失败 ${response?.failed?.length || 0}${failedReason ? `。首个失败：${failedReason}` : '。'}`,
          response?.failed?.length ? 'warn' : 'success',
          4200
        );
      } catch (error) {
        helpers.showToast?.(`AT 检查刷新失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    return { refreshUpiCredentialMembershipAccessTokens };
  }

  const api = { createAccountRecordsMembershipAccessTokenActions };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsMembershipAccessTokenActions = api;
})(typeof window !== 'undefined' ? window : globalThis);
