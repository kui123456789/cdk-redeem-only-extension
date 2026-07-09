(function attachTrialEligibilityService(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageTrialEligibilityService = api;
})(typeof self !== 'undefined' ? self : globalThis, function createTrialEligibilityServiceModule(root) {
  function defaultNormalizeString(value = '') {
    return String(value || '').trim();
  }

  function defaultNormalizeEmail(value = '') {
    return defaultNormalizeString(value).toLowerCase();
  }

  function defaultNormalizeRetryCount(value = 0) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function createTrialEligibilityService(deps = {}) {
    const {
      addLog = async () => {},
      checkUpiRedeemAccessTokenEligibility = null,
      findBackupCredentialByEmail = async () => ({}),
      getChatGptSessionAccessToken = () => '',
      getErrorMessage = (error) => error?.message || String(error || '未知错误'),
      getState = async () => ({}),
      getStoredResults = async () => ({}),
      hasPasskeyCredential = () => false,
      isBatchRunning = () => false,
      isCdkeyRetryRunning = () => false,
      isRedeemRunning = () => false,
      loginAndReadAccessToken = async () => ({}),
      markCustomEmailPoolEntryTrialEligibility = null,
      markRegistrationEmailTrialIneligible = null,
      maskAccessToken = () => '',
      mergeCredentialAuthMaterial = (primary = {}) => primary,
      mergeCredentialsIntoResultItems = (items = []) => items,
      normalizeEmail = defaultNormalizeEmail,
      normalizeRedeemChannel = (channel = '') => (defaultNormalizeString(channel).toLowerCase() === 'ideal' ? 'ideal' : 'upi'),
      normalizeResultItem = (item = {}) => item,
      normalizeRetryCount = defaultNormalizeRetryCount,
      normalizeString = defaultNormalizeString,
      resolveInputCredentials = () => [],
      saveResults = async (results = {}) => results,
      setBatchRunning = () => {},
      setBatchStopRequested = () => {},
      throwIfMembershipStopRequested = () => {},
      upsertResultItem = (items = []) => items,
      upsertTrialEligibleFreeCredential = async () => ({}),
    } = deps;

    function getTrialEligibilityApiHelpers() {
      return root.MultiPageTrialEligibilityApi || {};
    }

    function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityChannelAllowed;
      if (typeof helper === 'function') {
        return helper(item, channel);
      }
      const normalizedChannel = normalizeRedeemChannel(channel);
      const field = normalizedChannel === 'ideal'
        ? 'idealChannelEligibilityStatus'
        : 'upiChannelEligibilityStatus';
      const status = normalizeString(item?.[field]).toLowerCase();
      return !status || status === 'unknown' || status === 'eligible';
    }

    function normalizeTrialEligibilityApiItem(item = {}) {
      const helper = getTrialEligibilityApiHelpers().normalizeTrialEligibilityApiItem;
      if (typeof helper === 'function') {
        return helper(item);
      }
      return {
        trialEligibilityStatus: 'failed',
        trialEligibilityReason: '资格检查适配器未加载。',
        trialEligibilityRetryable: true,
        trialEligibilityTransientFailure: true,
      };
    }

    function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityAccountIneligibleDecision;
      return typeof helper === 'function'
        ? helper(decision)
        : normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'ineligible';
    }

    function buildTrialEligibilityResultPatch(decision = {}) {
      const helper = getTrialEligibilityApiHelpers().buildTrialEligibilityResultPatch;
      return typeof helper === 'function'
        ? helper(decision)
        : {
            trialEligibilityStatus: normalizeString(decision.trialEligibilityStatus),
            trialEligibilityReason: normalizeString(decision.trialEligibilityReason),
            trialEligibilityRetryable: decision.trialEligibilityRetryable === true,
            trialEligibilityTransientFailure: decision.trialEligibilityTransientFailure === true,
          };
    }

    function isUpiTrialIneligibleError(error) {
      const decisionStatus = normalizeString(error?.trialEligibilityDecision?.trialEligibilityStatus).toLowerCase();
      if (decisionStatus) {
        return decisionStatus === 'ineligible';
      }
      const message = getErrorMessage(error);
      return /^UPI_ACCOUNT_INELIGIBLE::/i.test(normalizeString(error?.message || error))
        || /账号无资格|无试用资格|没有试用资格|无资格|not eligible|ineligible/i.test(message);
    }

    async function checkUpiCredentialMembershipTrialEligibility(input = {}) {
      if (isBatchRunning() || isRedeemRunning() || isCdkeyRetryRunning()) {
        throw new Error('UPI 账号核验/兑换正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemAccessTokenEligibility !== 'function') {
        throw new Error('UPI 试用资格检查能力尚未接入。');
      }

      const requestedCredentials = resolveInputCredentials(input)
        .filter((credential) => credential.email);
      const source = normalizeString(input.source || 'manual-trial-eligibility-check');
      const emailPoolOnly = input.emailPoolOnly === true || input.updateCustomEmailPoolEntry === true || source === 'custom-email-pool-trial-eligibility-check';
      setBatchRunning(true);
      setBatchStopRequested(false);
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      let items = emailPoolOnly ? (Array.isArray(currentResults.items) ? currentResults.items : []) : mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const eligible = [];
      const ineligible = [];
      const retryable = [];
      const failed = [];
      const skipped = [];

      const saveProgress = async (stage = 'trial-eligibility', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: source || currentResults.source,
          total: requestedCredentials.length,
          completed: eligible.length + ineligible.length + retryable.length + failed.length + skipped.length,
        });
      };

      const handleDecisionForCredential = async (credential = {}, decision = {}, accessToken = '', checkedAt = new Date().toISOString()) => {
        const email = normalizeEmail(credential.email);
        const patch = buildTrialEligibilityResultPatch(decision);
        const reason = normalizeString(patch.trialEligibilityReason || decision.trialEligibilityReason || '资格检查失败，可手动重试');
        const syncCustomEmailPoolEntry = async (status = '', extra = {}) => {
          if (typeof markCustomEmailPoolEntryTrialEligibility !== 'function') return null;
          return markCustomEmailPoolEntryTrialEligibility({ ...(await getState()), ...credential, email }, {
            email,
            status,
            reason: extra.reason || reason,
            reasonCode: patch.trialEligibilityReasonCode || decision.trialEligibilityReasonCode || '',
            checkedAt,
            accessToken: normalizeString(extra.accessToken || accessToken || credential.accessToken),
            accessTokenMasked: maskAccessToken(extra.accessToken || accessToken || credential.accessToken),
            accessTokenUpdatedAt: checkedAt,
            trialEligibilityRetryable: extra.trialEligibilityRetryable === true,
            trialEligibilityTransientFailure: extra.trialEligibilityTransientFailure === true,
            markUsed: extra.markUsed === true,
            clearSelectedEmail: extra.clearSelectedEmail === true || extra.markUsed === true || status === 'ineligible',
            logPrefix: extra.logPrefix || '邮箱池试用资格检查',
            level: extra.level || (status === 'eligible' ? 'ok' : 'warn'),
          });
        };
        if (patch.trialEligibilityStatus === 'eligible') {
          currentResults = await upsertTrialEligibleFreeCredential({
            source,
            email,
            credential,
            accessToken: normalizeString(accessToken || credential.accessToken),
            accessTokenMasked: maskAccessToken(accessToken || credential.accessToken),
            checkedAt,
            reason: reason || '账号有试用资格',
            ...patch,
            trialEligibilityRetryCount: 0,
            trialEligibilityLastError: '',
          });
          items = currentResults.items;
          if (emailPoolOnly || input.updateCustomEmailPoolEntry === true) {
            await syncCustomEmailPoolEntry('eligible', { accessToken: normalizeString(accessToken || credential.accessToken), markUsed: true, reason: reason || '账号有试用资格', level: 'ok' });
          }
          eligible.push({ email, reason: reason || '账号有试用资格' });
          await addLog(`UPI 试用资格手动检查：${email} -> 有试用资格。`, 'ok');
          return;
        }
        if (isTrialEligibilityAccountIneligibleDecision({ ...decision, ...patch })) {
          if (emailPoolOnly) {
            await syncCustomEmailPoolEntry('ineligible', { accessToken: normalizeString(accessToken || credential.accessToken), markUsed: true, clearSelectedEmail: true, reason: reason || '账号无试用资格', level: 'warn' });
            ineligible.push({ email, reason: reason || '账号无试用资格' });
            await addLog(`邮箱池试用资格检查：${email} -> 无试用资格，仅更新邮箱池，不进入 Free：${reason || 'not-eligible'}`, 'warn');
            return;
          }
          if (typeof markRegistrationEmailTrialIneligible === 'function') {
            await markRegistrationEmailTrialIneligible({
              ...(await getState()),
              ...credential,
              email,
            }, {
              email,
              reason: reason || '账号无试用资格',
              checkedAt,
              logPrefix: 'UPI 试用资格手动检查',
              level: 'warn',
            });
          }
          items = upsertResultItem(items, {
            ...credential,
            ...patch,
            status: 'free',
            planType: 'free',
            accessToken: normalizeString(accessToken || credential.accessToken),
            accessTokenMasked: maskAccessToken(accessToken || credential.accessToken),
            accessTokenUpdatedAt: checkedAt,
            checkedAt,
            reason: reason || '账号无试用资格',
            redeemStatus: 'blocked',
            redeemReason: `账号无试用资格：${reason || 'not-eligible'}`,
            trialEligibilityStatus: 'ineligible',
            trialEligibilityReason: reason || '账号无试用资格',
            trialEligibilityCheckedAt: checkedAt,
            trialEligibilityRetryable: false,
            trialEligibilityLastError: '',
          });
          ineligible.push({ email, reason: reason || '账号无试用资格' });
          await addLog(`UPI 试用资格手动检查：${email} -> 无试用资格：${reason || 'not-eligible'}`, 'warn');
          return;
        }

        if (emailPoolOnly) {
          await syncCustomEmailPoolEntry('failed', {
            accessToken: normalizeString(accessToken || credential.accessToken),
            reason,
            trialEligibilityRetryable: true,
            trialEligibilityTransientFailure: patch.trialEligibilityTransientFailure === true || patch.trialEligibilityRetryable === true,
            level: 'warn',
          });
          retryable.push({ email, reason });
          await addLog(`邮箱池试用资格检查：${email} -> 检查失败，可手动重试，仅更新邮箱池：${reason}`, 'warn');
          return;
        }

        items = upsertResultItem(items, {
          ...credential,
          ...patch,
          status: 'free',
          planType: 'free',
          checkedAt,
          reason,
          trialEligibilityStatus: 'failed',
          trialEligibilityReason: reason,
          trialEligibilityCheckedAt: checkedAt,
          trialEligibilityRetryable: true,
          trialEligibilityTransientFailure: patch.trialEligibilityTransientFailure === true || patch.trialEligibilityRetryable === true,
          trialEligibilityRetryCount: normalizeRetryCount(credential.trialEligibilityRetryCount) + 1,
          trialEligibilityLastError: reason,
        });
        retryable.push({ email, reason });
        await addLog(`UPI 试用资格手动检查：${email} -> 检查失败，可手动重试：${reason}`, 'warn');
      };

      try {
        if (!requestedCredentials.length) {
          const emptyResults = await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: startedAt,
            finishedAt: startedAt,
            flowStage: '',
            flowStageEmail: '',
          });
          return { results: emptyResults, eligible, ineligible, retryable, failed, skipped };
        }

        await addLog(`UPI 试用资格手动检查：开始处理 ${requestedCredentials.length} 个账号。`, 'info');
        const runtimeState = {
          ...(await getState()),
          ...(input.settings || {}),
        };

        for (const rawCredential of requestedCredentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(rawCredential.email);
          if (!email) {
            continue;
          }
          const checkedAt = new Date().toISOString();
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const backupCredential = await findBackupCredentialByEmail(email).catch(() => null);
          let credential = normalizeResultItem(mergeCredentialAuthMaterial({
            ...existingItem,
            ...rawCredential,
            email,
            status: 'free',
            planType: 'free',
            checkedAt,
          }, backupCredential || {}));

          const accessTokenFromCredential = normalizeString(credential.accessToken || credential.token || credential.access_token);
          const hasLoginMaterial = Boolean(
            accessTokenFromCredential
            || credential.password
            || credential.gptPassword
            || (typeof hasPasskeyCredential === 'function' && hasPasskeyCredential(credential))
            || (credential.no2faFreeRoute === true && credential.verificationUrl)
          );
          if (!hasLoginMaterial) {
            const reason = '缺少 AT、GPT 密码、Passkey 或免 2FA 取件链接，无法检查资格';
            skipped.push({ email, reason });
            if (emailPoolOnly) {
              if (typeof markCustomEmailPoolEntryTrialEligibility === 'function') {
                await markCustomEmailPoolEntryTrialEligibility({ ...(await getState()), ...credential, email }, {
                  email,
                  status: 'failed',
                  reason,
                  checkedAt,
                  trialEligibilityRetryable: true,
                  clearSelectedEmail: false,
                  logPrefix: '邮箱池试用资格检查',
                  level: 'warn',
                });
              }
              await saveProgress('trial-eligibility', email);
              await addLog(`邮箱池试用资格检查：${email} -> 跳过：${reason}`, 'warn');
              continue;
            }
            items = upsertResultItem(items, {
              ...credential,
              status: 'free',
              planType: 'free',
              checkedAt,
              reason,
              trialEligibilityStatus: 'skipped',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
              trialEligibilityRetryable: true,
              trialEligibilityLastError: reason,
            });
            await saveProgress('trial-eligibility', email);
            await addLog(`UPI 试用资格手动检查：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          let resolvedAccessToken = accessTokenFromCredential;
          try {
            await saveProgress(accessTokenFromCredential ? 'trial-eligibility' : 'token', email);
            let accessToken = resolvedAccessToken;
            let session = null;
            if (!accessToken) {
              session = await loginAndReadAccessToken(credential, {
                ...runtimeState,
                ...currentResults,
              }, {
                onStage: async (stage) => saveProgress(stage, email),
                throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
              });
              accessToken = normalizeString(session.accessToken || getChatGptSessionAccessToken(session.session || session));
            }
            if (!accessToken) {
              throw new Error('未读取到 ChatGPT accessToken，无法检查资格。');
            }
            resolvedAccessToken = accessToken;
            credential = normalizeResultItem({
              ...credential,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            const response = await checkUpiRedeemAccessTokenEligibility({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential,
              session: session?.session || session || {},
              accessToken,
              cdkey: input.cdkey,
              expectedEmail: email,
            });
            const decision = response?.item?.trialEligibilityDecision
              || response?.trialEligibilityDecision
              || normalizeTrialEligibilityApiItem(response?.item || response || {});
            await handleDecisionForCredential(credential, decision, accessToken, checkedAt);
            await saveProgress('subscription-check', email);
          } catch (error) {
            const explicitIneligible = /^UPI_ACCOUNT_INELIGIBLE::/i.test(normalizeString(error?.message || error));
            const decision = error?.trialEligibilityDecision
              || (explicitIneligible
                ? {
                    trialEligibilityStatus: 'ineligible',
                    trialEligibilityReason: getErrorMessage(error).replace(/^UPI_ACCOUNT_INELIGIBLE::/i, ''),
                  }
                : null);
            if (decision) {
              await handleDecisionForCredential(credential, decision, resolvedAccessToken || credential.accessToken, checkedAt);
              await saveProgress('subscription-check', email);
              continue;
            }
            const reason = getErrorMessage(error) || '资格检查失败，可手动重试';
            const retryableCheck = !explicitIneligible;
            (retryableCheck ? retryable : failed).push({ email, reason });
            if (emailPoolOnly) {
              if (typeof markCustomEmailPoolEntryTrialEligibility === 'function') {
                await markCustomEmailPoolEntryTrialEligibility({ ...(await getState()), ...credential, email }, {
                  email,
                  status: 'failed',
                  reason,
                  checkedAt,
                  accessToken: credential.accessToken,
                  accessTokenMasked: maskAccessToken(credential.accessToken),
                  accessTokenUpdatedAt: checkedAt,
                  trialEligibilityRetryable: retryableCheck,
                  trialEligibilityTransientFailure: retryableCheck,
                  clearSelectedEmail: false,
                  logPrefix: '邮箱池试用资格检查',
                  level: retryableCheck ? 'warn' : 'error',
                });
              }
              await saveProgress('subscription-check', email);
              await addLog(`邮箱池试用资格检查：${email} -> 检查失败，账号保留在邮箱池：${reason}`, retryableCheck ? 'warn' : 'error');
              continue;
            }
            items = upsertResultItem(items, {
              ...credential,
              status: 'free',
              planType: 'free',
              checkedAt,
              reason,
              trialEligibilityStatus: 'failed',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
              trialEligibilityRetryable: retryableCheck,
              trialEligibilityTransientFailure: retryableCheck,
              trialEligibilityRetryCount: normalizeRetryCount(credential.trialEligibilityRetryCount) + 1,
              trialEligibilityLastError: reason,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI 试用资格手动检查：${email} -> 检查失败，保留账号：${reason}`, retryableCheck ? 'warn' : 'error');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: source || currentResults.source,
          total: requestedCredentials.length,
          completed: eligible.length + ineligible.length + retryable.length + failed.length + skipped.length,
          trialEligibilitySummary: {
            checkedAt: finishedAt,
            kept: eligible,
            skipped,
            failed: [...retryable, ...failed],
            deletedEmails: [],
            ineligibleEmails: ineligible.map((item) => item.email),
            eligibleCount: eligible.length,
            skippedCount: skipped.length,
            failedCount: retryable.length + failed.length,
            deletedCount: 0,
            ineligibleCount: ineligible.length,
          },
        });
        await addLog(
          `UPI 试用资格手动检查完成：有资格 ${eligible.length}，无资格 ${ineligible.length}，可重试 ${retryable.length}，失败 ${failed.length}，跳过 ${skipped.length}。`,
          'ok'
        );
        return { results: finalResults, eligible, ineligible, retryable, failed, skipped };
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
          source: source || currentResults.source,
        }).catch(() => null);
        throw error;
      } finally {
        setBatchRunning(false);
      }
    }

    return {
      buildTrialEligibilityResultPatch,
      checkUpiCredentialMembershipTrialEligibility,
      isTrialEligibilityAccountIneligibleDecision,
      isTrialEligibilityChannelAllowed,
      isUpiTrialIneligibleError,
      normalizeTrialEligibilityApiItem,
    };
  }

  return {
    createTrialEligibilityService,
  };
});
