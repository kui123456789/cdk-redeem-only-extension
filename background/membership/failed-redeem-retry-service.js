(function attachMembershipFailedRedeemRetryService(root, factory) {
  const api = factory();
  root.MultiPageMembershipFailedRedeemRetryService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipFailedRedeemRetryServiceModule() {
  function createFailedRedeemRetryService(deps = {}) {
    const {
      REDEEM_CHANNEL_FAILURE_LIMIT,
      RESULTS_STORAGE_KEY,
      addLog,
      buildAutoContinuationRedeemCandidates,
      buildRedeemChannelFailurePatch,
      getAvailableUpiRedeemCdkeys,
      getFreshUpiRedeemRuntimeState,
      getRedeemChannelFailureCount,
      getRedeemChannelLabel,
      getRedeemLockReason,
      getRedeemRoundLabel,
      getRedeemTotalRoundLimit,
      getStoredResults,
      isRedeemChannelDailyLimitReason,
      maskAccessToken,
      normalizeEmail,
      normalizeRedeemChannel,
      normalizeResultsPayload,
      normalizeRetryCount,
      normalizeString,
      normalizeUpiRedeemRemoteStatus,
      pickRandomUpiRedeemCdkey,
      redeemUpiCredentialWithAccessToken,
      runtimeFlags,
      saveResults,
      throwIfMembershipStopRequested,
      upsertResultItem,
    } = deps;

    async function retryFailedUpiRedeemCdkey(input = {}) {
      const redeemChannel = normalizeRedeemChannel(input.channel || input.redeemChannel);
      const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
      const summary = {
        ok: true,
        skipped: false,
        limit: 0,
        attempted: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        skippedCount: 0,
        items: [],
        updates: {},
      };

      if (runtimeFlags.batchRunning || runtimeFlags.redeemRunning || runtimeFlags.cdkeyRetryRunning) {
        const reason = `${redeemChannelLabel} 备份账号核验/兑换正在运行，暂不继续失败账号兑换轮次。`;
        await addLog(`${redeemChannelLabel} 自动续兑：跳过：${reason}`, 'warn');
        return {
          ...summary,
          ok: false,
          skipped: true,
          reason,
        };
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error(`${redeemChannelLabel} 自动续兑能力尚未接入。`);
      }

      const initialState = await getFreshUpiRedeemRuntimeState(input);
      const configuredRoundCount = REDEEM_CHANNEL_FAILURE_LIMIT;
      const totalRoundLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      summary.limit = totalRoundLimit;
      if (configuredRoundCount <= 0) {
        return {
          ...summary,
          skipped: true,
          reason: '兑换轮数为 0，刷新后不继续失败账号。',
        };
      }

      const startedAt = new Date().toISOString();
      let currentResults = normalizeResultsPayload(input.results || initialState?.[RESULTS_STORAGE_KEY] || await getStoredResults());
      let items = Array.isArray(currentResults.items) ? [...currentResults.items] : [];

      const targetEmail = normalizeEmail(input.email || input.accountEmail || input.credential?.email || '');
      const candidateQueue = buildAutoContinuationRedeemCandidates(items, totalRoundLimit, targetEmail, redeemChannel);
      const candidates = candidateQueue.candidates;

      if (!candidates.length) {
        return {
          ...summary,
          skipped: true,
          reason: '没有可继续兑换的待兑换/失败账号。',
        };
      }

      runtimeFlags.redeemRunning = true;
      runtimeFlags.redeemStopRequested = false;
      runtimeFlags.cdkeyRetryRunning = true;

      const saveRetryProgress = async (patch = {}) => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: currentResults.redeemStartedAt || startedAt,
          redeemUpdatedAt: new Date().toISOString(),
          redeemTotal: Math.max(candidates.length, Math.floor(Number(currentResults.redeemTotal) || 0)),
          redeemCompleted: summary.attempted,
          flowStage: patch.flowStage || currentResults.flowStage,
          flowStageEmail: normalizeEmail(patch.email || currentResults.flowStageEmail),
          source: normalizeString(input.source || currentResults.source || 'upi-failed-account-auto-retry'),
        });
      };

      try {
        const firstRuntimeState = await getFreshUpiRedeemRuntimeState(input);
        const roundCdkeys = getAvailableUpiRedeemCdkeys(firstRuntimeState, redeemChannel);
        if (!roundCdkeys.length) {
          const reason = '没有剩余可用 CDK，失败账号兑换轮次已停止。';
          const resumeReason = `${reason}请手动点击一键兑换继续处理剩余账号。`;
          const stoppedAt = new Date().toISOString();
          for (const candidate of candidates) {
            const email = normalizeEmail(candidate.email);
            const accessToken = normalizeString(candidate.accessToken);
            const previousFailureCount = normalizeRetryCount(candidate.redeemFailureCount);
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: resumeReason,
              checkedAt: candidate.checkedAt || stoppedAt,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: '',
              redeemReason: resumeReason,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              redeemLastFailedAt: candidate.redeemLastFailedAt,
              lastFailedUpiRedeemCdkey: candidate.lastFailedUpiRedeemCdkey || candidate.upiRedeemCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            summary.skippedCount += 1;
            summary.items.push({ email, skipped: true, reason });
          }
          await saveRetryProgress({ flowStage: '', email: '' });
          await addLog(
            `${redeemChannelLabel} 自动续兑：${reason}已暂停 ${candidates.length} 个账号；请手动点击一键兑换继续处理剩余账号。`,
            'warn'
          );
        } else {
          await addLog(
            `${redeemChannelLabel} 自动续兑：跳过新导入待兑换 ${candidateQueue.freshCount} 个，只处理回到待兑换 ${candidateQueue.releasedCount} 个、失败可重试 ${candidateQueue.failedCount} 个，当前 CDK 槽位 ${roundCdkeys.length} 个，总轮数 ${totalRoundLimit}；本次每个账号最多提交一次。`,
            'info'
          );
          for (const candidate of candidates) {
          throwIfMembershipStopRequested('redeem');
          const email = normalizeEmail(candidate.email);
          const accessToken = normalizeString(candidate.accessToken);
          const isFailedRetryCandidate = normalizeUpiRedeemRemoteStatus(candidate.redeemStatus) === 'failed';
          const previousFailureCount = isFailedRetryCandidate
            ? Math.max(1, getRedeemChannelFailureCount(candidate, redeemChannel))
            : getRedeemChannelFailureCount(candidate, redeemChannel);
          const attemptNumber = previousFailureCount + 1;
          const roundLabel = getRedeemRoundLabel(attemptNumber, totalRoundLimit);

          const runtimeState = await getFreshUpiRedeemRuntimeState(input);
          const availableCdkeys = getAvailableUpiRedeemCdkeys(runtimeState, redeemChannel);
          if (!availableCdkeys.length) {
            const reason = '没有剩余可用 CDK，失败账号兑换轮次已停止。';
            summary.skippedCount += 1;
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: `${reason}请手动点击一键兑换继续处理剩余账号。`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: '',
              redeemReason: `${reason}请手动点击一键兑换继续处理剩余账号。`,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              redeemLastFailedAt: candidate.redeemLastFailedAt,
              lastFailedUpiRedeemCdkey: candidate.lastFailedUpiRedeemCdkey || candidate.upiRedeemCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: '', email: '' });
            summary.items.push({ email, skipped: true, reason });
            await addLog(`${redeemChannelLabel} 自动续兑：${email} -> 跳过：${reason}`, 'warn');
            break;
          }

          const selectedCdkey = pickRandomUpiRedeemCdkey(availableCdkeys);
          if (!selectedCdkey) {
            const reason = '兑换轮次未找到可提交 CDK。';
            summary.skippedCount += 1;
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason,
              redeemStatus: 'failed',
              redeemReason: reason,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              upiRedeemCdkey: candidate.upiRedeemCdkey,
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
            summary.items.push({ email, skipped: true, reason });
            continue;
          }

          const redeemAttemptedAt = new Date().toISOString();
          items = upsertResultItem(items, {
            ...candidate,
            status: 'free',
            planType: 'free',
            checkedAt: redeemAttemptedAt,
            reason: `${roundLabel}：已绑定 CDK，正在提交`,
            accessToken,
            accessTokenMasked: maskAccessToken(accessToken),
            redeemStatus: 'running',
            redeemReason: `${roundLabel}：${selectedCdkey}`,
            redeemAttemptedAt,
            redeemFailureLimit: totalRoundLimit,
            upiRedeemCdkey: selectedCdkey,
            redeemChannel,
          });
          await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
          await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${roundLabel} 随机选择 CDK ${selectedCdkey}。`, 'info');

          try {
            const redeemResult = await redeemUpiCredentialWithAccessToken({
              state: {
                ...runtimeState,
                ...currentResults,
                visibleStep: 7,
              },
              credential: candidate,
              session: { accessToken },
              accessToken,
              forceCdkey: selectedCdkey,
              channel: redeemChannel,
              skipEligibilityCheck: true,
              deferSubscriptionConfirmation: true,
            });

            if (redeemResult?.duplicateCdkeyRejected === true) {
              const reason = redeemResult.reason || 'CDK 重复提交，当前账号本轮结束，切换下一个账号。';
              const failurePatch = buildRedeemChannelFailurePatch(candidate, redeemChannel, {
                reason,
                failedAt: new Date().toISOString(),
              });
              const failureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
              const reachedUpiDailyLimit = redeemChannel === 'upi' && isRedeemChannelDailyLimitReason(reason);
              summary.attempted += 1;
              summary.failed += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? getRedeemLockReason(failurePatch)
                  : reachedUpiDailyLimit
                    ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                  : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                    ? `${reason}（UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI）`
                    : `${reason}（${getRedeemRoundLabel(failureCount, totalRoundLimit)}）`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'failed',
                redeemReason: reason,
                ...failurePatch,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: selectedCdkey,
                upiRedeemCdkey: '',
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(
                redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用。`
                  : reachedUpiDailyLimit
                    ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选。`
                  : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                    ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI。`
                    : `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，本账号本轮结束，切换下一个账号。`,
                'warn'
              );
              summary.items.push({ email, cdkey: selectedCdkey, failed: true, reason });
              continue;
            }

            if (redeemResult?.pendingRemoteConfirmation === true) {
              summary.attempted += 1;
              summary.submitted += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: redeemResult.reason || 'CDK 已提交，等待远端系统返回最终结果',
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'submitted',
                redeemReason: redeemResult.reason || `${roundLabel} 已提交，等待远端结果`,
                redeemAttemptedAt,
                redeemFailureCount: previousFailureCount,
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: candidate.redeemLastFailedAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || selectedCdkey),
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 已提交，等待远端结果。`, 'ok');
              summary.items.push({ email, cdkey: selectedCdkey, submitted: true });
              continue;
            }

            const redeemedSubscription = classifyRedeemResult(redeemResult);
            if (redeemedSubscription.active && isPaidPlanType(redeemedSubscription.planType)) {
              const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
              summary.attempted += 1;
              summary.succeeded += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'paid',
                planType: redeemedSubscription.planType,
                checkedAt: redeemSuccessAt,
                reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'success',
                redeemReason: `${redeemChannelLabel} 自动续兑成功并已确认会员`,
                redeemFailureCount: 0,
                upiRedeemFailureCount: 0,
                idealRedeemFailureCount: 0,
                ...buildRedeemAccountUnlockedPatch(),
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: '',
                redeemAttemptedAt,
                redeemSuccessAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || selectedCdkey),
                redeemChannel,
                upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveRetryProgress({ flowStage: 'confirm-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 已确认 ${redeemedSubscription.planType}。`, 'ok');
              summary.items.push({ email, cdkey: selectedCdkey, succeeded: true });
              continue;
            }

            throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
          } catch (error) {
            if (isMembershipStopError(error)) {
              throw error;
            }
            const reason = getErrorMessage(error) || '失败账号兑换轮次提交失败。';
            const failurePatch = buildRedeemChannelFailurePatch(candidate, redeemChannel, {
              reason,
              failedAt: new Date().toISOString(),
            });
            const failureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
            const reachedUpiDailyLimit = redeemChannel === 'upi' && isRedeemChannelDailyLimitReason(reason);
            summary.attempted += 1;
            summary.failed += 1;
            if (isUpiRedeemApiAuthError(error)) {
              runtimeFlags.redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: `${redeemChannelLabel} 远端接口拒绝请求，失败账号兑换轮次已停止`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'stopped',
                redeemReason: reason,
                redeemFailureCount: previousFailureCount,
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: candidate.redeemLastFailedAt,
                redeemAttemptedAt,
                upiRedeemCdkey: selectedCdkey,
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：远端接口拒绝请求，已停止在 ${email}，请检查 External API Key 或后端权限：${reason}`, 'error');
              summary.items.push({ email, cdkey: selectedCdkey, failed: true, stopped: true, reason });
              break;
            }
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                ? getRedeemLockReason(failurePatch)
                : reachedUpiDailyLimit
                  ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${reason}（UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI）`
                  : `${reason}（${getRedeemRoundLabel(failureCount, totalRoundLimit)}）`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: 'failed',
              redeemReason: reason,
              ...failurePatch,
              redeemAttemptedAt,
              lastFailedUpiRedeemCdkey: selectedCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
            await addLog(
              redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`
                : reachedUpiDailyLimit
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选：${reason}`
                : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI：${reason}`
                  : `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，本账号本轮结束，切换下一个账号：${reason}`,
              'warn'
            );
            summary.items.push({ email, cdkey: selectedCdkey, failed: true, reason });
          }
        }
        }
      } finally {
        const finishedAt = new Date().toISOString();
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: normalizeString(input.source || currentResults.source || 'upi-failed-account-auto-retry'),
        });
        runtimeFlags.redeemRunning = false;
        runtimeFlags.cdkeyRetryRunning = false;
      }

      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      return {
        ...summary,
        ok: summary.failed === 0,
        retried: summary.attempted > 0,
        results: currentResults,
        updates: buildRetryUpdatesPayload(
          currentResults,
          normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(latestState, redeemChannel)),
          redeemChannel
        ),
      };
    }

    const trialEligibilityServiceFactory = getMembershipTrialEligibilityServiceModule().createTrialEligibilityService;
    if (typeof trialEligibilityServiceFactory !== 'function') {
      throw new Error('Membership trial eligibility service module is not loaded.');
    }
    const trialEligibilityService = trialEligibilityServiceFactory({
      addLog,
      checkUpiRedeemAccessTokenEligibility,
      findBackupCredentialByEmail,
      getChatGptSessionAccessToken,
      getErrorMessage,
      getState,
      getStoredResults,
      hasPasskeyCredential,
      isBatchRunning: () => runtimeFlags.batchRunning,
      isCdkeyRetryRunning: () => runtimeFlags.cdkeyRetryRunning,
      isRedeemRunning: () => runtimeFlags.redeemRunning,
      loginAndReadAccessToken,
      markCustomEmailPoolEntryTrialEligibility,
      markRegistrationEmailTrialIneligible,
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      resolveInputCredentials,
      saveResults,
      setBatchRunning: (value) => { runtimeFlags.batchRunning = value === true; },
      setBatchStopRequested: (value) => { batchStopRequested = value === true; },
      throwIfMembershipStopRequested,
      upsertResultItem,
      upsertTrialEligibleFreeCredential,
    });
    const { checkUpiCredentialMembershipTrialEligibility } = trialEligibilityService;
    const importExportServiceFactory = getMembershipImportExportServiceModule().createImportExportService;
    if (typeof importExportServiceFactory !== 'function') {
      throw new Error('Membership import/export service module is not loaded.');
    }
    const importExportService = importExportServiceFactory({
      buildRedeemAccountUnlockedPatch,
      buildResultExportRows,
      buildTimestampedFileName,
      deleteUpiCredentialMembershipCheckResults,
      getActiveRedeemCdkeyUsageEmailSetFromState,
      getResultItemRedeemChannel,
      getState,
      getStoredResults,
      isActiveUpiCredentialMembershipRedeemResultItem,
      isBatchRunning: () => runtimeFlags.batchRunning,
      isCdkeyRetryRunning: () => runtimeFlags.cdkeyRetryRunning,
      isLikelyVerificationUrl,
      isPasskeyExportMarker,
      isRedeemRunning: () => runtimeFlags.redeemRunning,
      isResultItemHiddenByPlusDeletion,
      isResultItemPasskeyExportableForStatus,
      normalizeEmail,
      normalizeEmailList,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeResultsPayload,
      normalizeString,
      resolveInputCredentials,
      saveResults,
    });
    const {
      exportUpiCredentialMembershipCheckResults,
      importUpiCredentialMembershipFreeResults,
    } = importExportService;

    return {
      retryFailedUpiRedeemCdkey,
    };
  }

  return {
    createFailedRedeemRetryService,
  };
});
