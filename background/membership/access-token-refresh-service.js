(function attachMembershipAccessTokenRefreshService(root, factory) {
  const api = factory();
  root.MultiPageMembershipAccessTokenRefreshService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipAccessTokenRefreshServiceModule() {
  function createMembershipAccessTokenRefreshService(deps = {}) {
    const {
      addLog,
      buildMissingAccessTokenRefreshMaterialReason = () => '',
      checkCredentialPaidSubscription,
      getAccessTokenOwnership = () => ({ verifiable: false, matches: false }),
      getChatGptSessionAccessToken = () => '',
      getErrorMessage,
      getState,
      getStoredResults,
      hasPasskeyCredential = () => false,
      isAccountDeactivatedError = () => false,
      isAccessTokenInvalidMembershipError = () => false,
      isMembershipStopError,
      loginAndReadAccessToken = async () => ({}),
      maskAccessToken,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeResultItem,
      normalizeString,
      normalizeSubscriptionRuntimeState,
      resolveInputCredentials,
      runtimeFlags,
      saveResults,
      throwIfMembershipStopRequested,
      upsertResultItem,
    } = deps;

    async function checkCredentialPaidSubscriptionWithAccessTokenRefresh({
      state = {},
      credential = {},
      accessToken = '',
      onStage = async () => {},
      throwIfStopRequested = null,
    } = {}) {
      const token = normalizeString(accessToken);
      try {
        return {
          subscription: await checkCredentialPaidSubscription({
            state,
            credential,
            accessToken: token,
            throwIfStopRequested,
          }),
          accessToken: token,
          refreshed: false,
        };
      } catch (error) {
        if (isMembershipStopError(error) || !isAccessTokenInvalidMembershipError(error)) {
          throw error;
        }

        const missingMaterial = buildMissingAccessTokenRefreshMaterialReason(credential);
        if (missingMaterial && !hasPasskeyCredential(credential)) {
          const blockedError = new Error(`已保存 AT 无效或过期，且${missingMaterial}，无法重新登录刷新 AT`);
          blockedError.accessTokenInvalid = true;
          blockedError.accessTokenRefreshBlocked = true;
          throw blockedError;
        }

        await addLog(`AT 批量检查：${credential.email} -> 已保存 AT 无效或过期，开始重新登录刷新。`, 'warn');
        try {
          await onStage('login');
          const session = await loginAndReadAccessToken(credential, state, {
            onStage,
            throwIfStopRequested,
          });
          const refreshedToken = normalizeString(
            session?.accessToken
            || getChatGptSessionAccessToken(session?.session || session)
          );
          if (!refreshedToken) {
            throw new Error('重新登录后未读取到 accessToken');
          }
          const ownership = getAccessTokenOwnership(refreshedToken, credential.email);
          if (ownership.verifiable && !ownership.matches) {
            throw new Error(`新 AT 属于 ${ownership.tokenEmail || '其他账号'}，不是当前目标 ${ownership.targetEmail || credential.email}`);
          }
          await onStage('subscription-check');
          const subscription = await checkCredentialPaidSubscription({
            state,
            credential,
            accessToken: refreshedToken,
            throwIfStopRequested,
          });
          return {
            subscription,
            accessToken: refreshedToken,
            refreshed: true,
          };
        } catch (refreshError) {
          const accountDeactivated = isAccountDeactivatedError(refreshError);
          refreshError.accountDeactivated = accountDeactivated;
          refreshError.accessTokenInvalid = !accountDeactivated;
          refreshError.accessTokenRefreshAttempted = true;
          throw refreshError;
        }
      }
    }

    async function refreshUpiCredentialMembershipAccessTokens(input = {}) {
      if (runtimeFlags.batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (runtimeFlags.redeemRunning || runtimeFlags.cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }

      runtimeFlags.batchRunning = true;
      runtimeFlags.batchStopRequested = false;
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items;
      const credentials = rawCandidates
        .map((credential) => normalizeResultItem(credential))
        .filter((credential) => credential.email && credential.accessToken);
      const valid = [];
      const refreshed = [];
      const failed = [];
      const skipped = [];
      const source = normalizeString(input.source || currentResults.source || 'refresh-invalid-at');

      const saveProgress = async (stage = 'subscription-check', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source,
          total: credentials.length,
          completed: valid.length + refreshed.length + failed.length + skipped.length,
        });
      };

      try {
        const runtimeState = normalizeSubscriptionRuntimeState({
          ...(typeof getState === 'function' ? await getState().catch(() => ({})) : {}),
          ...(input.settings || {}),
        });
        await addLog(`AT 批量检查：开始处理 ${credentials.length} 个账号。`, 'info');

        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({ ...existingItem, ...credential, email });
          const checkedAt = new Date().toISOString();
          try {
            await saveProgress('subscription-check', email);
            const checked = await checkCredentialPaidSubscriptionWithAccessTokenRefresh({
              state: { ...runtimeState, ...currentResults },
              credential: activeCredential,
              accessToken: activeCredential.accessToken,
              onStage: async (stage) => saveProgress(stage, email),
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const nextAccessToken = normalizeString(checked.accessToken);
            const nextItem = normalizeResultItem({
              ...activeCredential,
              accessToken: nextAccessToken,
              accessTokenMasked: maskAccessToken(nextAccessToken),
              accessTokenUpdatedAt: checked.refreshed
                ? checkedAt
                : (activeCredential.accessTokenUpdatedAt || checkedAt),
              checkedAt: activeCredential.checkedAt || checkedAt,
              reason: checked.refreshed ? 'AT 已刷新并验证有效' : activeCredential.reason,
            });
            items = upsertResultItem(items, nextItem);
            (checked.refreshed ? refreshed : valid).push({
              email,
              accessTokenMasked: maskAccessToken(nextAccessToken),
              checkedAt,
            });
            await addLog(`AT 批量检查：${email} -> ${checked.refreshed ? '已刷新并验证有效' : '现有 AT 有效'}。`, 'ok');
          } catch (error) {
            if (isMembershipStopError(error)) {
              runtimeFlags.batchStopRequested = true;
              break;
            }
            const accountDeactivated = error?.accountDeactivated === true || isAccountDeactivatedError(error);
            const tokenInvalid = !accountDeactivated && (error?.accessTokenInvalid === true || isAccessTokenInvalidMembershipError(error));
            const reason = getErrorMessage(error) || 'AT 检查失败';
            failed.push({ email, reason, tokenInvalid, accountDeactivated });
            items = upsertResultItem(items, normalizeResultItem({
              ...activeCredential,
              ...(accountDeactivated ? { status: 'failed' } : {}),
              reason: `AT 检查失败：${reason}`,
              ...((tokenInvalid || accountDeactivated) ? {
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: '',
              } : {}),
            }));
            await addLog(`AT 批量检查：${email} -> 失败：${reason}`, 'warn');
          }
          await saveProgress('subscription-check', email);
        }

        const finishedAt = new Date().toISOString();
        const results = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt: runtimeFlags.batchStopRequested ? currentResults.finishedAt : finishedAt,
          stoppedAt: runtimeFlags.batchStopRequested ? finishedAt : currentResults.stoppedAt,
          flowStage: runtimeFlags.batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: runtimeFlags.batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: credentials.length,
          completed: valid.length + refreshed.length + failed.length + skipped.length,
        });
        await addLog(
          `AT 批量检查：完成，现有有效 ${valid.length}，刷新成功 ${refreshed.length}，失败 ${failed.length}。`,
          runtimeFlags.batchStopRequested ? 'warn' : 'ok'
        );
        return { results, valid, refreshed, failed, skipped };
      } finally {
        runtimeFlags.batchRunning = false;
      }
    }

    return { refreshUpiCredentialMembershipAccessTokens };
  }

  return { createMembershipAccessTokenRefreshService };
});
