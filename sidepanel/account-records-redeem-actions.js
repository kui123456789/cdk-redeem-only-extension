// sidepanel/account-records-redeem-actions.js - Redeem runtime actions for account records.
(function attachSidepanelAccountRecordsRedeemActions(globalScope) {
  function createAccountRecordsRedeemActions(context = {}) {
    const {
      state = {},
      helpers = {},
      runtime = {},
      normalizeRedeemChannel = (value = '') => (String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi'),
      getRedeemChannelLabel = (channel = 'upi') => (normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI'),
      normalizeUpiCredentialMembershipEmail = (value = '') => String(value || '').trim().toLowerCase(),
      getUpiCredentialMembershipCheckResults = () => ({}),
      refreshUpiCredentialMembershipCheckResults = async () => null,
      getEnabledFreeUpiCredentialMembershipRowsForChannel = () => [],
      buildNoRedeemableForChannelMessage = () => '',
      getAvailableUpiRedeemCdkeyCount = () => 0,
      getIdealFallbackUpiCredentialMembershipRows = () => [],
      getUpiCredentialMembershipPoolRows = () => [],
      setUpiCredentialMembershipPoolRows = () => {},
      getUpiCredentialMembershipPoolSource = () => '',
      deleteDisabledUpiCredentialMembershipEmail = () => {},
      getUpiCredentialMembershipSingleRedeemRow = () => null,
      isRedeemableFreeUpiCredentialMembershipRow = () => false,
      getNotRedeemableFreeUpiCredentialMembershipReason = () => '',
      isRedeemableFreeUpiCredentialMembershipRowForChannel = () => false,
      buildUpiCredentialMembershipRedeemCredential = (row = {}) => ({ ...row }),
      getUpiCredentialMembershipDisplayRowByEmail = () => null,
      getUpiCredentialMembershipRedeemCdkey = () => '',
      getStoredCdkPoolText = () => '',
      buildUpiCredentialMembershipRedeemStatusRefreshTargets = () => ({ upi: [], ideal: [], emailMap: { upi: {}, ideal: {} }, emailCount: 0, cdkCount: 0, total: 0 }),
      getUpiCredentialMembershipCheckBusy = () => false,
      setUpiCredentialMembershipRedeemBusy = () => {},
      getUpiCredentialMembershipRedeemBusy = () => false,
      setUpiCredentialMembershipAllRedeemBusy = () => {},
      getUpiCredentialMembershipAllRedeemBusy = () => false,
      setUpiCredentialMembershipRedeemStatusRefreshBusy = () => {},
      getUpiCredentialMembershipRedeemStatusRefreshBusy = () => false,
      setExportButtonsBusy = () => {},
      isAutoRunRecordDisplayRunning = () => false,
      render = () => {},
    } = context;

    async function waitForUpiCredentialMembershipRedeemIdle(timeoutMs = 5000) {
      const deadline = Date.now() + Math.max(1000, Math.floor(Number(timeoutMs) || 5000));
      while (Date.now() < deadline) {
        const latestResults = await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        const results = latestResults || getUpiCredentialMembershipCheckResults();
        if (results.redeeming !== true && !getUpiCredentialMembershipRedeemBusy()) {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      return false;
    }

    async function refreshUpiCredentialMembershipRedeemStateAfterChannel(channel = 'upi') {
      await refreshUpiCredentialMembershipCheckResults().catch(() => null);
      if (typeof helpers.refreshUpiRedeemCdkeyStatuses === 'function') {
        await helpers.refreshUpiRedeemCdkeyStatuses({
          channel,
          silent: true,
          skipAutoRetry: true,
        }).catch(() => null);
      }
      await refreshUpiCredentialMembershipCheckResults().catch(() => null);
    }

    function buildUpiCredentialMembershipRedeemAllSummary(results = getUpiCredentialMembershipCheckResults()) {
      return `Plus ${results.paidCount || 0}，Free ${results.freeCount || 0}，失败 ${results.failedCount || 0}`;
    }

    function getUpiRedeemCdkeyJobOperationResultItem(response = {}, cdkey = '') {
      const normalizedCdkey = String(cdkey || '').trim().toLowerCase();
      return (Array.isArray(response?.items) ? response.items : [])
        .find((item) => String(item?.cdkey || item?.cdk || '').trim().toLowerCase() === normalizedCdkey)
        || null;
    }

    async function refreshUpiCredentialMembershipRedeemStatuses() {
      if (getUpiCredentialMembershipRedeemStatusRefreshBusy()) {
        helpers.showToast?.('兑换状态正在刷新，请稍候。', 'info', 1800);
        return;
      }
      const results = getUpiCredentialMembershipCheckResults();
      const targets = buildUpiCredentialMembershipRedeemStatusRefreshTargets(results);
      if (!targets.emailCount) {
        helpers.showToast?.('当前没有可刷新的邮箱状态。', 'warn', 2200);
        return;
      }
      if (!targets.cdkCount) {
        helpers.showToast?.('当前可刷新账号没有可查询的 CDK，可能尚未发起兑换或绑定已被清理。', 'warn', 3200);
        return;
      }

      const refreshedParts = [];
      const errorParts = [];
      try {
        setUpiCredentialMembershipRedeemStatusRefreshBusy(true);
        render();
        for (const channel of ['upi', 'ideal']) {
          const cdkeys = Array.isArray(targets[channel]) ? targets[channel] : [];
          if (!cdkeys.length) {
            continue;
          }
          const latest = typeof state.getLatestState === 'function' ? (state.getLatestState() || {}) : {};
          const response = await runtime.sendMessage?.({
            type: 'REFRESH_UPI_REDEEM_CDKEY_STATUSES',
            source: 'sidepanel',
            payload: {
              cdkeys,
              cdkeyEmailMap: targets.emailMap?.[channel] || {},
              channel,
              autoRefresh: true,
              skipAutoRetry: true,
              cdkPoolText: getStoredCdkPoolText(latest, 'upi'),
              upiRedeemCdkPoolText: getStoredCdkPoolText(latest, 'upi'),
              upiRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'upi'),
              idealRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'ideal'),
            },
          });
          if (response?.error) {
            errorParts.push(`${getRedeemChannelLabel(channel)}：${response.error}`);
            continue;
          }
          if (response?.updates && typeof state.syncLatestState === 'function') {
            state.syncLatestState(response.updates);
          }
          refreshedParts.push(`${getRedeemChannelLabel(channel)} CDK ${response?.checkedCount || cdkeys.length} 条`);
        }
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        if (errorParts.length) {
          helpers.showToast?.(`刷新完成但有错误：${errorParts.join('；')}`, refreshedParts.length ? 'warn' : 'error', 5000);
        } else {
          helpers.showToast?.(`已刷新邮箱状态：账号 ${targets.emailCount} 个；查询 ${refreshedParts.join('，')}。`, 'success', 3000);
        }
      } catch (error) {
        helpers.showToast?.(`刷新兑换状态失败：${error.message}`, 'error');
      } finally {
        setUpiCredentialMembershipRedeemStatusRefreshBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        render();
      }
    }

    async function startUpiCredentialMembershipFreeRedeem(inputCredentials = null, options = {}) {
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
      const suppressToast = options.suppressToast === true;
      const outcome = {
        ok: false,
        channel: redeemChannel,
        executed: false,
        skipped: false,
        stopped: false,
        reason: '',
        error: null,
        results: null,
      };
      if (getUpiCredentialMembershipAllRedeemBusy() && options.fromAll !== true) {
        outcome.skipped = true;
        outcome.reason = '全部兑换正在运行';
        if (!suppressToast) {
          helpers.showToast?.('全部兑换正在运行，请等待完成或先停止兑换。', 'warn', 2200);
        }
        return outcome;
      }
      const credentials = Array.isArray(inputCredentials)
        ? inputCredentials
        : getEnabledFreeUpiCredentialMembershipRowsForChannel(redeemChannel);
      const singleEmail = normalizeUpiCredentialMembershipEmail(options.singleEmail || '');
      if (!credentials.length) {
        const noRedeemableReason = buildNoRedeemableForChannelMessage(redeemChannel);
        outcome.skipped = true;
        outcome.reason = singleEmail ? `${singleEmail} 当前不可兑换` : (noRedeemableReason || '没有启用的 Free 账号可兑换');
        if (!suppressToast) {
          helpers.showToast?.(singleEmail ? `${singleEmail} 当前不可兑换。` : `${outcome.reason}。`, 'warn', 3000);
        }
        return outcome;
      }
      try {
        outcome.executed = true;
        setUpiCredentialMembershipRedeemBusy(true);
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage?.({
          type: 'REDEEM_UPI_CREDENTIAL_MEMBERSHIP_FREE',
          source: 'sidepanel',
          payload: {
            source: options.source || (singleEmail ? 'free-single' : 'free-selected'),
            channel: redeemChannel,
            manualTrigger: true,
            credentials,
            deleteBackups: getUpiCredentialMembershipPoolSource() !== 'txt' && getUpiCredentialMembershipPoolSource() !== 'txt-free',
            settings: typeof context.getMembershipCheckSettingsPayload === 'function' ? context.getMembershipCheckSettingsPayload() : {},
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results && typeof state.syncLatestState === 'function') {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: context.mergeManualFreeMembershipOverridesIntoResults
              ? context.mergeManualFreeMembershipOverridesIntoResults(response.results)
              : response.results,
          });
        }
        let results = response?.results || getUpiCredentialMembershipCheckResults();
        let idealFallbackText = '';
        const autoDeletedEmails = (Array.isArray(results.redeemAutoDeletedEmails) ? results.redeemAutoDeletedEmails : [])
          .map(normalizeUpiCredentialMembershipEmail)
          .filter(Boolean);
        if (autoDeletedEmails.length) {
          const deletedSet = new Set(autoDeletedEmails);
          setUpiCredentialMembershipPoolRows(
            getUpiCredentialMembershipPoolRows().filter((item) => !deletedSet.has(normalizeUpiCredentialMembershipEmail(item?.email))),
            getUpiCredentialMembershipPoolSource()
          );
          autoDeletedEmails.forEach((email) => deleteDisabledUpiCredentialMembershipEmail(email));
        }
        if (
          redeemChannel === 'upi'
          && options.fromAll !== true
          && options.allowIdealFallback !== false
          && !results.redeemStoppedAt
        ) {
          await refreshUpiCredentialMembershipCheckResults().catch(() => null);
          const fallbackCredentials = getIdealFallbackUpiCredentialMembershipRows();
          const idealCdkeyCount = getAvailableUpiRedeemCdkeyCount(
            typeof state.getLatestState === 'function' ? state.getLatestState() : {},
            'ideal'
          );
          if (fallbackCredentials.length && idealCdkeyCount > 0) {
            const idealOutcome = await startUpiCredentialMembershipFreeRedeem(fallbackCredentials, {
              source: 'free-upi-to-ideal',
              channel: 'ideal',
              suppressToast: true,
              allowIdealFallback: false,
            });
            results = idealOutcome.results || getUpiCredentialMembershipCheckResults();
            idealFallbackText = idealOutcome.error
              ? `；IDEAL 自动接力失败：${idealOutcome.reason || idealOutcome.error.message}`
              : idealOutcome.stopped
                ? `；IDEAL 自动接力已停止：${idealOutcome.reason || ''}`
                : `；UPI 满 3 次失败账号已自动接力 IDEAL ${Math.min(fallbackCredentials.length, idealCdkeyCount)} 个`;
          } else if (fallbackCredentials.length) {
            idealFallbackText = '；UPI 满 3 次失败账号等待 IDEAL 卡密';
          }
        }
        const summaryText = `Plus ${results.paidCount || 0}，Free ${results.freeCount || 0}，失败 ${results.failedCount || 0}`;
        outcome.results = results;
        if (results.redeemStoppedAt) {
          const stoppedEmail = normalizeUpiCredentialMembershipEmail(results.flowStageEmail || singleEmail);
          const stoppedItem = (Array.isArray(results.items) ? results.items : [])
            .find((item) => normalizeUpiCredentialMembershipEmail(item?.email) === stoppedEmail) || null;
          const stoppedReason = String(stoppedItem?.redeemReason || stoppedItem?.reason || '').trim();
          outcome.stopped = true;
          outcome.reason = stoppedReason || summaryText;
          if (!suppressToast) {
            helpers.showToast?.(
              `${stoppedEmail || singleEmail || `${redeemChannelLabel} Free 兑换`} 已停止：${stoppedReason || summaryText}。`,
              'warn',
              5000
            );
          }
        } else {
          outcome.ok = true;
          outcome.reason = summaryText;
          if (!suppressToast) {
            helpers.showToast?.(singleEmail ? `${singleEmail} ${redeemChannelLabel} 兑换完成：${summaryText}${idealFallbackText}。` : `${redeemChannelLabel} 兑换完成：${summaryText}${idealFallbackText}。`, 'success', 3000);
          }
        }
      } catch (error) {
        outcome.error = error;
        outcome.reason = error.message || String(error || '');
        if (!suppressToast) {
          helpers.showToast?.(singleEmail ? `${singleEmail} ${redeemChannelLabel} 兑换失败：${error.message}` : `${redeemChannelLabel} Free 账号兑换失败：${error.message}`, 'error');
        }
      } finally {
        setUpiCredentialMembershipRedeemBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
      return outcome;
    }

    async function startUpiCredentialMembershipAllRedeem() {
      const results = getUpiCredentialMembershipCheckResults();
      if (
        getUpiCredentialMembershipAllRedeemBusy()
        || getUpiCredentialMembershipCheckBusy()
        || getUpiCredentialMembershipRedeemBusy()
        || results.running === true
        || results.redeeming === true
      ) {
        helpers.showToast?.('当前已有核验或兑换任务正在运行，请等待完成或先停止。', 'warn', 2200);
        return;
      }

      const initialUpiCredentials = getEnabledFreeUpiCredentialMembershipRowsForChannel('upi');
      const initialIdealCredentials = getEnabledFreeUpiCredentialMembershipRowsForChannel('ideal');
      if (!initialUpiCredentials.length && !initialIdealCredentials.length) {
        helpers.showToast?.('没有启用的 Free 账号可兑换。', 'warn', 2000);
        return;
      }

      const initialState = typeof state.getLatestState === 'function' ? (state.getLatestState() || {}) : {};
      const initialUpiCdkeyCount = getAvailableUpiRedeemCdkeyCount(initialState, 'upi');
      const initialIdealCdkeyCount = getAvailableUpiRedeemCdkeyCount(initialState, 'ideal');
      if (initialUpiCdkeyCount + initialIdealCdkeyCount <= 0) {
        helpers.showToast?.('UPI 和 IDEAL 都没有可用 CDK，请先导入或启用卡密。', 'warn', 2400);
        return;
      }

      const summaryParts = [];
      try {
        setUpiCredentialMembershipAllRedeemBusy(true);
        setExportButtonsBusy(false);
        render();

        if (initialUpiCdkeyCount > 0 && initialUpiCredentials.length) {
          const upiOutcome = await startUpiCredentialMembershipFreeRedeem(initialUpiCredentials, {
            source: 'free-all-upi',
            channel: 'upi',
            fromAll: true,
            suppressToast: true,
          });
          if (upiOutcome.stopped) {
            helpers.showToast?.(`全部兑换已停止：UPI 已停止，IDEAL 未执行。${upiOutcome.reason ? ` ${upiOutcome.reason}` : ''}`, 'warn', 5000);
            return;
          }
          if (upiOutcome.error) {
            helpers.showToast?.(`全部兑换已停止：UPI 兑换失败，IDEAL 未执行：${upiOutcome.reason || upiOutcome.error.message}`, 'error');
            return;
          }
          summaryParts.push('UPI 已执行');
          await refreshUpiCredentialMembershipRedeemStateAfterChannel('upi');
          const idle = await waitForUpiCredentialMembershipRedeemIdle(6000);
          if (!idle) {
            helpers.showToast?.('全部兑换已暂停：UPI 状态仍显示兑换中，IDEAL 未执行；请刷新状态后再继续。', 'warn', 5000);
            return;
          }
        } else {
          summaryParts.push(initialUpiCredentials.length
            ? 'UPI 已跳过（无可用 CDK）'
            : `UPI 已跳过（${buildNoRedeemableForChannelMessage('upi') || '无可兑换账号'}）`);
        }

        const remainingCredentials = getEnabledFreeUpiCredentialMembershipRowsForChannel('ideal');
        const latestIdealCdkeyCount = getAvailableUpiRedeemCdkeyCount(
          typeof state.getLatestState === 'function' ? (state.getLatestState() || {}) : {},
          'ideal'
        );
        if (!remainingCredentials.length) {
          summaryParts.push('IDEAL 已跳过（无剩余 Free）');
        } else if (latestIdealCdkeyCount <= 0) {
          summaryParts.push('IDEAL 已跳过（无可用 CDK）');
        } else {
          const idealOutcome = await startUpiCredentialMembershipFreeRedeem(remainingCredentials, {
            source: 'free-all-ideal',
            channel: 'ideal',
            fromAll: true,
            suppressToast: true,
          });
          if (idealOutcome.stopped) {
            helpers.showToast?.(`全部兑换已停止：${summaryParts.join('；')}；IDEAL 已停止。${idealOutcome.reason ? ` ${idealOutcome.reason}` : ''}`, 'warn', 5000);
            return;
          }
          if (idealOutcome.error) {
            helpers.showToast?.(`全部兑换已停止：${summaryParts.join('；')}；IDEAL 兑换失败：${idealOutcome.reason || idealOutcome.error.message}`, 'error');
            return;
          }
          summaryParts.push('IDEAL 已执行');
          await refreshUpiCredentialMembershipRedeemStateAfterChannel('ideal');
        }

        const finalResults = getUpiCredentialMembershipCheckResults();
        helpers.showToast?.(
          `全部兑换完成：${summaryParts.join('；')}；${buildUpiCredentialMembershipRedeemAllSummary(finalResults)}。`,
          'success',
          5000
        );
      } finally {
        setUpiCredentialMembershipAllRedeemBusy(false);
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function startSingleUpiCredentialMembershipFreeRedeem(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail || getUpiCredentialMembershipRedeemBusy() || getUpiCredentialMembershipAllRedeemBusy() || getUpiCredentialMembershipCheckBusy()) {
        return;
      }
      const row = getUpiCredentialMembershipSingleRedeemRow(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      if (!isRedeemableFreeUpiCredentialMembershipRow(row)) {
        const reason = getNotRedeemableFreeUpiCredentialMembershipReason(row);
        helpers.showToast?.(`${normalizedEmail} ${reason}。`, 'warn', 2200);
        return;
      }
      const redeemChannel = isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'upi') ? 'upi' : 'ideal';
      const credential = buildUpiCredentialMembershipRedeemCredential(row);
      if (!credential.password || !credential.totpMfaSecret) {
        helpers.showToast?.(`账号 ${normalizedEmail} 缺少密码或 2FA，无法兑换。`, 'error');
        return;
      }
      await startUpiCredentialMembershipFreeRedeem([credential], {
        singleEmail: normalizedEmail,
        source: 'free-click',
        channel: redeemChannel,
      });
    }

    async function cancelUpiCredentialMembershipRedeemJob(email = '', explicitCdkey = '', channel = 'upi') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      const redeemChannel = normalizeRedeemChannel(channel || row?.redeemChannel);
      const cdkey = String(explicitCdkey || getUpiCredentialMembershipRedeemCdkey(row || {})).trim();
      if (!normalizedEmail || !row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail || email}`, 'warn', 1800);
        return;
      }
      if (!cdkey) {
        helpers.showToast?.(`${normalizedEmail} 暂未绑定可取消的 CDK。`, 'warn', 2200);
        return;
      }

      try {
        const latest = typeof state.getLatestState === 'function' ? (state.getLatestState() || {}) : {};
        const response = await runtime.sendMessage?.({
          type: 'CANCEL_UPI_REDEEM_CDKEY_JOBS',
          source: 'sidepanel',
          payload: {
            cdkeys: [cdkey],
            cdkeyEmailMap: { [cdkey]: normalizedEmail },
            channel: redeemChannel,
            cdkPoolText: getStoredCdkPoolText(latest, 'upi'),
            upiRedeemCdkPoolText: getStoredCdkPoolText(latest, 'upi'),
            upiRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'upi'),
            idealRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'ideal'),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.updates && typeof state.syncLatestState === 'function') {
          state.syncLatestState(response.updates);
        }
        const resultItem = getUpiRedeemCdkeyJobOperationResultItem(response, cdkey);
        if (resultItem?.cancelled === true || resultItem?.canceled === true) {
          helpers.showToast?.(`${normalizedEmail} 的 CDK 任务已提交取消。`, 'success', 2200);
        } else {
          const reason = String(resultItem?.reason || '').trim();
          helpers.showToast?.(`取消兑换未完成：${reason || '后端未返回成功结果。'}`, 'warn', 2600);
        }
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
      } catch (error) {
        helpers.showToast?.(`取消兑换失败：${error.message}`, 'error');
      } finally {
        render();
      }
    }

    return {
      startUpiCredentialMembershipFreeRedeem,
      startUpiCredentialMembershipAllRedeem,
      startSingleUpiCredentialMembershipFreeRedeem,
      refreshUpiCredentialMembershipRedeemStatuses,
      cancelUpiCredentialMembershipRedeemJob,
    };
  }

  const api = {
    createAccountRecordsRedeemActions,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsRedeemActions = api;
})(typeof window !== 'undefined' ? window : globalThis);
