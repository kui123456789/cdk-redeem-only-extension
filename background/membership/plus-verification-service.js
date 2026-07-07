(function attachMembershipPlusVerificationService(root, factory) {
  const api = factory();
  root.MultiPageMembershipPlusVerificationService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipPlusVerificationServiceModule() {
  function createPlusVerificationService(deps = {}) {
    const {
      addLog,
      buildFreeMembershipOverrideFields,
      checkCredentialPaidSubscription,
      checkUpiRedeemSubscriptionStatuses,
      getErrorMessage,
      getState,
      getStoredResults,
      isMembershipStopError,
      isPaidPlanType,
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

    async function identifyUpiCredentialMembershipFreePlus(input = {}) {
      if (runtimeFlags.batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (runtimeFlags.redeemRunning || runtimeFlags.cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        throw new Error('UPI 会员状态查询能力尚未接入。');
      }

      runtimeFlags.batchRunning = true;
      runtimeFlags.batchStopRequested = false;
      const startedAt = new Date().toISOString();
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
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => credential.email && credential.status === 'free' && credential.accessToken);
      const paid = [];
      const free = [];
      const failed = [];
      const skipped = [];
      const source = normalizeString(input.source || currentResults.source || 'free-identify-plus');

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
          completed: paid.length + free.length + failed.length + skipped.length,
        });
      };

      try {
        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: finishedAt,
              finishedAt,
              flowStage: '',
              flowStageEmail: '',
              source,
            }),
            paid,
            free,
            failed,
            skipped,
          };
        }

        const runtimeState = normalizeSubscriptionRuntimeState({
          ...(typeof getState === 'function' ? await getState().catch(() => ({})) : {}),
          ...(input.settings || {}),
        });
        await addLog(`UPI Free 分组识别 Plus：开始用已保存 AT 查询 ${credentials.length} 个账号。`, 'info');

        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
          });
          const accessToken = normalizeString(activeCredential.accessToken);
          const checkedAt = new Date().toISOString();
          if (!accessToken) {
            const reason = '缺少 AT，请先点击“一键补充 AT”。';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          try {
            await saveProgress('subscription-check', email);
            const subscription = await checkCredentialPaidSubscription({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              accessToken,
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const reason = subscription.reason || '订阅 API 已返回会员状态';
            if (subscription.status === 'paid' && isPaidPlanType(subscription.planType)) {
              const shouldMarkRedeemSuccess = Boolean(
                normalizeString(activeCredential.upiRedeemCdkey)
                || normalizeString(activeCredential.redeemAttemptedAt)
                || normalizeString(activeCredential.redeemStatus).toLowerCase() === 'submitted'
              );
              paid.push({ email, planType: subscription.planType, reason });
              items = upsertResultItem(items, {
                ...activeCredential,
                status: 'paid',
                planType: subscription.planType,
                reason,
                checkedAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
                upiRedeemSubscriptionCheckedAt: checkedAt,
                redeemStatus: shouldMarkRedeemSuccess ? 'success' : '',
                redeemReason: shouldMarkRedeemSuccess ? '订阅 API 已确认会员' : '',
                redeemFailureCount: 0,
                redeemLastFailedAt: '',
                redeemSuccessAt: shouldMarkRedeemSuccess ? checkedAt : activeCredential.redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveProgress('subscription-check', email);
              await addLog(`UPI Free 分组识别 Plus：${email} -> 已确认 ${subscription.planType}，移入 Plus 组。`, 'ok');
              continue;
            }

            free.push({ email, planType: subscription.planType || 'free', reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              ...buildFreeMembershipOverrideFields(checkedAt),
              reason,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 仍为 Free：${reason}`, 'info');
          } catch (error) {
            if (isMembershipStopError(error)) {
              runtimeFlags.batchStopRequested = true;
              break;
            }
            const reason = getErrorMessage(error) || 'Plus 识别失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason: `Plus 识别失败：${reason}`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt: runtimeFlags.batchStopRequested ? currentResults.finishedAt : finishedAt,
          stoppedAt: runtimeFlags.batchStopRequested ? finishedAt : currentResults.stoppedAt,
          flowStage: runtimeFlags.batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: runtimeFlags.batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: items.length,
          completed: items.length,
        });
        await addLog(
          runtimeFlags.batchStopRequested
            ? `UPI Free 分组识别 Plus：已停止，已处理 ${paid.length + free.length + failed.length + skipped.length}/${credentials.length}。`
            : `UPI Free 分组识别 Plus：完成，Plus ${paid.length}，仍 Free ${free.length}，跳过 ${skipped.length}，失败 ${failed.length}。`,
          runtimeFlags.batchStopRequested ? 'warn' : 'ok'
        );
        return {
          results: finalResults,
          paid,
          free,
          failed,
          skipped,
        };
      } catch (error) {
        const stoppedAt = new Date().toISOString();
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: stoppedAt,
          stoppedAt,
          flowStage: currentResults.flowStage,
          flowStageEmail: currentResults.flowStageEmail,
          source,
        }).catch(() => null);
        throw error;
      } finally {
        runtimeFlags.batchRunning = false;
      }
    }

    async function verifyUpiCredentialMembershipPlus(input = {}) {
      if (runtimeFlags.batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (runtimeFlags.redeemRunning || runtimeFlags.cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        throw new Error('UPI 会员状态查询能力尚未接入。');
      }

      runtimeFlags.batchRunning = true;
      runtimeFlags.batchStopRequested = false;
      const startedAt = new Date().toISOString();
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
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'paid' }))
        .filter((credential) => credential.email && credential.status === 'paid' && credential.accessToken);
      const paid = [];
      const free = [];
      const failed = [];
      const skipped = [];
      const source = normalizeString(input.source || currentResults.source || 'plus-verify');

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
          completed: paid.length + free.length + failed.length + skipped.length,
        });
      };

      try {
        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: finishedAt,
              finishedAt,
              flowStage: '',
              flowStageEmail: '',
              source,
            }),
            paid,
            free,
            failed,
            skipped,
          };
        }

        const runtimeState = normalizeSubscriptionRuntimeState({
          ...(typeof getState === 'function' ? await getState().catch(() => ({})) : {}),
          ...(input.settings || {}),
        });
        await addLog(`UPI Plus 分组验证：开始用已保存 AT 查询 ${credentials.length} 个账号。`, 'info');

        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'paid',
            planType: credential.planType || existingItem.planType || 'plus',
          });
          const accessToken = normalizeString(activeCredential.accessToken);
          const checkedAt = new Date().toISOString();
          if (!accessToken) {
            const reason = '缺少 AT，无法验证 Plus。';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'paid',
              reason,
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          try {
            await saveProgress('subscription-check', email);
            const subscription = await checkCredentialPaidSubscription({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              accessToken,
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const reason = subscription.reason || '订阅 API 已返回会员状态';
            if (subscription.status === 'paid' && isPaidPlanType(subscription.planType)) {
              paid.push({ email, planType: subscription.planType, reason });
              items = upsertResultItem(items, {
                ...activeCredential,
                status: 'paid',
                planType: subscription.planType,
                reason,
                checkedAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
                upiRedeemSubscriptionCheckedAt: checkedAt,
                redeemStatus: activeCredential.redeemStatus,
                redeemReason: activeCredential.redeemReason,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveProgress('subscription-check', email);
              await addLog(`UPI Plus 分组验证：${email} -> 已确认 ${subscription.planType}。`, 'ok');
              continue;
            }

            free.push({ email, planType: subscription.planType || 'free', reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              ...buildFreeMembershipOverrideFields(checkedAt),
              reason,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 当前不是 Plus，已移回 Free：${reason}`, 'warn');
          } catch (error) {
            if (isMembershipStopError(error)) {
              runtimeFlags.batchStopRequested = true;
              break;
            }
            const reason = getErrorMessage(error) || 'Plus 验证失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'paid',
              reason: `Plus 验证失败：${reason}`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt: runtimeFlags.batchStopRequested ? currentResults.finishedAt : finishedAt,
          stoppedAt: runtimeFlags.batchStopRequested ? finishedAt : currentResults.stoppedAt,
          flowStage: runtimeFlags.batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: runtimeFlags.batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: items.length,
          completed: items.length,
        });
        await addLog(
          runtimeFlags.batchStopRequested
            ? `UPI Plus 分组验证：已停止，已处理 ${paid.length + free.length + failed.length + skipped.length}/${credentials.length}。`
            : `UPI Plus 分组验证：完成，仍 Plus ${paid.length}，转 Free ${free.length}，跳过 ${skipped.length}，失败 ${failed.length}。`,
          runtimeFlags.batchStopRequested ? 'warn' : 'ok'
        );
        return {
          results: finalResults,
          paid,
          free,
          failed,
          skipped,
        };
      } catch (error) {
        const stoppedAt = new Date().toISOString();
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: stoppedAt,
          stoppedAt,
          flowStage: currentResults.flowStage,
          flowStageEmail: currentResults.flowStageEmail,
          source,
        }).catch(() => null);
        throw error;
      } finally {
        runtimeFlags.batchRunning = false;
      }
    }

    return {
      identifyUpiCredentialMembershipFreePlus,
      verifyUpiCredentialMembershipPlus,
    };
  }

  return {
    createPlusVerificationService,
  };
});
