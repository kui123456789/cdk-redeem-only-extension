// sidepanel/account-records-membership-pool-ops.js - Membership pool import/export and local check operations.
(function attachSidepanelAccountRecordsMembershipPoolOps(globalScope) {
  function createAccountRecordsMembershipPoolOps(context = {}) {
    const {
      state = {},
      dom = {},
      helpers = {},
      runtime = {},
      parseUpiCredentialMembershipText = () => [],
      getUpiCredentialMembershipCheckResults = () => ({ items: [] }),
      mergeManualFreeMembershipOverridesIntoResults = (results) => results,
      buildUpiCredentialMembershipDisplayRows = () => [],
      normalizeUpiCredentialMembershipEmail = (value = '') => String(value || '').trim().toLowerCase(),
      isActiveUpiCredentialMembershipRedeemRowOrUsage = () => false,
      renderUpiCredentialMembershipCheckResults = () => {},
      getEnabledUpiCredentialMembershipPoolRows = () => [],
      getEnabledFreeUpiCredentialMembershipRowsForChannel = () => [],
      startUpiCredentialMembershipFreeRedeem = async () => {},
      getMembershipCheckSettingsPayload = () => ({}),
      refreshUpiCredentialMembershipCheckResults = async () => null,
      getUpiCredentialMembershipPoolRows = () => [],
      setUpiCredentialMembershipPoolRows = () => {},
      getUpiCredentialMembershipPoolSource = () => '',
      getUpiCredentialMembershipPoolLoaded = () => false,
      setUpiCredentialMembershipPoolLoaded = () => {},
      getUpiCredentialMembershipPoolLoading = () => false,
      setUpiCredentialMembershipPoolLoading = () => {},
      clearLocallyDeletedUpiCredentialMembershipEmails = () => {},
      clearLocallyDeletedRedeemPlusEmailsByChannel = () => {},
      deleteLocallyDeletedUpiCredentialMembershipEmail = () => {},
      setExportButtonsBusy = () => {},
      render = () => {},
      getAvailableUpiRedeemCdkeyCount = () => 0,
      normalizeRedeemChannel = (value = '') => (String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi'),
      getUpiCredentialMembershipCheckBusy = () => false,
      setUpiCredentialMembershipCheckBusy = () => {},
      getUpiCredentialMembershipRedeemBusy = () => false,
      setUpiCredentialMembershipRedeemBusy = () => {},
      getUpiCredentialMembershipAllRedeemBusy = () => false,
      isAutoRunRecordDisplayRunning = () => false,
      setUpiCredentialBackupPreviewVisible = () => {},
      setUpiCredentialBackupPreviewText = () => {},
    } = context;

    async function fetchUpiCredentialBackupExportPayload() {
      const response = await runtime.sendMessage({
        type: 'EXPORT_UPI_ACCOUNT_CREDENTIAL_BACKUPS',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      return response || {};
    }

    async function fetchUpiCredentialMembershipCredentialPool() {
      const response = await runtime.sendMessage({
        type: 'GET_UPI_CREDENTIAL_MEMBERSHIP_CREDENTIAL_POOL',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      return response?.pool || { items: [] };
    }

    async function refreshUpiCredentialMembershipCredentialPool(options = {}) {
      if (getUpiCredentialMembershipPoolLoading()) {
        return getUpiCredentialMembershipPoolRows();
      }
      setUpiCredentialMembershipPoolLoading(true);
      try {
        const pool = await fetchUpiCredentialMembershipCredentialPool();
        setUpiCredentialMembershipPoolRows(pool?.items || [], 'local');
        setUpiCredentialMembershipPoolLoaded(true);
        renderUpiCredentialMembershipCheckResults();
        return getUpiCredentialMembershipPoolRows();
      } catch (error) {
        if (!options.silent) {
          helpers.showToast?.(`读取 UPI 备份账号核验池失败：${error.message}`, 'error');
        }
        return getUpiCredentialMembershipPoolRows();
      } finally {
        setUpiCredentialMembershipPoolLoading(false);
      }
    }

    async function reloadUpiCredentialMembershipAfterRuntimeImport(options = {}) {
      clearLocallyDeletedUpiCredentialMembershipEmails();
      clearLocallyDeletedRedeemPlusEmailsByChannel();
      setUpiCredentialMembershipPoolLoaded(false);
      return refreshUpiCredentialMembershipCredentialPool({
        silent: true,
        ...(options || {}),
      });
    }

    async function exportUpiCredentialBackupTextFile() {
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        setExportButtonsBusy(true);
        const response = await fetchUpiCredentialBackupExportPayload();
        if (!response?.fileContent || !response?.fileName) {
          helpers.showToast?.('没有已保存的 UPI 密码 2FA 备份。', 'warn', 2600);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(response.fileContent, response.fileName, 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出已保存密码 2FA。', 'info', 1800);
          return;
        }
        helpers.showToast?.(`已导出 ${response.count || 0} 条已保存密码 2FA 备份。`, 'success', 2200);
      } catch (error) {
        helpers.showToast?.(`导出已保存密码 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function showUpiCredentialBackupText() {
      try {
        setExportButtonsBusy(true);
        const response = await fetchUpiCredentialBackupExportPayload();
        setUpiCredentialBackupPreviewVisible(true);
        setUpiCredentialBackupPreviewText(response?.fileContent || '');
        setUpiCredentialMembershipPoolRows(parseUpiCredentialMembershipText(response?.fileContent || ''), 'local');
        setUpiCredentialMembershipPoolLoaded(true);
        if (!response?.fileContent) {
          helpers.showToast?.('没有已保存的 UPI 密码 2FA 备份。', 'warn', 2600);
          return;
        }
        helpers.showToast?.(`已显示 ${response.count || 0} 条已保存密码 2FA。`, 'success', 1800);
      } catch (error) {
        helpers.showToast?.(`读取已保存密码 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function startUpiCredentialMembershipCheck(payload = {}) {
      try {
        setUpiCredentialMembershipCheckBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage({
          type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_BATCH',
          source: 'sidepanel',
          payload: {
            ...payload,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        const results = response?.results || getUpiCredentialMembershipCheckResults();
        helpers.showToast?.(`核验完成：有会员 ${results.paidCount || 0}，无会员 ${results.freeCount || 0}，失败 ${results.failedCount || 0}。`, 'success', 2600);
      } catch (error) {
        helpers.showToast?.(`UPI 备份账号会员核验失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function startLocalUpiCredentialMembershipCheck() {
      await refreshUpiCredentialMembershipCredentialPool({ silent: true });
      const credentials = getEnabledUpiCredentialMembershipPoolRows();
      if (!credentials.length) {
        helpers.showToast?.('没有启用的 UPI 备份账号可核验。', 'warn', 2000);
        return;
      }
      await startUpiCredentialMembershipCheck({ source: 'local-selected', credentials });
    }

    async function readTextFile(file) {
      if (!file) return '';
      if (typeof file.text === 'function') {
        return await file.text();
      }
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('读取 TXT 文件失败。'));
        reader.readAsText(file, 'utf-8');
      });
    }

    function mergeUpiCredentialMembershipFreeImportPoolRows(credentials = []) {
      const currentResults = getUpiCredentialMembershipCheckResults();
      const protectedEmails = new Set(
        buildUpiCredentialMembershipDisplayRows(currentResults)
          .filter((row) => {
            const status = String(row.status || '').trim().toLowerCase();
            return status === 'paid' || isActiveUpiCredentialMembershipRedeemRowOrUsage(row, currentResults);
          })
          .map((row) => normalizeUpiCredentialMembershipEmail(row.email))
          .filter(Boolean)
      );
      const byEmail = {};
      getUpiCredentialMembershipPoolRows().forEach((row) => {
        const email = normalizeUpiCredentialMembershipEmail(row?.email);
        if (email) {
          byEmail[email] = row;
        }
      });
      (Array.isArray(credentials) ? credentials : []).forEach((credential) => {
        const email = normalizeUpiCredentialMembershipEmail(credential?.email);
        if (!email || protectedEmails.has(email)) {
          return;
        }
        byEmail[email] = {
          ...(byEmail[email] || {}),
          ...credential,
          email,
          source: 'txt-free',
        };
      });
      return Object.values(byEmail);
    }

    async function importUpiCredentialMembershipFreeText(text = '') {
      const credentials = parseUpiCredentialMembershipText(text);
      const importedEmailSet = new Set(
        credentials
          .map((credential) => normalizeUpiCredentialMembershipEmail(credential?.email))
          .filter(Boolean)
      );
      importedEmailSet.forEach((email) => {
        deleteLocallyDeletedUpiCredentialMembershipEmail(email);
      });
      setUpiCredentialMembershipPoolRows(mergeUpiCredentialMembershipFreeImportPoolRows(credentials), 'txt-free');
      setUpiCredentialMembershipPoolLoaded(true);
      const response = await runtime.sendMessage({
        type: 'IMPORT_UPI_CREDENTIAL_MEMBERSHIP_FREE_RESULTS',
        source: 'sidepanel',
        payload: {
          source: 'txt-free',
          text,
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      const results = response?.results || {
        items: credentials.map((credential) => ({
          ...credential,
          status: 'free',
          planType: 'free',
          reason: '待兑换',
        })),
        source: 'txt-free',
      };
      const restoredEmails = Array.isArray(response?.restoredEmails || response?.results?.restoredEmails)
        ? (response?.restoredEmails || response?.results?.restoredEmails)
        : [];
      restoredEmails
        .map(normalizeUpiCredentialMembershipEmail)
        .filter(Boolean)
        .forEach((email) => deleteLocallyDeletedUpiCredentialMembershipEmail(email));
      state.syncLatestState({ upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(results) });
      renderUpiCredentialMembershipCheckResults();
      const importedCountValue = response?.importedCount ?? response?.results?.importedCount;
      const restoredCountValue = response?.restoredCount ?? response?.results?.restoredCount;
      return {
        results,
        importedCount: importedCountValue === undefined
          ? credentials.length
          : Math.max(0, Math.floor(Number(importedCountValue) || 0)),
        restoredCount: restoredCountValue === undefined
          ? 0
          : Math.max(0, Math.floor(Number(restoredCountValue) || 0)),
        skippedCount: Math.floor(Number(response?.skippedCount ?? response?.results?.skippedCount) || 0),
      };
    }

    function openUpiCredentialMembershipTxtImport(mode = 'check') {
      if (dom.inputUpiCredentialMembershipTxt?.dataset) {
        dom.inputUpiCredentialMembershipTxt.dataset.membershipImportMode = mode === 'free' ? 'free' : 'check';
      }
      dom.inputUpiCredentialMembershipTxt?.click?.();
    }

    async function handleUpiCredentialMembershipTxtSelected(event) {
      const file = event?.target?.files?.[0] || null;
      const importMode = String(event?.target?.dataset?.membershipImportMode || 'check').trim().toLowerCase();
      if (event?.target) {
        event.target.value = '';
        event.target.dataset.membershipImportMode = 'check';
      }
      if (!file) return;
      try {
        const text = await readTextFile(file);
        if (!text.trim()) {
          helpers.showToast?.('导入的 TXT 为空。', 'warn', 1800);
          return;
        }
        if (importMode === 'free') {
          const importResult = await importUpiCredentialMembershipFreeText(text);
          const details = [
            importResult.restoredCount ? `恢复 ${importResult.restoredCount} 条已删除账号` : '',
            importResult.skippedCount ? `跳过 ${importResult.skippedCount} 条 Plus/处理中账号` : '',
          ].filter(Boolean).join('，');
          helpers.showToast?.(
            `已导入 Free ${importResult.importedCount || 0} 条账号${details ? `，${details}` : ''}，可补充 AT 或直接兑换。`,
            'success',
            2600
          );
          return;
        }
        const credentials = parseUpiCredentialMembershipText(text);
        setUpiCredentialMembershipPoolRows(credentials, 'txt');
        setUpiCredentialMembershipPoolLoaded(true);
        renderUpiCredentialMembershipCheckResults();
        await startUpiCredentialMembershipCheck({ source: 'txt', text });
      } catch (error) {
        helpers.showToast?.(`读取备份 TXT 失败：${error.message}`, 'error');
      }
    }

    async function stopUpiCredentialMembershipCheck() {
      try {
        const response = await runtime.sendMessage({
          type: 'STOP_UPI_CREDENTIAL_MEMBERSHIP_CHECK',
          source: 'sidepanel',
          payload: {},
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        setUpiCredentialMembershipCheckBusy(false);
        helpers.showToast?.('已停止 UPI 备份账号会员核验。', 'warn', 1800);
      } catch (error) {
        helpers.showToast?.(`停止核验失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function resumeFreeRedeemAfterCdkImport(options = {}) {
      const currentState = state.getLatestState();
      const results = getUpiCredentialMembershipCheckResults();
      if (
        getUpiCredentialMembershipCheckBusy()
        || getUpiCredentialMembershipRedeemBusy()
        || getUpiCredentialMembershipAllRedeemBusy()
        || results.running === true
        || results.redeeming === true
        || isAutoRunRecordDisplayRunning(currentState)
      ) {
        return { started: false, reason: 'busy' };
      }
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      if (getAvailableUpiRedeemCdkeyCount(currentState, redeemChannel) <= 0) {
        return { started: false, reason: 'no-cdk' };
      }
      const credentials = getEnabledFreeUpiCredentialMembershipRowsForChannel(redeemChannel);
      if (!credentials.length) {
        return { started: false, reason: 'no-free-credentials' };
      }
      await startUpiCredentialMembershipFreeRedeem(credentials, {
        source: options.source || 'cdk-import-resume',
        channel: redeemChannel,
      });
      return { started: true, count: credentials.length };
    }

    async function stopUpiCredentialMembershipRedeem() {
      try {
        const response = await runtime.sendMessage({
          type: 'STOP_UPI_CREDENTIAL_MEMBERSHIP_REDEEM',
          source: 'sidepanel',
          payload: {},
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        setUpiCredentialMembershipRedeemBusy(false);
        helpers.showToast?.('已停止 UPI Free 账号兑换。', 'warn', 1800);
      } catch (error) {
        helpers.showToast?.(`停止兑换失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    return {
      refreshUpiCredentialMembershipCredentialPool,
      reloadUpiCredentialMembershipAfterRuntimeImport,
      exportUpiCredentialBackupTextFile,
      showUpiCredentialBackupText,
      startUpiCredentialMembershipCheck,
      startLocalUpiCredentialMembershipCheck,
      importUpiCredentialMembershipFreeText,
      openUpiCredentialMembershipTxtImport,
      handleUpiCredentialMembershipTxtSelected,
      stopUpiCredentialMembershipCheck,
      resumeFreeRedeemAfterCdkImport,
      stopUpiCredentialMembershipRedeem,
    };
  }

  const api = {
    createAccountRecordsMembershipPoolOps,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsMembershipPoolOps = api;
})(typeof window !== 'undefined' ? window : globalThis);
