// sidepanel/account-records-membership-actions.js - Membership runtime actions for account records.
(function attachSidepanelAccountRecordsMembershipActions(globalScope) {
  function createAccountRecordsMembershipActions(context = {}) {
    const {
      state = {},
      helpers = {},
      runtime = {},
      getMembershipCheckSettingsPayload = () => ({}),
      getUpiCredentialMembershipCheckResults = () => ({}),
      mergeManualFreeMembershipOverridesIntoResults = (results) => results,
      getEnabledFreeUpiCredentialMembershipRowsMissingAt = () => [],
      getEnabledFreeUpiCredentialMembershipRowsWithAt = () => [],
      getEnabledPlusUpiCredentialMembershipRowsWithAt = () => [],
      normalizeUpiCredentialMembershipText = (value = '') => String(value || '').trim(),
      normalizeUpiCredentialMembershipEmail = (value = '') => String(value || '').trim().toLowerCase(),
      getUpiCredentialMembershipDisplayRowByEmail = () => null,
      hasUpiCredentialMembershipLoginMaterial = () => false,
      buildUpiCredentialMembershipActionCredential = (row = {}) => ({ ...row }),
      mergeUpiCredentialMembershipResultItem = () => {},
      renderUpiCredentialMembershipCheckResults = () => {},
      getUpiCredentialMembershipCheckingEmail = () => '',
      getUpiCredentialMembershipLoginEmail = () => '',
      setUpiCredentialMembershipLoginEmail = () => {},
      setUpiCredentialMembershipCheckBusy = () => {},
      setUpiCredentialMembershipRedeemBusy = () => {},
      setExportButtonsBusy = () => {},
      render = () => {},
    } = context;

    function syncMembershipResults(results) {
      if (!results || typeof state.syncLatestState !== 'function') {
        return;
      }
      state.syncLatestState({
        upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(results),
      });
    }

    async function refreshUpiCredentialMembershipCheckResults() {
      const response = await runtime.sendMessage?.({
        type: 'GET_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.results) {
        syncMembershipResults(response.results);
        setUpiCredentialMembershipCheckBusy(response.results.running === true);
        setUpiCredentialMembershipRedeemBusy(response.results.redeeming === true);
      }
      return response?.results || null;
    }

    async function fillFreeUpiCredentialMembershipAccessTokens() {
      const credentials = getEnabledFreeUpiCredentialMembershipRowsMissingAt();
      if (!credentials.length) {
        helpers.showToast?.('Free 分组没有缺 AT 的启用账号。', 'warn', 2000);
        return;
      }
      try {
        setUpiCredentialMembershipCheckBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage?.({
          type: 'FILL_UPI_CREDENTIAL_MEMBERSHIP_FREE_ACCESS_TOKENS',
          source: 'sidepanel',
          payload: {
            source: 'free-fill-at',
            credentials,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          syncMembershipResults(response.results);
        }
        const skippedReason = Array.isArray(response?.skipped) && response.skipped.length
          ? normalizeUpiCredentialMembershipText(response.skipped[0]?.reason || '')
          : '';
        const failedReason = Array.isArray(response?.failed) && response.failed.length
          ? normalizeUpiCredentialMembershipText(response.failed[0]?.reason || '')
          : '';
        const detailText = [
          skippedReason ? `跳过原因：${skippedReason}` : '',
          failedReason ? `失败原因：${failedReason}` : '',
        ].filter(Boolean).join('；');
        helpers.showToast?.(
          `补充 AT 完成：成功 ${response?.filled?.length || 0}，跳过 ${response?.skipped?.length || 0}，失败 ${response?.failed?.length || 0}${detailText ? `。${detailText}` : '。'}`,
          'success',
          4200
        );
      } catch (error) {
        helpers.showToast?.(`补充 AT 失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function identifyFreeUpiCredentialMembershipPlus(options = {}) {
      const credentials = getEnabledFreeUpiCredentialMembershipRowsWithAt();
      if (!credentials.length) {
        helpers.showToast?.('Free 分组没有带 AT 的启用账号。', 'warn', 2000);
        return;
      }
      const allowDuringAutoRun = options.allowDuringAutoRun === true;
      const source = allowDuringAutoRun ? 'free-refresh-email-statuses' : 'free-identify-plus';
      try {
        setUpiCredentialMembershipCheckBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage?.({
          type: 'IDENTIFY_UPI_CREDENTIAL_MEMBERSHIP_FREE_PLUS',
          source: 'sidepanel',
          payload: {
            source,
            allowDuringAutoRun,
            credentials,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          syncMembershipResults(response.results);
        }
        helpers.showToast?.(
          `已刷新邮箱状态：Plus ${response?.paid?.length || 0}，仍 Free ${response?.free?.length || 0}，失败 ${response?.failed?.length || 0}，跳过 ${response?.skipped?.length || 0}。`,
          'success',
          2600
        );
      } catch (error) {
        helpers.showToast?.(`识别 Plus 失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function verifyPlusUpiCredentialMembershipRows() {
      const credentials = getEnabledPlusUpiCredentialMembershipRowsWithAt();
      if (!credentials.length) {
        helpers.showToast?.('Plus 分组没有带 AT 的启用账号。', 'warn', 2000);
        return;
      }
      try {
        setUpiCredentialMembershipCheckBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage?.({
          type: 'VERIFY_UPI_CREDENTIAL_MEMBERSHIP_PLUS',
          source: 'sidepanel',
          payload: {
            source: 'plus-verify',
            credentials,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          syncMembershipResults(response.results);
        }
        helpers.showToast?.(
          `验证 Plus 完成：仍 Plus ${response?.paid?.length || 0}，转 Free ${response?.free?.length || 0}，失败 ${response?.failed?.length || 0}。`,
          'success',
          2600
        );
      } catch (error) {
        helpers.showToast?.(`验证 Plus 失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function loginUpiCredentialMembershipAccount(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail || getUpiCredentialMembershipCheckingEmail() || getUpiCredentialMembershipLoginEmail()) {
        return;
      }
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      if (!hasUpiCredentialMembershipLoginMaterial(row)) {
        helpers.showToast?.(`账号 ${normalizedEmail} 缺少密码或 2FA，无法登录。`, 'error');
        return;
      }
      setUpiCredentialMembershipLoginEmail(normalizedEmail);
      setUpiCredentialMembershipCheckBusy(true);
      render();
      try {
        const response = await runtime.sendMessage?.({
          type: 'LOGIN_UPI_CREDENTIAL_MEMBERSHIP_ACCOUNT',
          source: 'sidepanel',
          payload: {
            email: normalizedEmail,
            source: 'row-login',
            readAccessToken: false,
            credential: buildUpiCredentialMembershipActionCredential(row),
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          syncMembershipResults(response.results);
        }
        if (response?.item) {
          mergeUpiCredentialMembershipResultItem(response.item);
        }
        helpers.showToast?.(`${normalizedEmail} 登录完成。`, 'success', 2200);
      } catch (error) {
        helpers.showToast?.(`登录 ${normalizedEmail} 失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipLoginEmail('');
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        render();
      }
    }

    async function moveUpiCredentialMembershipAccountGroup(email = '', targetStatus = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      const normalizedTarget = String(targetStatus || '').trim().toLowerCase() === 'paid' ? 'paid' : 'free';
      if (!normalizedEmail) {
        return;
      }
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      try {
        setUpiCredentialMembershipCheckBusy(true);
        const response = await runtime.sendMessage?.({
          type: 'MOVE_UPI_CREDENTIAL_MEMBERSHIP_ACCOUNT_GROUP',
          source: 'sidepanel',
          payload: {
            email: normalizedEmail,
            targetStatus: normalizedTarget,
            credential: buildUpiCredentialMembershipActionCredential(row),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          syncMembershipResults(response.results);
        }
        if (response?.item) {
          mergeUpiCredentialMembershipResultItem(response.item);
        }
        helpers.showToast?.(
          `${normalizedEmail} 已移到 ${normalizedTarget === 'paid' ? 'Plus' : 'Free'} 组。`,
          'success',
          1800
        );
      } catch (error) {
        helpers.showToast?.(`移动 ${normalizedEmail} 分组失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        render();
      }
    }

    return {
      refreshUpiCredentialMembershipCheckResults,
      fillFreeUpiCredentialMembershipAccessTokens,
      identifyFreeUpiCredentialMembershipPlus,
      verifyPlusUpiCredentialMembershipRows,
      loginUpiCredentialMembershipAccount,
      moveUpiCredentialMembershipAccountGroup,
    };
  }

  const api = {
    createAccountRecordsMembershipActions,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsMembershipActions = api;
})(typeof window !== 'undefined' ? window : globalThis);
