(function attachMembershipRedeemService(root, factory) {
  const api = factory();
  root.MultiPageMembershipRedeemService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipRedeemServiceModule() {
  function createMembershipRedeemService(deps = {}) {
    const {
      BACKUP_STORAGE_KEY,
      DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT,
      REDEEM_CHANNEL_FAILURE_LIMIT = 3,
      REDEEM_GROUP_CONTINUATION_IDLE_TIMEOUT_MS,
      REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS,
      addLog,
      assertUpiRedeemSettingsReadyForMembershipRedeem,
      buildAutoContinuationRedeemCandidates,
      buildFreeMembershipOverrideFields,
      buildRedeemChannelFailurePatch,
      buildRedeemDeletionStatePatch,
      checkCredentialPaidSubscription,
      checkUpiRedeemSubscriptionStatuses,
      chromeApi,
      classifyRedeemResult,
      filterRedeemableCredentialsForCurrentResults,
      findBackupCredentialByEmail,
      getAvailableUpiRedeemCdkeys,
      getChatGptSessionAccessToken,
      getErrorMessage,
      getFreshUpiRedeemRuntimeState,
      getMembershipAccessTokenSupplementServiceModule,
      getMembershipPlusVerificationServiceModule,
      getRedeemChannelFailureCount,
      getRedeemChannelLabel,
      getRedeemChannelUsage,
      getRedeemLockReason,
      getRedeemResultSubscriptionCheckedAt,
      getRedeemRoundLabel,
      getRedeemTotalRoundLimit,
      getState,
      getStoredResults,
      getUpiRedeemStateValue,
      hasChatGptSessionPayload,
      hasPasskeyCredential,
      identifyUpiCredentialMembershipFreePlus,
      isActiveUpiRedeemRemoteStatus,
      isApproveBlockedError,
      isCdkeyExhaustedError,
      isMembershipStopError,
      isPaidPlanType,
      isPreSubmitUpiRedeemBlockedResultItem,
      isRedeemChannelDailyLimitReason,
      isRetryableUpiRedeemRoundResultItem,
      isSessionAccountMismatchError,
      isUpiRedeemApiAuthError,
      loginAndReadAccessToken,
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeCredentialBackupMap,
      normalizeEmail,
      normalizeFailedAccountRetryLimit,
      normalizeFlowStage,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      normalizeSubscriptionRuntimeState,
      normalizeTotpSecret,
      normalizeUpiRedeemCdkeyUsage,
      pickRandomUpiRedeemCdkey,
      redeemUpiCredentialWithAccessToken,
      refreshPendingUpiCredentialMembershipRedeemStatuses,
      resolveInputCredentials,
      runtimeFlags,
      sanitizeUpiRedeemRuntimeSettings,
      saveResults,
      setState,
      shouldRedeemItemUseChannel,
      sleepWithStop,
      throwIfMembershipStopRequested,
      throwIfStopped,
      upsertResultItem,
      verifyUpiCredentialMembershipPlus,
    } = deps;

    async function redeemUpiCredentialMembershipFreeLegacy(input = {}) {
      if (runtimeFlags.batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (runtimeFlags.redeemRunning) {
        throw new Error('UPI 无会员账号补兑正在运行，请等待完成或先停止。');
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error('UPI 无会员账号补兑能力尚未接入。');
      }

      runtimeFlags.redeemRunning = true;
      runtimeFlags.redeemStopRequested = false;
      try {
      const startedAt = new Date().toISOString();
      let redeemCompleted = 0;
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input)
        .filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const source = normalizeString(input.source || currentResults.source || 'free-selected');
      const deleteBackups = input.deleteBackups !== false;
      const deletionStatePatch = buildRedeemDeletionStatePatch(currentResults);
      const redeemAutoDeletedEmailsForBackupCleanup = [];
      const runtimeSettings = sanitizeUpiRedeemRuntimeSettings(input.settings);
      const configuredRoundCount = normalizeFailedAccountRetryLimit(
        getUpiRedeemStateValue(runtimeSettings, 'upiRedeemFailedAccountRetryLimit'),
        DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT
      );
      const redeemFailureLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      const credentials = filterRedeemableCredentialsForCurrentResults(requestedCredentials, {
        ...currentResults,
        items,
      });
      const skippedCompletedCount = Math.max(0, requestedCredentials.length - credentials.length);

      try {
        if (skippedCompletedCount) {
          await addLog(`UPI 无会员补兑：已跳过 ${skippedCompletedCount} 个重载前已处理账号，只继续未完成账号。`, 'info');
        }
        if (credentials.length) {
          if (typeof setState === 'function' && Object.keys(runtimeSettings).length) {
            await setState(runtimeSettings).catch(() => {});
          }
          await assertUpiRedeemSettingsReadyForMembershipRedeem(credentials, runtimeSettings);
        }

        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: startedAt,
          redeemUpdatedAt: startedAt,
          redeemFinishedAt: '',
          redeemStoppedAt: '',
          flowStage: 'import',
          flowStageEmail: '',
          redeemTotal: credentials.length,
          redeemCompleted: 0,
          source,
          ...deletionStatePatch,
        });

        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return await saveResults({
            ...currentResults,
            redeeming: false,
            redeemUpdatedAt: finishedAt,
            redeemFinishedAt: finishedAt,
            redeemTotal: 0,
            redeemCompleted: 0,
            flowStage: '',
            flowStageEmail: '',
            ...deletionStatePatch,
          });
        }

        await addLog(`UPI 无会员补兑：开始处理 ${credentials.length} 个账号。`, 'info');
        for (let index = 0; index < credentials.length; index += 1) {
          throwIfStopped();
          if (runtimeFlags.redeemStopRequested) break;

          const credential = credentials[index];
          const throwIfStopRequested = () => throwIfMembershipStopRequested('redeem');
          const checkedAt = new Date().toISOString();
          const existingItem = items.find((item) => normalizeEmail(item?.email) === normalizeEmail(credential.email)) || {};
          const resetPreSubmitBlockedFailure = isPreSubmitUpiRedeemBlockedResultItem(existingItem);
          const baseItem = {
            ...existingItem,
            ...credential,
            status: 'free',
            planType: 'free',
            checkedAt,
            ...(resetPreSubmitBlockedFailure ? {
              reason: 'Free 分组账号，可提交 CDK 兑换',
              redeemStatus: '',
              redeemReason: '',
              redeemFailureCount: 0,
              redeemLastFailedAt: '',
              upiRedeemCdkey: '',
            } : {}),
          };
          const updateRedeemStage = async (stage, reason = '') => {
            throwIfStopRequested();
            if (reason) {
              items = upsertResultItem(items, {
                ...baseItem,
                redeemStatus: 'running',
                redeemReason: reason,
              });
            }
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
              flowStage: stage,
              flowStageEmail: credential.email,
            });
            throwIfStopRequested();
          };

          items = upsertResultItem(items, {
            ...baseItem,
            redeemStatus: 'running',
            redeemReason: '正在登录并准备兑换',
          });
          currentResults = await saveResults({
            ...currentResults,
            items,
            redeeming: true,
            redeemUpdatedAt: checkedAt,
            redeemTotal: credentials.length,
            redeemCompleted,
            source,
            flowStage: 'open-chatgpt',
            flowStageEmail: credential.email,
          });

          let attemptedUpiRedeemCdkey = '';
          try {
            throwIfStopRequested();
            if (!credential.password) {
              throw new Error('缺少 GPT 密码');
            }
            if (!credential.totpMfaSecret) {
              throw new Error('缺少 2FA 密钥');
            }
            const session = await loginAndReadAccessToken(credential, currentResults, {
              onStage: async (stage) => updateRedeemStage(stage, {
                'open-chatgpt': '正在打开 ChatGPT 官网',
                login: '正在登录邮箱密码',
                totp: '正在提交 2FA 验证',
                token: '正在读取 ChatGPT session',
              }[stage] || '正在登录并准备兑换'),
              throwIfStopRequested,
            });
            throwIfStopRequested();
            if (!hasChatGptSessionPayload(session.session || session)) {
              throw new Error('未读取到 ChatGPT session');
            }

            if (session.accessToken) {
              await updateRedeemStage('subscription-check', '正在查询会员资格');
              const currentSubscription = await checkCredentialPaidSubscription({
                state: currentResults,
                credential,
                accessToken: session.accessToken,
                throwIfStopRequested,
              });
              throwIfStopRequested();
              if (currentSubscription.status === 'paid') {
                await updateRedeemStage('confirm-plus', '正在确认 Plus/Pro/Team 会员');
                const redeemSuccessAt = new Date().toISOString();
                redeemCompleted += 1;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'paid',
                  planType: currentSubscription.planType,
                  reason: currentSubscription.reason || `已开通 ${currentSubscription.planType}`,
                  checkedAt: redeemSuccessAt,
                  accessToken: session.accessToken,
                  accessTokenMasked: maskAccessToken(session.accessToken),
                  redeemStatus: 'skipped',
                  redeemReason: '重新核验已是会员，未消耗 CDK',
                  redeemFailureCount: 0,
                  redeemLastFailedAt: '',
                  upiRedeemCdkey: '',
                  redeemSuccessAt,
                  upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                  membershipOverrideStatus: '',
                  membershipOverrideCheckedAt: '',
                });
                currentResults = await saveResults({
                  ...currentResults,
                  items,
                  redeeming: true,
                  redeemUpdatedAt: new Date().toISOString(),
                  redeemTotal: credentials.length,
                  redeemCompleted,
                  source,
                });
                await addLog(`UPI 无会员补兑：${credential.email} 重新核验已是会员，跳过 CDK 兑换。`, 'ok');
                continue;
              }
            } else {
              await addLog(`UPI 无会员补兑：${credential.email} 已读取完整 ChatGPT session，但没有 token 摘要，跳过本地会员预核验，直接提交远端兑换。`, 'warn');
            }

            const runtimeStateForCdkey = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            attemptedUpiRedeemCdkey = pickRandomUpiRedeemCdkey(getAvailableUpiRedeemCdkeys(runtimeStateForCdkey));
            if (!attemptedUpiRedeemCdkey) {
              throw new Error('CDK 不足');
            }
            await updateRedeemStage('upi-redeem-plus', `正在使用 CDK 兑换 Plus：${attemptedUpiRedeemCdkey}`);
            throwIfStopRequested();
            const redeemResult = await redeemUpiCredentialWithAccessToken({
              state: {
                ...currentResults,
                ...runtimeSettings,
                visibleStep: 7,
              },
              credential,
              session: session.session || session,
              accessToken: session.accessToken,
              forceCdkey: attemptedUpiRedeemCdkey,
              skipEligibilityCheck: true,
              deferSubscriptionConfirmation: true,
            });
            attemptedUpiRedeemCdkey = normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || attemptedUpiRedeemCdkey);
            throwIfStopRequested();
            if (redeemResult?.duplicateCdkeyRejected === true) {
              redeemCompleted += 1;
              const duplicateReason = redeemResult.reason || 'CDK 已重复提交，当前账号未提交成功；本账号本轮结束，切换下一个账号。';
              const duplicateFailedAt = new Date().toISOString();
              const duplicateFailureCount = normalizeRetryCount(baseItem.redeemFailureCount) + 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: duplicateReason,
                accessToken: session.accessToken,
                accessTokenMasked: maskAccessToken(session.accessToken),
                redeemStatus: 'failed',
                redeemReason: duplicateReason,
                redeemFailureCount: duplicateFailureCount,
                redeemFailureLimit,
                redeemLastFailedAt: duplicateFailedAt,
                lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
                upiRedeemCdkey: '',
                upiRedeemSubscriptionCheckedAt: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
              });
              await addLog(`UPI 无会员补兑：${credential.email} -> 重复 CDK 未提交当前账号，本账号本轮结束，切换下一个账号。`, 'warn');
              continue;
            }
            await updateRedeemStage('confirm-plus', '正在确认 Plus/Pro/Team 会员');
            const redeemedSubscription = classifyRedeemResult(redeemResult);
            if (redeemResult.pendingRemoteConfirmation === true) {
              redeemCompleted += 1;
              const pendingReason = redeemResult.reason || 'CDK 已提交，等待远端系统返回最终结果';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: pendingReason,
                accessToken: session.accessToken,
                accessTokenMasked: maskAccessToken(session.accessToken),
                redeemStatus: 'submitted',
                redeemReason: pendingReason,
                redeemFailureCount: normalizeRetryCount(baseItem.redeemFailureCount),
                redeemLastFailedAt: baseItem.redeemLastFailedAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey),
                upiRedeemSubscriptionCheckedAt: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
              });
              await addLog(`UPI 无会员补兑：${credential.email} 已提交 CDK，等待远端系统返回最终结果，不计入账号失败轮次。`, 'info');
              continue;
            }
            if (!redeemedSubscription.active || !isPaidPlanType(redeemedSubscription.planType)) {
              throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
            }
            const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
            redeemCompleted += 1;
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'paid',
              planType: redeemedSubscription.planType,
              reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
              checkedAt: redeemSuccessAt,
              accessToken: session.accessToken,
              accessTokenMasked: maskAccessToken(session.accessToken),
              redeemStatus: 'success',
              redeemReason: 'CDK 兑换成功并已确认会员',
              redeemFailureCount: 0,
              redeemLastFailedAt: '',
              upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey),
              redeemSuccessAt,
              upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
              membershipOverrideStatus: '',
              membershipOverrideCheckedAt: '',
            });
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
            });
            await addLog(`UPI 无会员补兑：${credential.email} 已兑换并确认 ${redeemedSubscription.planType}。`, 'ok');
          } catch (error) {
            if (isMembershipStopError(error)) {
              runtimeFlags.redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: '已停止，未消耗 CDK',
                redeemStatus: 'stopped',
                redeemReason: '已停止，未消耗 CDK',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: currentResults.flowStageEmail || credential.email,
              });
              await addLog(`UPI 无会员补兑：已停止，${credential.email} 未继续兑换。`, 'warn');
              break;
            }
            if (isSessionAccountMismatchError(error)) {
              runtimeFlags.redeemStopRequested = true;
              const reason = getErrorMessage(error) || '账号登录态不一致，补兑已停止';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: '账号登录态不一致，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: `${reason}，未消耗 CDK，后续账号不会继续处理。`,
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'token',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：账号登录态不一致，已停止在 ${credential.email}，后续账号不会继续处理：${reason}`, 'warn');
              break;
            }
            if (isUpiRedeemApiAuthError(error)) {
              runtimeFlags.redeemStopRequested = true;
              const reason = getErrorMessage(error) || 'UPI 远端接口认证失败，请检查 UPI 外部 API Key。';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: 'UPI 远端接口拒绝请求，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: `${reason}；未判定账号失败，未释放或消耗 CDK。`,
                upiRedeemCdkey: attemptedUpiRedeemCdkey,
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'upi-redeem-plus',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：远端接口拒绝请求，已停止在 ${credential.email}，请根据后端返回原因检查 API Key、CDK 或 ChatGPT session：${reason}`, 'error');
              break;
            }
            if (isApproveBlockedError(error)) {
              redeemCompleted += 1;
              const reason = getErrorMessage(error) || 'approve-blocked';
              const failedAt = new Date().toISOString();
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: `${reason}（兑换失败，账号保留在 Free 等待重新匹配 CDK）`,
                redeemStatus: 'failed',
                redeemReason: reason,
                redeemFailureCount: normalizeRetryCount(baseItem.redeemFailureCount) + 1,
                redeemFailureLimit,
                redeemLastFailedAt: failedAt,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
                upiRedeemCdkey: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: credential.email,
                ...deletionStatePatch,
              });
              await addLog(
                attemptedUpiRedeemCdkey
                  ? `UPI 无会员补兑：${credential.email} -> 后端返回 approve-blocked，旧 CDK ${attemptedUpiRedeemCdkey} 已释放，账号保留在 Free 等待重新匹配：${reason}`
                  : `UPI 无会员补兑：${credential.email} -> 后端返回 approve-blocked，账号保留在 Free 等待重新匹配：${reason}`,
                'warn'
              );
              continue;
            }
            const shortage = isCdkeyExhaustedError(error);
            const reason = shortage ? 'CDK 不足' : getErrorMessage(error);
            if (shortage) {
              runtimeFlags.redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: 'CDK 不足，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: 'CDK 不足，补兑已停止，未消耗 CDK',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'upi-redeem-plus',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：CDK 不足，已停止在 ${credential.email}，后续账号不会继续处理。`, 'warn');
              break;
            }
            if (!attemptedUpiRedeemCdkey) {
              redeemCompleted += 1;
              const blockedReason = reason || '登录或读取 ChatGPT session 未完成';
              const previousRedeemFailureCount = isPreSubmitUpiRedeemBlockedResultItem(baseItem)
                ? 0
                : normalizeRetryCount(baseItem.redeemFailureCount);
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: `${blockedReason}；未提交 CDK，不计入兑换失败轮次。`,
                redeemStatus: 'blocked',
                redeemReason: `${blockedReason}；未提交 CDK，不计入兑换失败轮次。`,
                redeemFailureCount: previousRedeemFailureCount,
                redeemLastFailedAt: baseItem.redeemLastFailedAt,
                upiRedeemCdkey: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: credential.email,
                ...deletionStatePatch,
              });
              await addLog(
                `UPI 无会员补兑：${credential.email} -> 登录/AT 阻塞，尚未提交 CDK，不计入兑换失败轮次：${blockedReason}`,
                'warn'
              );
              continue;
            }
            redeemCompleted += 1;
            const redeemFailedAt = new Date().toISOString();
            const existingRedeemFailureCount = normalizeRetryCount(baseItem.redeemFailureCount)
              || (normalizeString(baseItem.redeemStatus).toLowerCase() === 'failed' ? 1 : 0);
            const redeemFailureCount = existingRedeemFailureCount + 1;
            const failureLabel = getRedeemRoundLabel(redeemFailureCount, redeemFailureLimit || getRedeemTotalRoundLimit(0));
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'free',
              planType: 'free',
              reason: `${reason || '兑换失败'}（${failureLabel}）`,
              redeemStatus: 'failed',
              redeemReason: reason || '兑换失败',
              redeemFailureCount,
              redeemFailureLimit,
              redeemLastFailedAt: redeemFailedAt,
              lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
              upiRedeemCdkey: '',
            });
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
              flowStage: currentResults.flowStage,
              flowStageEmail: credential.email,
              ...deletionStatePatch,
            });
            await addLog(
              `UPI 无会员补兑：${credential.email} -> ${failureLabel}，账号保留在 Free：${reason}`,
              'warn'
            );
          }
        }

        const finishedAt = new Date().toISOString();
        if (deleteBackups && redeemAutoDeletedEmailsForBackupCleanup.length) {
          const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
          const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
          redeemAutoDeletedEmailsForBackupCleanup.forEach((email) => {
            delete backups[email];
          });
          await chromeApi.storage.local.set({ [BACKUP_STORAGE_KEY]: backups });
        }
        const finalResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: runtimeFlags.redeemStopRequested ? '' : finishedAt,
          redeemStoppedAt: runtimeFlags.redeemStopRequested ? finishedAt : '',
          redeemTotal: credentials.length,
          redeemCompleted,
          flowStage: runtimeFlags.redeemStopRequested ? currentResults.flowStage : '',
          flowStageEmail: runtimeFlags.redeemStopRequested ? currentResults.flowStageEmail : '',
          source,
          ...deletionStatePatch,
        });
        if (runtimeFlags.redeemStopRequested) {
          await addLog(`UPI 无会员补兑：已停止，已处理 ${finalResults.redeemCompleted}/${finalResults.redeemTotal}。`, 'warn');
        } else {
          await addLog(`UPI 无会员补兑：完成 ${finalResults.redeemCompleted}/${finalResults.redeemTotal}，有会员 ${finalResults.paidCount}，无会员 ${finalResults.freeCount}，失败 ${finalResults.failedCount}。`, 'ok');
        }
        return finalResults;
      } finally {
        runtimeFlags.redeemRunning = false;
      }
      } finally {
        runtimeFlags.redeemRunning = false;
      }
    }

    const accessTokenSupplementServiceFactory = getMembershipAccessTokenSupplementServiceModule().createAccessTokenSupplementService;
    if (typeof accessTokenSupplementServiceFactory !== 'function') {
      throw new Error('Membership access-token supplement service module is not loaded.');
    }
    const accessTokenSupplementService = accessTokenSupplementServiceFactory({
      addLog,
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
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeResultItem,
      normalizeString,
      normalizeTotpSecret,
      resolveInputCredentials,
      saveResults,
      setBatchRunning: (value) => { runtimeFlags.batchRunning = value === true; },
      setBatchStopRequested: (value) => { runtimeFlags.batchStopRequested = value === true; },
      throwIfMembershipStopRequested,
      upsertResultItem,
    });
    const { fillUpiCredentialMembershipFreeAccessTokens } = accessTokenSupplementService;

    async function redeemUpiCredentialMembershipFree(input = {}) {
      if (runtimeFlags.batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (runtimeFlags.redeemRunning) {
        throw new Error('UPI Free 账号兑换正在运行，请等待完成或先停止。');
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error('UPI Free 账号兑换能力尚未接入。');
      }

      runtimeFlags.redeemRunning = true;
      runtimeFlags.redeemStopRequested = false;
      try {
      const startedAt = new Date().toISOString();
      const redeemChannel = normalizeRedeemChannel(input.channel || input.redeemChannel);
      const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
      let redeemCompleted = 0;
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const source = normalizeString(input.source || currentResults.source || 'free-selected');
      const runtimeSettings = sanitizeUpiRedeemRuntimeSettings(input.settings);
      const configuredRoundCount = REDEEM_CHANNEL_FAILURE_LIMIT;
      const totalRoundLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items.filter((item) => normalizeString(item?.status).toLowerCase() === 'free');
      const freeCandidates = rawCandidates
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => credential.email && credential.status === 'free');
      const credentials = filterRedeemableCredentialsForCurrentResults(freeCandidates, {
        ...currentResults,
        items,
      })
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => shouldRedeemItemUseChannel(credential, redeemChannel));
      const stats = {
        attempted: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      };
      const attemptedEmailsThisRun = new Set();
      const requestedEmailSet = new Set(requestedCredentials.map((credential) => normalizeEmail(credential?.email)).filter(Boolean));
      const allowGroupContinuation = input.disableGroupContinuation !== true
        && !['free-click', 'free-single'].includes(source);
      const includeFreshContinuation = allowGroupContinuation
        && !['free-upi-to-ideal'].includes(source);
      const continuationTargetEmail = allowGroupContinuation
        ? ''
        : normalizeEmail(requestedCredentials[0]?.email || input.email || input.accountEmail || input.credential?.email || '');
      let redeemTotalTarget = credentials.length;

      const getLatestItem = (email = '') => (
        items.find((item) => normalizeEmail(item?.email) === normalizeEmail(email)) || {}
      );

      const rememberRedeemTotalTarget = (queue = []) => {
        redeemTotalTarget = Math.max(
          redeemTotalTarget,
          redeemCompleted + Math.max(0, Array.isArray(queue) ? queue.length : 0)
        );
      };

      const saveRedeemProgress = async (patch = {}) => {
        const requestedRedeemTotal = Math.max(
          0,
          Math.floor(Number(patch.redeemTotal ?? currentResults.redeemTotal ?? redeemTotalTarget ?? credentials.length) || 0)
        );
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: patch.redeeming !== false,
          redeemUpdatedAt: new Date().toISOString(),
          redeemTotal: Math.max(requestedRedeemTotal, redeemTotalTarget),
          redeemCompleted,
          source,
          flowStage: normalizeFlowStage(patch.flowStage ?? currentResults.flowStage),
          flowStageEmail: normalizeEmail(patch.email ?? currentResults.flowStageEmail),
        });
      };

      const reloadRedeemProgressState = async () => {
        currentResults = await getStoredResults();
        items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
        return currentResults;
      };

      const buildContinuationQueue = () => {
        if (!allowGroupContinuation && !continuationTargetEmail) {
          return [];
        }
        const queue = buildAutoContinuationRedeemCandidates(
          items,
          totalRoundLimit,
          continuationTargetEmail,
          redeemChannel,
          { includeFresh: includeFreshContinuation }
        ).candidates
          .filter((credential) => {
            const email = normalizeEmail(credential?.email);
            if (!email || attemptedEmailsThisRun.has(email)) {
              return false;
            }
            if (!includeFreshContinuation && requestedEmailSet.size && !requestedEmailSet.has(email)) {
              return false;
            }
            return true;
          });
        return filterRedeemableCredentialsForCurrentResults(queue, {
          ...currentResults,
          items,
        })
          .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
          .filter((credential) => shouldRedeemItemUseChannel(credential, redeemChannel));
      };

      const hasActiveRedeemWorkForChannel = (runtimeState = {}, resultItems = items) => {
        const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, redeemChannel));
        const hasActiveUsage = Object.values(usage).some((entry) => (
          entry?.retrying === true
          || isActiveUpiRedeemRemoteStatus(entry?.remoteStatus)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteMessage)
        ));
        if (hasActiveUsage) {
          return true;
        }
        return (Array.isArray(resultItems) ? resultItems : []).some((item) => {
          const itemChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
            ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
            : redeemChannel;
          return itemChannel === redeemChannel
            && normalizeString(item?.status).toLowerCase() === 'free'
            && (
              isActiveUpiRedeemRemoteStatus(item?.redeemStatus)
              || isActiveUpiRedeemRemoteStatus(item?.remoteStatus)
              || isActiveUpiRedeemRemoteStatus(item?.remoteMessage)
            );
        });
      };

      const refreshPendingRedeemStatusesForContinuation = async () => {
        if (typeof refreshPendingUpiCredentialMembershipRedeemStatuses !== 'function') {
          return;
        }
        try {
          await refreshPendingUpiCredentialMembershipRedeemStatuses({
            channel: redeemChannel,
            autoRefresh: true,
            skipAutoRetry: true,
            source: 'free-redeem-continuation',
          });
        } catch (error) {
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：刷新远端兑换状态失败，稍后继续等待：${getErrorMessage(error) || error.message || error}`,
            'warn'
          );
        }
      };

      const waitForContinuationCdkey = async (pendingCount = 0) => {
        const startedWaitingAt = Date.now();
        let waitLogged = false;
        while (true) {
          throwIfMembershipStopRequested('redeem');
          await refreshPendingRedeemStatusesForContinuation();
          await reloadRedeemProgressState();
          const latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          const availableCdkeys = getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel);
          if (availableCdkeys.length) {
            return { ok: true, availableCount: availableCdkeys.length };
          }
          const nextQueue = buildContinuationQueue();
          if (!nextQueue.length) {
            return { ok: false, reason: 'no-candidates' };
          }
          if (!hasActiveRedeemWorkForChannel(latestRuntimeState, items)) {
            return { ok: false, reason: 'no-active-work', pendingCount: nextQueue.length };
          }
          const waitedMs = Date.now() - startedWaitingAt;
          if (waitedMs >= REDEEM_GROUP_CONTINUATION_IDLE_TIMEOUT_MS) {
            return { ok: false, reason: 'timeout', pendingCount: nextQueue.length };
          }
          if (!waitLogged) {
            const waitSeconds = Math.max(1, Math.round(REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS / 1000));
            await addLog(
              `${redeemChannelLabel} Free 分组 CDK 兑换：当前没有可用 CDK，仍有 ${pendingCount || nextQueue.length} 个后续账号；将每 ${waitSeconds} 秒刷新远端状态，等待 CDK 回池后继续。`,
              'warn'
            );
            waitLogged = true;
          }
          rememberRedeemTotalTarget(nextQueue);
          await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email: '', redeemTotal: redeemTotalTarget });
          await sleepWithStop(REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS);
        }
      };

      try {
        if (credentials.length) {
          if (typeof setState === 'function' && Object.keys(runtimeSettings).length) {
            await setState(runtimeSettings).catch(() => {});
          }
          const latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          if (!normalizeString(getUpiRedeemStateValue(latestRuntimeState, 'upiRedeemExternalApiKey'))) {
            throw new Error('第 7 步 CDK 兑换 Plus 未配置：缺少 UPI 外部 API Key。');
          }
          const availableCdkeys = getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel);
          if (availableCdkeys.length > 0 && credentials.length > availableCdkeys.length) {
            await addLog(
              `${redeemChannelLabel} Free 分组 CDK 兑换：当前可用 CDK ${availableCdkeys.length} 个，待兑换账号 ${credentials.length} 个；本轮按 ${availableCdkeys.length} 个 CDK 槽位处理，失败释放槽位并补后续账号。`,
              'warn'
            );
          }
          if (!availableCdkeys.length) {
            await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：没有可用 CDK，本批未开始；账号保持待兑换。`, 'warn');
          }
        }

        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: startedAt,
          redeemUpdatedAt: startedAt,
          redeemFinishedAt: '',
          redeemStoppedAt: '',
          flowStage: 'import',
          flowStageEmail: '',
          redeemTotal: credentials.length,
          redeemCompleted: 0,
          source,
        });

        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return await saveResults({
            ...currentResults,
            redeeming: false,
            redeemUpdatedAt: finishedAt,
            redeemFinishedAt: finishedAt,
            redeemTotal: 0,
            redeemCompleted: 0,
            flowStage: '',
            flowStageEmail: '',
          });
        }

        let roundQueue = credentials;
        let continuationBatchNumber = 1;
        rememberRedeemTotalTarget(roundQueue);
        await addLog(
          `${redeemChannelLabel} Free 分组 CDK 兑换：开始处理 ${credentials.length} 个账号；配置总轮数 ${configuredRoundCount}，实际总轮数 ${totalRoundLimit}。`,
          'info'
        );

        while (roundQueue.length) {
          let stoppedForCdkey = false;
          for (let roundNumber = 1; roundNumber <= totalRoundLimit && roundQueue.length; roundNumber += 1) {
            throwIfMembershipStopRequested('redeem');
            const roundState = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            const roundCdkeys = getAvailableUpiRedeemCdkeys(roundState, redeemChannel);
            if (!roundCdkeys.length) {
              stoppedForCdkey = true;
              await addLog(
                `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮没有可用 CDK，剩余账号保持待兑换，准备刷新远端状态后续兑。`,
                'warn'
              );
              break;
            }

          const failedEmailsThisRound = [];
          const roundTotal = roundQueue.length;
          let roundAttempted = 0;
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：开始第 ${roundNumber}/${totalRoundLimit} 轮，账号 ${roundTotal} 个，CDK 槽位 ${roundCdkeys.length} 个。`,
            'info'
          );
          await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email: '', redeemTotal: roundTotal });

          for (const credential of roundQueue) {
            throwIfMembershipStopRequested('redeem');
            const email = normalizeEmail(credential.email);
            const existingItem = getLatestItem(email);
            const baseItem = normalizeResultItem({
              ...existingItem,
              ...credential,
              email,
              status: 'free',
              planType: 'free',
            });
            const accessToken = normalizeString(baseItem.accessToken);
            if (!accessToken) {
              const reason = '缺少 AT，请先点击“一键补充 AT”。';
              stats.skipped += 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason,
                redeemStatus: 'blocked',
                redeemReason: reason,
                redeemFailureLimit: totalRoundLimit,
                upiRedeemCdkey: '',
              });
              await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
              await addLog(`UPI Free 分组 CDK 兑换：${email} -> 跳过：${reason}`, 'warn');
              continue;
            }

            const runtimeStateForCdkey = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            const availableCdkeys = getAvailableUpiRedeemCdkeys(runtimeStateForCdkey, redeemChannel);
            const attemptedUpiRedeemCdkey = pickRandomUpiRedeemCdkey(availableCdkeys);
            if (!attemptedUpiRedeemCdkey) {
              stoppedForCdkey = true;
              await addLog(
                `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮暂时没有可用 CDK，剩余账号保持待兑换，准备刷新远端状态后续兑。`,
                'warn'
              );
              break;
            }

            const redeemAttemptedAt = new Date().toISOString();
            const roundLabel = getRedeemRoundLabel(roundNumber, totalRoundLimit);
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'free',
              planType: 'free',
              reason: `${roundLabel}：已绑定 CDK，正在提交`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: 'running',
              redeemReason: `${roundLabel}：${attemptedUpiRedeemCdkey}`,
              redeemAttemptedAt,
              redeemFailureLimit: totalRoundLimit,
              upiRedeemCdkey: attemptedUpiRedeemCdkey,
              redeemChannel,
            });
            await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
            await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${roundLabel} 随机选择 CDK ${attemptedUpiRedeemCdkey}。`, 'info');

            let attemptCounted = false;
            try {
              const redeemResult = await redeemUpiCredentialWithAccessToken({
                state: {
                  ...currentResults,
                  ...runtimeSettings,
                  visibleStep: 7,
                },
                credential: baseItem,
                session: { accessToken },
                accessToken,
                forceCdkey: attemptedUpiRedeemCdkey,
                channel: redeemChannel,
                skipEligibilityCheck: true,
                deferSubscriptionConfirmation: true,
              });
              const submittedCdkey = normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || attemptedUpiRedeemCdkey);
              if (redeemResult?.duplicateCdkeyRejected === true) {
                throw new Error(redeemResult.reason || 'CDK 重复提交，当前账号本轮未提交成功。');
              }
              roundAttempted += 1;
              redeemCompleted += 1;
              stats.attempted += 1;
              attemptCounted = true;
              attemptedEmailsThisRun.add(email);
              if (redeemResult.pendingRemoteConfirmation === true) {
                const pendingReason = normalizeString(redeemResult.reason)
                  || 'CDK 已提交，等待远端系统返回最终结果';
                stats.submitted += 1;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'free',
                  planType: 'free',
                  reason: pendingReason,
                  accessToken,
                  accessTokenMasked: maskAccessToken(accessToken),
                  redeemStatus: 'submitted',
                  redeemReason: pendingReason,
                  redeemFailureLimit: totalRoundLimit,
                  redeemAttemptedAt,
                  upiRedeemCdkey: submittedCdkey,
                  redeemChannel,
                });
                await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
                await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${submittedCdkey} 已提交到远端，等待最终会员结果。`, 'ok');
                continue;
              }

              await saveRedeemProgress({ flowStage: 'confirm-plus', email, redeemTotal: roundTotal });
              const redeemedSubscription = classifyRedeemResult(redeemResult);
              if (!redeemedSubscription.active || !isPaidPlanType(redeemedSubscription.planType)) {
                throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
              }
              const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
              stats.succeeded += 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'paid',
                planType: redeemedSubscription.planType,
                reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
                checkedAt: redeemSuccessAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'success',
                redeemReason: 'CDK 兑换成功并已确认会员',
                redeemFailureCount: 0,
                upiRedeemFailureCount: 0,
                idealRedeemFailureCount: 0,
                ...buildRedeemAccountUnlockedPatch(),
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: '',
                redeemAttemptedAt,
                redeemSuccessAt,
                upiRedeemCdkey: submittedCdkey,
                redeemChannel,
                upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveRedeemProgress({ flowStage: 'confirm-plus', email, redeemTotal: roundTotal });
              await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${submittedCdkey} 已兑换并确认 ${redeemedSubscription.planType}。`, 'ok');
            } catch (error) {
              if (isMembershipStopError(error)) {
                runtimeFlags.redeemStopRequested = true;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'free',
                  planType: 'free',
                  reason: '已停止，未继续兑换',
                  redeemStatus: 'stopped',
                  redeemReason: '已停止，未继续兑换',
                  redeemAttemptedAt,
                  upiRedeemCdkey: attemptedUpiRedeemCdkey,
                  redeemChannel,
                });
                break;
              }
              const authError = isUpiRedeemApiAuthError(error);
              const reason = getErrorMessage(error) || '兑换失败';
              const redeemFailedAt = new Date().toISOString();
              const failurePatch = authError
                ? {
                  redeemFailureCount: getRedeemChannelFailureCount(baseItem, redeemChannel),
                  redeemFailureLimit: totalRoundLimit,
                }
                : buildRedeemChannelFailurePatch(baseItem, redeemChannel, {
                  reason,
                  failedAt: redeemFailedAt,
                });
              const channelFailureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
              const reachedUpiDailyLimit = !authError
                && redeemChannel === 'upi'
                && isRedeemChannelDailyLimitReason(reason);
              const reachedIdealLock = !authError
                && redeemChannel === 'ideal'
                && channelFailureCount >= REDEEM_CHANNEL_FAILURE_LIMIT;
              if (!attemptCounted) {
                roundAttempted += 1;
                redeemCompleted += 1;
                stats.attempted += 1;
                attemptedEmailsThisRun.add(email);
              }
              if (authError) {
                runtimeFlags.redeemStopRequested = true;
              } else {
                stats.failed += 1;
                failedEmailsThisRound.push(email);
              }
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: authError
                  ? 'UPI 远端接口拒绝请求，已停止整批兑换'
                  : reachedIdealLock
                    ? getRedeemLockReason(failurePatch)
                    : reachedUpiDailyLimit
                      ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                    : `${reason}（${roundLabel}）`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: authError ? 'stopped' : 'failed',
                redeemReason: reason,
                ...failurePatch,
                redeemLastFailedAt: authError ? baseItem.redeemLastFailedAt : redeemFailedAt,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: authError ? baseItem.lastFailedUpiRedeemCdkey : attemptedUpiRedeemCdkey,
                upiRedeemCdkey: authError ? attemptedUpiRedeemCdkey : '',
                redeemChannel,
              });
              await saveRedeemProgress({
                flowStage: 'upi-redeem-plus',
                email,
                redeemTotal: roundTotal,
                redeeming: !runtimeFlags.redeemStopRequested,
              });
              await addLog(
                authError
                  ? `${redeemChannelLabel} Free 分组 CDK 兑换：远端接口拒绝请求，已停止在 ${email}；请检查 External API Key 或后端外部兑换接口 CSRF/API Key 配置：${reason}`
                  : reachedIdealLock
                    ? `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 失败，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`
                    : reachedUpiDailyLimit
                      ? `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选：${reason}`
                    : `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 失败，释放 CDK 并切换下一个账号：${reason}`,
                authError ? 'error' : 'warn'
              );
              if (runtimeFlags.redeemStopRequested) {
                break;
              }
            }
          }

          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮结束，尝试 ${roundAttempted}/${roundTotal} 个账号。`,
            'info'
          );
          if (runtimeFlags.redeemStopRequested || stoppedForCdkey || roundNumber >= totalRoundLimit) {
            break;
          }
          roundQueue = failedEmailsThisRound
            .map((email) => normalizeResultItem(getLatestItem(email)))
            .filter((item) => isRetryableUpiRedeemRoundResultItem(item, totalRoundLimit, redeemChannel));
          if (!roundQueue.length) {
            break;
          }
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：准备第 ${roundNumber + 1}/${totalRoundLimit} 轮，仅处理上一轮失败账号 ${roundQueue.length} 个。`,
            'info'
          );
        }

          if (runtimeFlags.redeemStopRequested || !allowGroupContinuation) {
            break;
          }

          await reloadRedeemProgressState();
          let continuationQueue = buildContinuationQueue();
          if (!continuationQueue.length) {
            break;
          }

          let latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          if (!getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel).length) {
            const waitResult = await waitForContinuationCdkey(continuationQueue.length);
            await reloadRedeemProgressState();
            continuationQueue = buildContinuationQueue();
            latestRuntimeState = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            if (!waitResult.ok || !continuationQueue.length || !getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel).length) {
              const reasonText = waitResult.reason === 'timeout'
                ? `等待 CDK 回池超时，剩余 ${waitResult.pendingCount || continuationQueue.length} 个后续账号保持待兑换`
                : waitResult.reason === 'no-active-work'
                  ? `当前没有可用 CDK，且没有等待远端结果的 ${redeemChannelLabel} 任务，剩余账号保持待兑换`
                  : '没有可继续兑换的后续账号';
              await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${reasonText}。`, 'warn');
              break;
            }
          }

          continuationBatchNumber += 1;
          roundQueue = continuationQueue;
          rememberRedeemTotalTarget(roundQueue);
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：继续第 ${continuationBatchNumber} 批后续账号 ${roundQueue.length} 个。`,
            'info'
          );
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: runtimeFlags.redeemStopRequested ? '' : finishedAt,
          redeemStoppedAt: runtimeFlags.redeemStopRequested ? finishedAt : '',
          redeemTotal: Math.max(redeemCompleted, redeemTotalTarget, credentials.length),
          redeemCompleted,
          flowStage: runtimeFlags.redeemStopRequested ? currentResults.flowStage : '',
          flowStageEmail: runtimeFlags.redeemStopRequested ? currentResults.flowStageEmail : '',
          source,
        });
        await addLog(
          runtimeFlags.redeemStopRequested
            ? `${redeemChannelLabel} Free 分组 CDK 兑换：已停止，已尝试 ${stats.attempted} 次，等待 ${stats.submitted}，成功 ${stats.succeeded}，失败 ${stats.failed}。`
            : `${redeemChannelLabel} Free 分组 CDK 兑换：完成，已尝试 ${stats.attempted} 次，等待 ${stats.submitted}，成功 ${stats.succeeded}，失败 ${stats.failed}，跳过 ${stats.skipped}。`,
          runtimeFlags.redeemStopRequested ? 'warn' : 'ok'
        );
        return finalResults;
      } finally {
        runtimeFlags.redeemRunning = false;
      }
      } finally {
        runtimeFlags.redeemRunning = false;
      }
    }

    return {
      redeemUpiCredentialMembershipFree,
      redeemUpiCredentialMembershipFreeLegacy,
    };
  }

  return {
    createMembershipRedeemService,
  };
});
