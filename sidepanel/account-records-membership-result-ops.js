// sidepanel/account-records-membership-result-ops.js - Membership result export, delete, and single-check operations.
(function attachSidepanelAccountRecordsMembershipResultOps(globalScope) {
  function createAccountRecordsMembershipResultOps(context = {}) {
    const {
      state = {},
      helpers = {},
      runtime = {},
      getAccountRunRecords = () => [],
      getUpiRedeemCdkeyUsage = () => ({}),
      buildUpiRedeemSuccessEmailExportRows = () => [],
      summarizeUpiRedeemSuccessExportEligibility = () => ({}),
      buildUpiRedeemSuccessExportBlockedMessage = () => '',
      buildUpiRedeemSuccessEmailExportFileName = () => 'upi-redeem-success-password-2fa.txt',
      setExportButtonsBusy = () => {},
      render = () => {},
      getUpiCredentialMembershipCheckResults = () => ({ items: [] }),
      refreshUpiCredentialMembershipCheckResults = async () => null,
      mergeManualFreeMembershipOverridesIntoResults = (results) => results,
      buildUpiCredentialMembershipDisplayRows = () => [],
      isUpiCredentialMembershipRowInResultGroup = () => false,
      getMembershipStatusTitle = () => '结果',
      normalizeUpiCredentialMembershipEmail = (value = '') => String(value || '').trim().toLowerCase(),
      normalizeUpiCredentialMembershipText = (value = '') => String(value || '').trim(),
      normalizeRedeemChannel = (value = '') => (String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi'),
      isActiveUpiCredentialMembershipRedeemRowOrUsage = () => false,
      getUpiCredentialMembershipDisplayRowByEmail = () => null,
      addLocallyDeletedRedeemPlusEmails = () => {},
      addLocallyDeletedUpiCredentialMembershipEmail = () => {},
      removeDisabledUpiCredentialMembershipEmail = () => {},
      getUpiCredentialMembershipPoolRows = () => [],
      setUpiCredentialMembershipPoolRows = () => {},
      getUpiCredentialMembershipPoolSource = () => '',
      getMembershipCheckSettingsPayload = () => ({}),
      getMembershipPlanLabel = () => 'Plus',
      getUpiCredentialMembershipCheckingEmail = () => '',
      setUpiCredentialMembershipCheckingEmail = () => {},
      mergeUpiCredentialMembershipResultItem = () => {},
    } = context;

    async function refreshRemoteRedeemStatusesForExport(records = []) {
      const cdkeys = context.getUpiRedeemSuccessExportCdkeys
        ? context.getUpiRedeemSuccessExportCdkeys(records)
        : [];
      if (!cdkeys.length) {
        return null;
      }
      const response = await runtime.sendMessage({
        type: 'REFRESH_UPI_REDEEM_CDKEY_STATUSES',
        source: 'sidepanel',
        payload: { cdkeys, skipAutoRetry: true },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.updates) {
        state.syncLatestState(response.updates);
      }
      return response;
    }

    async function exportUpiRedeemSuccessEmailTextFile() {
      const candidateRecords = getAccountRunRecords();
      const candidateRows = buildUpiRedeemSuccessEmailExportRows(candidateRecords);
      if (!candidateRows.length) {
        const summary = summarizeUpiRedeemSuccessExportEligibility(candidateRecords, {
          usage: getUpiRedeemCdkeyUsage(),
        });
        helpers.showToast?.(buildUpiRedeemSuccessExportBlockedMessage(summary), 'warn', 2600);
        return;
      }
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        setExportButtonsBusy(true);
        await refreshRemoteRedeemStatusesForExport(candidateRecords);
        const latestRecords = getAccountRunRecords();
        const latestUsage = getUpiRedeemCdkeyUsage();
        const rows = buildUpiRedeemSuccessEmailExportRows(latestRecords, {
          usage: latestUsage,
          requireRemoteSuccess: true,
        });
        if (!rows.length) {
          const summary = summarizeUpiRedeemSuccessExportEligibility(latestRecords, {
            usage: latestUsage,
          });
          helpers.showToast?.(buildUpiRedeemSuccessExportBlockedMessage(summary), 'warn', 3200);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(`${rows.join('\n')}\n`, buildUpiRedeemSuccessEmailExportFileName(), 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出兑换成功邮箱 2FA。', 'info', 1800);
          return;
        }
        helpers.showToast?.(`已按远端 CDK 状态导出 ${rows.length} 条兑换成功邮箱 2FA。`, 'success', 2200);
      } catch (error) {
        helpers.showToast?.(`导出兑换成功邮箱 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function exportUpiCredentialMembershipCheckResultTextFile(status = 'paid') {
      const rawStatus = String(status || '').trim().toLowerCase() || 'paid';
      const payloadStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' || rawStatus === 'paid-all'
        ? rawStatus
        : status;
      const normalizedStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' || rawStatus === 'paid-all'
        ? 'paid'
        : rawStatus;
      const targetChannel = rawStatus === 'paid-upi'
        ? 'upi'
        : rawStatus === 'paid-ideal'
          ? 'ideal'
          : '';
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        const visibleResults = getUpiCredentialMembershipCheckResults();
        const visibleRows = buildUpiCredentialMembershipDisplayRows(visibleResults)
          .filter((item) => isUpiCredentialMembershipRowInResultGroup(item, normalizedStatus, targetChannel));
        const exportEmails = visibleRows
          .map((item) => normalizeUpiCredentialMembershipEmail(item?.email))
          .filter(Boolean);
        if (!exportEmails.length) {
          helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可导出的记录。`, 'warn', 1800);
          return;
        }
        const response = await runtime.sendMessage({
          type: 'EXPORT_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: { status: payloadStatus, emails: exportEmails, removeAfterExport: false },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (!response?.fileContent || !response?.fileName) {
          helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可导出的记录。`, 'warn', 1800);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(response.fileContent, response.fileName, 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.(`已取消导出${getMembershipStatusTitle(rawStatus)}记录。`, 'info', 1800);
          return;
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        helpers.showToast?.(
          `已导出 ${response.count || 0} 条${getMembershipStatusTitle(rawStatus)}记录。`,
          'success',
          2200
        );
        render();
      } catch (error) {
        helpers.showToast?.(`导出核验结果失败：${error.message}`, 'error');
      }
    }

    async function deleteUpiCredentialMembershipResultGroup(status = 'paid') {
      const rawStatus = String(status || '').trim().toLowerCase() || 'paid';
      const normalizedStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' ? 'paid' : rawStatus;
      const targetChannel = rawStatus === 'paid-upi'
        ? 'upi'
        : rawStatus === 'paid-ideal'
          ? 'ideal'
          : '';
      const results = getUpiCredentialMembershipCheckResults();
      const targetItems = buildUpiCredentialMembershipDisplayRows(results)
        .filter((item) => isUpiCredentialMembershipRowInResultGroup(item, normalizedStatus, targetChannel));
      const blockedItems = targetItems.filter((item) => isActiveUpiCredentialMembershipRedeemRowOrUsage(item, results));
      const safeItems = targetItems.filter((item) => !isActiveUpiCredentialMembershipRedeemRowOrUsage(item, results));
      const safeEmails = safeItems
        .map((item) => normalizeUpiCredentialMembershipEmail(item?.email))
        .filter(Boolean);
      const count = targetItems.length;
      if (!count) {
        helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可删除的记录。`, 'warn', 1800);
        return;
      }
      if (!safeEmails.length) {
        helpers.showToast?.('正在兑换或等待远端结果的账号不能删除，请先取消对应 CDK 任务。', 'warn', 2600);
        return;
      }

      const confirmed = typeof helpers.openConfirmModal === 'function'
        ? await helpers.openConfirmModal({
          title: `删除${getMembershipStatusTitle(rawStatus)}分组`,
          message: `确认从当前核验结果中删除 ${safeEmails.length} 条${getMembershipStatusTitle(rawStatus)}记录吗？该操作只清理当前结果列表，不删除本地密码/2FA 备份。${blockedItems.length ? ` 将跳过 ${blockedItems.length} 条正在兑换或等待远端结果的账号。` : ''}`,
          confirmLabel: '确认删除',
          confirmVariant: 'btn-danger',
        })
        : true;
      if (!confirmed) {
        return;
      }

      try {
        const response = await runtime.sendMessage({
          type: 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: { status: normalizedStatus, channel: targetChannel, emails: safeEmails },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        const stateUpdates = {};
        if (response?.results) {
          stateUpdates.upiCredentialMembershipCheckResults = mergeManualFreeMembershipOverridesIntoResults(response.results);
        }
        if (response?.updates && typeof response.updates === 'object') {
          Object.assign(stateUpdates, response.updates);
        }
        if (Object.keys(stateUpdates).length) {
          state.syncLatestState(stateUpdates);
        }
        const responseDeletedEmails = Array.isArray(response?.deletedEmails)
          ? response.deletedEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
          : safeEmails;
        if (responseDeletedEmails.length && normalizedStatus === 'free') {
          const deletedSet = new Set(responseDeletedEmails);
          responseDeletedEmails.forEach((email) => addLocallyDeletedUpiCredentialMembershipEmail(email));
          setUpiCredentialMembershipPoolRows(
            getUpiCredentialMembershipPoolRows().filter((item) => !deletedSet.has(normalizeUpiCredentialMembershipEmail(item.email))),
            getUpiCredentialMembershipPoolSource()
          );
          responseDeletedEmails.forEach((email) => removeDisabledUpiCredentialMembershipEmail(email));
        } else if (responseDeletedEmails.length && normalizedStatus === 'paid' && targetChannel) {
          addLocallyDeletedRedeemPlusEmails(targetChannel, responseDeletedEmails);
          responseDeletedEmails.forEach((email) => removeDisabledUpiCredentialMembershipEmail(email));
        }
        const skippedCount = Math.max(blockedItems.length, Math.floor(Number(response?.skippedCount) || 0));
        helpers.showToast?.(
          `已删除 ${response?.deletedCount || 0} 条${getMembershipStatusTitle(rawStatus)}分组记录${skippedCount ? `，跳过 ${skippedCount} 条处理中账号` : ''}。`,
          'success',
          2200
        );
      } catch (error) {
        helpers.showToast?.(`删除${getMembershipStatusTitle(rawStatus)}分组失败：${error.message}`, 'error');
      } finally {
        render();
      }
    }

    async function deleteUpiCredentialMembershipCredential(email = '', channel = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail) {
        return;
      }
      const currentResults = getUpiCredentialMembershipCheckResults();
      const requestedChannel = normalizeUpiCredentialMembershipText(channel);
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail, requestedChannel);
      if (row && isActiveUpiCredentialMembershipRedeemRowOrUsage(row, currentResults)) {
        helpers.showToast?.('正在兑换或等待远端结果的账号不能删除，请先取消对应 CDK 任务。', 'warn', 2600);
        return;
      }
      const rowStatus = String(row?.status || '').trim().toLowerCase();
      const deleteStatus = rowStatus === 'paid' ? 'paid' : 'free';
      const deleteChannel = rowStatus === 'paid'
        ? normalizeRedeemChannel(requestedChannel || row?.redeemChannel || row?.channel)
        : '';
      try {
        const response = await runtime.sendMessage({
          type: 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: {
            status: deleteStatus,
            channel: deleteChannel,
            emails: [normalizedEmail],
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        const skippedCount = Math.floor(Number(response?.skippedCount) || 0);
        const deletedEmails = Array.isArray(response?.deletedEmails)
          ? response.deletedEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
          : (Number(response?.deletedCount) > 0 ? [normalizedEmail] : []);
        if (deletedEmails.length) {
          const deletedSet = new Set(deletedEmails);
          if (deleteStatus === 'free') {
            deletedEmails.forEach((itemEmail) => addLocallyDeletedUpiCredentialMembershipEmail(itemEmail));
          } else if (deleteStatus === 'paid' && deleteChannel) {
            addLocallyDeletedRedeemPlusEmails(deleteChannel, deletedEmails);
          }
          deletedEmails.forEach((itemEmail) => removeDisabledUpiCredentialMembershipEmail(itemEmail));
          if (deleteStatus === 'free') {
            setUpiCredentialMembershipPoolRows(
              getUpiCredentialMembershipPoolRows().filter((item) => !deletedSet.has(normalizeUpiCredentialMembershipEmail(item.email))),
              getUpiCredentialMembershipPoolSource()
            );
          }
        }
        const stateUpdates = {};
        if (response?.results) {
          stateUpdates.upiCredentialMembershipCheckResults = mergeManualFreeMembershipOverridesIntoResults(response.results);
        }
        if (response?.updates && typeof response.updates === 'object') {
          Object.assign(stateUpdates, response.updates);
        }
        if (Object.keys(stateUpdates).length) {
          state.syncLatestState(stateUpdates);
        }
        if (skippedCount || !deletedEmails.length) {
          helpers.showToast?.(`${normalizedEmail} 正在兑换或等待远端结果，已跳过删除。`, 'warn', 2200);
        } else {
          helpers.showToast?.(
            `已从当前 ${getMembershipStatusTitle(deleteStatus === 'paid' && deleteChannel ? `paid-${deleteChannel}` : deleteStatus)} 分组删除 ${normalizedEmail}`,
            'success',
            1800
          );
        }
      } catch (error) {
        helpers.showToast?.(`删除 UPI 核验账号失败：${error.message}`, 'error');
      } finally {
        render();
      }
    }

    async function checkOneUpiCredentialMembership(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail || getUpiCredentialMembershipCheckingEmail()) {
        return;
      }
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      if (!row.password || !row.totpMfaSecret) {
        helpers.showToast?.(`账号 ${normalizedEmail} 缺少密码或 2FA，无法检测。`, 'error');
        return;
      }
      setUpiCredentialMembershipCheckingEmail(normalizedEmail);
      render();
      let completedSingleCheckItem = null;
      try {
        const response = await runtime.sendMessage({
          type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_ONE',
          source: 'sidepanel',
          payload: {
            email: normalizedEmail,
            source: 'single',
            settings: getMembershipCheckSettingsPayload(),
            credential: {
              email: normalizedEmail,
              password: row.password,
              totpMfaSecret: row.totpMfaSecret,
            },
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
        const item = response?.item || {};
        completedSingleCheckItem = item?.email ? item : null;
        mergeUpiCredentialMembershipResultItem(item);
        const itemStatus = String(item.status || '').trim().toLowerCase();
        if (itemStatus === 'paid') {
          helpers.showToast?.(`${normalizedEmail} 已开通 ${getMembershipPlanLabel(item.planType)}。`, 'success', 2200);
        } else if (itemStatus === 'free') {
          helpers.showToast?.(`${normalizedEmail} 当前无会员。`, 'warn', 2200);
        } else {
          helpers.showToast?.(`${normalizedEmail} 检测失败：${item.reason || '未知错误'}`, 'error');
        }
      } catch (error) {
        helpers.showToast?.(`检测 ${normalizedEmail} 失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipCheckingEmail('');
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        if (completedSingleCheckItem) {
          mergeUpiCredentialMembershipResultItem(completedSingleCheckItem);
        }
        render();
      }
    }

    return {
      exportUpiRedeemSuccessEmailTextFile,
      exportUpiCredentialMembershipCheckResultTextFile,
      deleteUpiCredentialMembershipResultGroup,
      deleteUpiCredentialMembershipCredential,
      checkOneUpiCredentialMembership,
    };
  }

  const api = {
    createAccountRecordsMembershipResultOps,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsMembershipResultOps = api;
})(typeof window !== 'undefined' ? window : globalThis);
