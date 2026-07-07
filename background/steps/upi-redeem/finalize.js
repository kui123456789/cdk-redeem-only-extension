(function attachMultiPageUpiRedeemFinalize(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageUpiRedeemFinalize = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageUpiRedeemFinalizeModule() {
  function createUpiRedeemFinalize(context = {}) {
    const constants = context.constants || {};
    const { UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX, CHATGPT_SESSION_API_URL, REDEEM_CHANNEL_FAILURE_LIMIT } = constants;
    const chrome = context.chrome;
    const now = context.now;
    const setState = context.setState;
    const redeemUpiCredentialMembershipFree = context.redeemUpiCredentialMembershipFree;
    const throwIfStopped = context.throwIfStopped;
    const upsertTrialEligibleFreeCredential = context.upsertTrialEligibleFreeCredential;
    const completeNodeFromBackground = context.completeNodeFromBackground;
    const markCurrentRegistrationAccountUsed = context.markCurrentRegistrationAccountUsed;
    const appendAccountRunRecord = context.appendAccountRunRecord;

    const normalizeString = (...args) => context.normalizeString(...args);
    const normalizeRedeemChannel = (...args) => context.normalizeRedeemChannel(...args);
    const getRedeemChannelLabel = (...args) => context.getRedeemChannelLabel(...args);
    const getRedeemChannelFailureCount = (...args) => context.getRedeemChannelFailureCount(...args);
    const isRedeemChannelDailyLimitReason = (...args) => context.isRedeemChannelDailyLimitReason(...args);
    const isRedeemAccountLocked = (...args) => context.isRedeemAccountLocked(...args);
    const buildRedeemChannelFailurePatch = (...args) => context.buildRedeemChannelFailurePatch(...args);
    const shouldRedeemItemUseChannel = (...args) => context.shouldRedeemItemUseChannel(...args);
    const getRedeemChannelSkipReason = (...args) => context.getRedeemChannelSkipReason(...args);
    const getRedeemChannelUsage = (...args) => context.getRedeemChannelUsage(...args);
    const getAvailableCdkeysForChannel = (...args) => context.getAvailableCdkeysForChannel(...args);
    const maskAccessToken = (...args) => context.maskAccessToken(...args);
    const toIsoTimestamp = (...args) => context.toIsoTimestamp(...args);
    const getUpiRedeemStateValue = (...args) => context.getUpiRedeemStateValue(...args);
    const getErrorMessage = (...args) => context.getErrorMessage(...args);
    const addStepLog = (...args) => context.addStepLog(...args);
    const resolveVisibleStep = (...args) => context.resolveVisibleStep(...args);
    const shouldMarkRegistrationAccountUsedAfterRedeem = (...args) => context.shouldMarkRegistrationAccountUsedAfterRedeem(...args);
    const getMergedState = (...args) => context.getMergedState(...args);
    const buildUpiRedeemApiUrl = (...args) => context.buildUpiRedeemApiUrl(...args);
    const buildUPIAccessTokenCheckApiUrl = (...args) => context.buildUPIAccessTokenCheckApiUrl(...args);
    const resolveUpiRedeemClientId = (...args) => context.resolveUpiRedeemClientId(...args);
    const parsePoolEntryEmail = (...args) => context.parsePoolEntryEmail(...args);
    const resolveCurrentRedeemEmail = (...args) => context.resolveCurrentRedeemEmail(...args);
    const getChatGptSessionAccessToken = (...args) => context.getChatGptSessionAccessToken(...args);
    const getChatGptSessionFieldCount = (...args) => context.getChatGptSessionFieldCount(...args);
    const buildCurrentUpiCredentialForMembership = (...args) => context.buildCurrentUpiCredentialForMembership(...args);
    const normalizeUpiRedeemCdkeyUsage = (...args) => context.normalizeUpiRedeemCdkeyUsage(...args);
    const pickFirstUnusedCdkey = (...args) => context.pickFirstUnusedCdkey(...args);
    const getAvailableRedeemCdkeys = (...args) => context.getAvailableRedeemCdkeys(...args);
    const countAvailableRedeemCdkeys = (...args) => context.countAvailableRedeemCdkeys(...args);
    const updateCdkeyUsage = (...args) => context.updateCdkeyUsage(...args);
    const reserveCdkeyForRedeemSubmission = (...args) => context.reserveCdkeyForRedeemSubmission(...args);
    const releaseCdkeyForUnacceptedSubmission = (...args) => context.releaseCdkeyForUnacceptedSubmission(...args);
    const normalizeSubscriptionPlanType = (...args) => context.normalizeSubscriptionPlanType(...args);
    const getPaidSubscriptionPlanLabel = (...args) => context.getPaidSubscriptionPlanLabel(...args);
    const resolveSessionTabId = (...args) => context.resolveSessionTabId(...args);
    const getResolvedSessionTab = (...args) => context.getResolvedSessionTab(...args);
    const readCurrentChatGptSession = (...args) => context.readCurrentChatGptSession(...args);
    const refreshCurrentChatGptSessionAndReadToken = (...args) => context.refreshCurrentChatGptSessionAndReadToken(...args);
    const isUpiAccessTokenExpiredError = (...args) => context.isUpiAccessTokenExpiredError(...args);
    const recordAccessTokenExpiredCdkeyAttempt = (...args) => context.recordAccessTokenExpiredCdkeyAttempt(...args);
    const normalizeUpiRedeemRemoteStatus = (...args) => context.normalizeUpiRedeemRemoteStatus(...args);
    const isApproveBlockedError = (...args) => context.isApproveBlockedError(...args);
    const isRetryableRemoteStatus = (...args) => context.isRetryableRemoteStatus(...args);
    const isUpiRedeemDuplicateCdkeyError = (...args) => context.isUpiRedeemDuplicateCdkeyError(...args);
    const isUpiRedeemNotAcceptedError = (...args) => context.isUpiRedeemNotAcceptedError(...args);
    const isUpiAccountIneligibleError = (...args) => context.isUpiAccountIneligibleError(...args);
    const checkUPIAccessTokenEligibility = (...args) => context.checkUPIAccessTokenEligibility(...args);
    const postUpiRedeem = (...args) => context.postUpiRedeem(...args);
    const releaseCdkeyForApproveBlocked = (...args) => context.releaseCdkeyForApproveBlocked(...args);
    const confirmCurrentRedeemPaidSubscription = (...args) => context.confirmCurrentRedeemPaidSubscription(...args);
    const recordCdkeySubscriptionConfirmation = (...args) => context.recordCdkeySubscriptionConfirmation(...args);
    const applyPaidSubscriptionCleanup = (...args) => context.applyPaidSubscriptionCleanup(...args);
    const checkRegistrationUpiTrialEligibility = (...args) => context.checkRegistrationUpiTrialEligibility(...args);
    const redeemUpiCredentialWithAccessToken = (...args) => context.redeemUpiCredentialWithAccessToken(...args);
    const findMembershipResultItem = (...args) => context.findMembershipResultItem(...args);
    const readPersistedUpiCredentialMembershipResults = (...args) => context.readPersistedUpiCredentialMembershipResults(...args);
    const waitForSubmittedAutoRedeemRemoteRefresh = (...args) => context.waitForSubmittedAutoRedeemRemoteRefresh(...args);
    const isFlowStoppedError = (...args) => context.isFlowStoppedError(...args);
    const shouldCountAutoRedeemFailure = (...args) => context.shouldCountAutoRedeemFailure(...args);
    const writeTrialEligibleFreeRedeemState = (...args) => context.writeTrialEligibleFreeRedeemState(...args);

        function isAutoRedeemResultInFlight(item = {}) {
          return [
            item?.redeemStatus,
            item?.remoteStatus,
            item?.remoteMessage,
          ].some((value) => [
            'pending',
            'pending_token',
            'pending_dispatch',
            'dispatched',
            'dispatching',
            'running',
            'redeeming',
            'processing',
            'in_progress',
            'queued',
            'accepted',
            'submitted',
          ].includes(normalizeUpiRedeemRemoteStatus(value)));
        }


        function buildQueuedFreeAutoRedeemCandidates(results = {}, channel = 'upi', options = {}) {
          const redeemChannel = normalizeRedeemChannel(channel);
          const excludedEmail = parsePoolEntryEmail(options.excludeEmail || '');
          return (Array.isArray(results?.items) ? results.items : [])
            .map((item) => ({
              ...(item && typeof item === 'object' && !Array.isArray(item) ? item : {}),
              email: parsePoolEntryEmail(item?.email),
              accessToken: normalizeString(item?.accessToken || item?.upiRedeemAccessToken || item?.chatGptAccessToken),
            }))
            .filter((item) => {
              if (!item.email || item.email === excludedEmail) {
                return false;
              }
              if (normalizeString(item.status).toLowerCase() !== 'free' || item.enabled === false) {
                return false;
              }
              if (!item.accessToken || isAutoRedeemResultInFlight(item)) {
                return false;
              }
              return shouldRedeemItemUseChannel(item, redeemChannel);
            });
        }


        async function autoRedeemQueuedFreeCredentialsForChannel({
          runtimeState = {},
          visibleStep = 7,
          channel = 'upi',
          excludeEmail = '',
          skipReason = '',
        } = {}) {
          const redeemChannel = normalizeRedeemChannel(channel);
          const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
          if (typeof redeemUpiCredentialMembershipFree !== 'function') {
            return { status: 'skipped', reason: 'Free 队列兑换能力未接入' };
          }
          const latestState = await getMergedState(runtimeState);
          const availableCdkeyCount = countAvailableRedeemCdkeys(latestState, redeemChannel);
          if (availableCdkeyCount <= 0) {
            return { status: 'skipped', reason: `${redeemChannelLabel} 没有可用 CDK` };
          }
          const latestResults = latestState?.upiCredentialMembershipCheckResults
            || await readPersistedUpiCredentialMembershipResults()
            || {};
          const candidates = buildQueuedFreeAutoRedeemCandidates(latestResults, redeemChannel, {
            excludeEmail,
          });
          if (!candidates.length) {
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} 主流程自动兑换：当前账号${skipReason ? `不可用（${skipReason}）` : '不可用'}，但 Free 队列里没有其它可自动兑换的 ${redeemChannelLabel} 候选。`,
              'warn'
            );
            return { status: 'skipped', reason: `没有其它可自动兑换的 ${redeemChannelLabel} 候选` };
          }
          const queuedCredentials = candidates.slice(0, availableCdkeyCount);
          await addStepLog(
            visibleStep,
            `${redeemChannelLabel} 主流程自动兑换：当前账号${skipReason ? `不可用（${skipReason}）` : '不可用'}，检测到 ${availableCdkeyCount} 个可用 CDK，将自动处理 Free 队列候选 ${queuedCredentials.length}/${candidates.length} 个。`,
            'info'
          );
          try {
            const results = await redeemUpiCredentialMembershipFree({
              source: `registration-auto-${redeemChannel}-queue`,
              channel: redeemChannel,
              manualTrigger: false,
              disableGroupContinuation: true,
              credentials: queuedCredentials,
              deleteBackups: false,
              settings: latestState,
            });
            return {
              status: 'queue_submitted',
              channel: redeemChannel,
              reason: `${redeemChannelLabel} 已自动处理 Free 队列候选 ${queuedCredentials.length} 个`,
              queuedCount: queuedCredentials.length,
              candidateCount: candidates.length,
              results,
            };
          } catch (error) {
            const reason = getErrorMessage(error) || normalizeString(error?.message || error) || '队列兑换失败';
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} 主流程自动兑换：Free 队列续兑未启动：${reason}`,
              'warn'
            );
            return {
              status: 'skipped',
              channel: redeemChannel,
              reason,
              error,
            };
          }
        }


        async function attemptAutoRedeemTrialEligibleFreeCredentialChannel({
          runtimeState = {},
          visibleStep = 7,
          sessionState = {},
          email = '',
          item = {},
          channel = 'upi',
        } = {}) {
          throwIfStopped();
          const redeemChannel = normalizeRedeemChannel(channel);
          const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
          const normalizedEmail = parsePoolEntryEmail(email);
          const accessToken = getChatGptSessionAccessToken(sessionState?.session || sessionState)
            || normalizeString(sessionState?.accessToken || runtimeState.accessToken || runtimeState.upiRedeemAccessToken);
          if (!normalizedEmail || !accessToken) {
            const reason = !normalizedEmail ? '缺少账号邮箱' : '缺少 AT，无法自动兑换';
            await addStepLog(visibleStep, `${redeemChannelLabel} 主流程自动兑换：跳过：${reason}。`, 'warn');
            return { status: 'skipped', reason, item };
          }

          const latestState = await getMergedState(runtimeState);
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(latestState, redeemChannel));
          const cdkeys = getAvailableRedeemCdkeys(latestState, redeemChannel);
          const cdkey = pickFirstUnusedCdkey(cdkeys, usage) || cdkeys[0] || '';
          if (!cdkey) {
            const reason = `${redeemChannelLabel} 没有可用 CDK`;
            await addStepLog(visibleStep, `${redeemChannelLabel} 主流程自动兑换：${reason}，账号保留在 Free。`, 'warn');
            return { status: 'skipped', reason, item };
          }

          const redeemAttemptedAt = toIsoTimestamp();
          const runningReason = `主流程自动使用 ${redeemChannelLabel} CDK 兑换：${cdkey}`;
          const runningResults = await writeTrialEligibleFreeRedeemState({
            runtimeState: latestState,
            email: normalizedEmail,
            accessToken,
            checkedAt: redeemAttemptedAt,
            reason: runningReason,
            cdkey,
            patch: {
              status: 'free',
              planType: 'free',
              redeemStatus: 'running',
              redeemReason: runningReason,
              redeemAttemptedAt,
              redeemFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
              upiRedeemCdkey: cdkey,
              redeemChannel,
            },
          });
          const baseItem = findMembershipResultItem(runningResults, normalizedEmail) || item || {};

          await addStepLog(
            visibleStep,
            `${redeemChannelLabel} 主流程自动兑换：${normalizedEmail} -> ${cdkey}，正在提交到兑换后端。`,
            'info'
          );

          try {
            const redeemResult = await redeemUpiCredentialWithAccessToken({
              state: {
                ...latestState,
                visibleStep,
                channel: redeemChannel,
                redeemChannel,
              },
              credential: {
                ...baseItem,
                email: normalizedEmail,
              },
              session: sessionState?.session || sessionState,
              accessToken,
              forceCdkey: cdkey,
              channel: redeemChannel,
              skipEligibilityCheck: true,
              deferSubscriptionConfirmation: true,
            });
            const submittedCdkey = normalizeString(redeemResult?.cdkey || redeemResult?.upiRedeemCdkey || cdkey);
            if (redeemResult?.duplicateCdkeyRejected === true) {
              throw new Error(redeemResult.reason || 'CDK 重复提交，当前账号未提交成功。');
            }
            if (redeemResult?.pendingRemoteConfirmation === true) {
              const pendingReason = normalizeString(redeemResult.reason)
                || 'CDK 已提交，等待远端系统返回最终结果';
              const submittedResults = await writeTrialEligibleFreeRedeemState({
                runtimeState: latestState,
                email: normalizedEmail,
                accessToken,
                checkedAt: redeemAttemptedAt,
                reason: pendingReason,
                cdkey: submittedCdkey,
                patch: {
                  status: 'free',
                  planType: 'free',
                  redeemStatus: 'submitted',
                  redeemReason: pendingReason,
                  redeemAttemptedAt,
                  redeemFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
                  upiRedeemCdkey: submittedCdkey,
                  redeemChannel,
                },
              });
              await addStepLog(
                visibleStep,
                `${redeemChannelLabel} 主流程自动兑换：${normalizedEmail} -> ${submittedCdkey} 已提交，等待远端最终会员结果。`,
                'ok'
              );
              const remoteRefresh = await waitForSubmittedAutoRedeemRemoteRefresh({
                visibleStep,
                email: normalizedEmail,
                channel: redeemChannel,
                cdkey: submittedCdkey,
              });
              const latestAfterRemoteRefresh = await getMergedState({});
              const latestSubmittedItem = findMembershipResultItem(
                latestAfterRemoteRefresh?.upiCredentialMembershipCheckResults,
                normalizedEmail
              );
              return {
                status: 'submitted',
                channel: redeemChannel,
                cdkey: submittedCdkey,
                reason: remoteRefresh?.reason || pendingReason,
                remoteRefreshStatus: remoteRefresh?.status || '',
                item: latestSubmittedItem || findMembershipResultItem(submittedResults, normalizedEmail) || baseItem,
              };
            }

            const planType = normalizeSubscriptionPlanType(redeemResult?.planType || redeemResult?.subscription?.planType);
            const successReason = normalizeString(redeemResult?.reason) || (planType ? `已开通 ${planType}` : 'CDK 兑换已提交');
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} 主流程自动兑换：${normalizedEmail} -> ${submittedCdkey} 返回非等待状态：${successReason}`,
              'ok'
            );
            return {
              status: redeemResult?.active ? 'success' : 'submitted',
              channel: redeemChannel,
              cdkey: submittedCdkey,
              reason: successReason,
              item: baseItem,
            };
          } catch (error) {
            if (isFlowStoppedError(error)) {
              throw error;
            }
            const reason = getErrorMessage(error) || '兑换失败';
            const failedAt = toIsoTimestamp();
            const countFailure = shouldCountAutoRedeemFailure(error);
            const failurePatch = countFailure
              ? buildRedeemChannelFailurePatch(baseItem, redeemChannel, { reason, failedAt })
              : {};
            const channelFailureCount = getRedeemChannelFailureCount({
              ...baseItem,
              ...failurePatch,
            }, redeemChannel);
            const reachedUpiDailyLimit = countFailure
              && redeemChannel === 'upi'
              && isRedeemChannelDailyLimitReason(reason);
            const reachedIdealLock = countFailure
              && redeemChannel === 'ideal'
              && channelFailureCount >= REDEEM_CHANNEL_FAILURE_LIMIT;
            const nextReason = countFailure
              ? (reachedIdealLock
                  ? failurePatch.redeemLockedReason
                  : reachedUpiDailyLimit
                    ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                  : `${reason}（${redeemChannelLabel} 失败 ${channelFailureCount}/${REDEEM_CHANNEL_FAILURE_LIMIT}）`)
              : `${reason}；未计入账号兑换失败次数。`;
            const failedResults = await writeTrialEligibleFreeRedeemState({
              runtimeState: latestState,
              email: normalizedEmail,
              accessToken,
              checkedAt: failedAt,
              reason: nextReason,
              cdkey: countFailure ? '' : cdkey,
              patch: {
                status: 'free',
                planType: 'free',
                redeemStatus: countFailure ? 'failed' : 'blocked',
                redeemReason: reason,
                redeemAttemptedAt,
                ...(countFailure ? failurePatch : {}),
                lastFailedUpiRedeemCdkey: countFailure ? cdkey : baseItem.lastFailedUpiRedeemCdkey,
                upiRedeemCdkey: countFailure ? '' : cdkey,
                redeemChannel,
              },
            });
            await addStepLog(
              visibleStep,
              countFailure
                ? `${redeemChannelLabel} 主流程自动兑换：${normalizedEmail} -> ${cdkey} 失败：${nextReason}`
                : `${redeemChannelLabel} 主流程自动兑换：${normalizedEmail} -> ${cdkey} 阻塞但不计失败：${reason}`,
              countFailure ? 'warn' : 'error'
            );
            return {
              status: countFailure ? 'failed' : 'blocked',
              channel: redeemChannel,
              cdkey,
              reason: nextReason,
              failureCount: channelFailureCount,
              shouldTryIdeal: reachedUpiDailyLimit,
              locked: reachedIdealLock,
              item: findMembershipResultItem(failedResults, normalizedEmail) || {
                ...baseItem,
                ...failurePatch,
              },
            };
          }
        }


        async function autoRedeemTrialEligibleFreeCredential({
          runtimeState = {},
          visibleStep = 7,
          sessionState = {},
          email = '',
          eligibility = {},
        } = {}) {
          const normalizedEmail = parsePoolEntryEmail(email || eligibility.email);
          if (!normalizedEmail) {
            return { status: 'skipped', reason: '缺少账号邮箱' };
          }
          if (typeof upsertTrialEligibleFreeCredential !== 'function') {
            await addStepLog(visibleStep, '主流程自动兑换：Free 分组写入能力未接入，已跳过自动兑换。', 'warn');
            return { status: 'skipped', reason: 'Free 分组写入能力未接入' };
          }
          let currentItem = findMembershipResultItem(eligibility.freeResults, normalizedEmail);
          if (isRedeemAccountLocked(currentItem)) {
            const reason = normalizeString(currentItem.redeemLockedReason) || '账号已封存，不再自动兑换';
            await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} 已封存，跳过：${reason}`, 'warn');
            return { status: 'skipped', reason, item: currentItem };
          }
          if (isAutoRedeemResultInFlight(currentItem)) {
            const reason = normalizeString(currentItem.redeemReason) || '已有兑换任务等待远端结果';
            await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} 已有兑换任务处理中，跳过重复提交：${reason}`, 'warn');
            return { status: 'skipped', reason, item: currentItem };
          }

          const latestState = await getMergedState(runtimeState);
          const upiAvailable = countAvailableRedeemCdkeys(latestState, 'upi');
          const idealAvailable = countAvailableRedeemCdkeys(latestState, 'ideal');
          if (upiAvailable <= 0 && idealAvailable <= 0) {
            const reason = 'UPI/IDEAL 都没有可用 CDK';
            await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} 已进入 Free，但 ${reason}，等待导入卡密后手动兑换。`, 'warn');
            return { status: 'skipped', reason, item: currentItem };
          }

          if (upiAvailable > 0 && shouldRedeemItemUseChannel(currentItem, 'upi')) {
            const upiResult = await attemptAutoRedeemTrialEligibleFreeCredentialChannel({
              runtimeState: latestState,
              visibleStep,
              sessionState,
              email: normalizedEmail,
              item: currentItem,
              channel: 'upi',
            });
            currentItem = upiResult.item || currentItem;
            if (upiResult.status === 'submitted' || upiResult.status === 'success') {
              return upiResult;
            }
            if (!upiResult.shouldTryIdeal) {
              return upiResult;
            }
            await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} UPI 明确返回今日提交次数上限，准备改用 IDEAL。`, 'warn');
          } else if (upiAvailable <= 0) {
            await addStepLog(visibleStep, `主流程自动兑换：UPI 当前没有可用 CDK，${normalizedEmail} 将尝试 IDEAL。`, 'warn');
          } else {
            const upiSkipReason = getRedeemChannelSkipReason(currentItem, 'upi') || '当前账号不符合 UPI 自动兑换条件';
            const queuedUpiResult = await autoRedeemQueuedFreeCredentialsForChannel({
              runtimeState: latestState,
              visibleStep,
              channel: 'upi',
              excludeEmail: normalizedEmail,
              skipReason: upiSkipReason,
            });
            if (queuedUpiResult.status === 'queue_submitted') {
              return queuedUpiResult;
            }
            await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} UPI 当前不可用（${upiSkipReason}），将尝试 IDEAL。`, 'warn');
          }

          if (idealAvailable > 0 && shouldRedeemItemUseChannel(currentItem, 'ideal')) {
            return attemptAutoRedeemTrialEligibleFreeCredentialChannel({
              runtimeState: latestState,
              visibleStep,
              sessionState,
              email: normalizedEmail,
              item: currentItem,
              channel: 'ideal',
            });
          }

          const reason = idealAvailable <= 0
            ? 'IDEAL 没有可用 CDK'
            : 'IDEAL 已达到失败上限或账号已封存';
          await addStepLog(visibleStep, `主流程自动兑换：${normalizedEmail} 未继续 IDEAL：${reason}。`, 'warn');
          return { status: 'skipped', reason, item: currentItem };
        }


        async function executeUpiRedeem(state = {}) {
          throwIfStopped();
          const runtimeState = await getMergedState(state);
          await setState({
            upiRedeemSuccess: false,
            upiRedeemCdkey: '',
            upiRedeemAccessToken: '',
            upiRedeemSubscriptionActive: false,
            upiRedeemSubscriptionPlanType: '',
            upiRedeemSubscriptionCheckedAt: '',
            upiRedeemSubscriptionReason: '',
          });
          const visibleStep = resolveVisibleStep(runtimeState);
          {
          await addStepLog(
            visibleStep,
            '主流程 UPI 节点会先检测试用资格；只有资格通过才写入 Free 组，如果有可用 CDK，将自动提交兑换。',
            'info'
          );
          const tabId = await resolveSessionTabId(runtimeState);
          const tab = await getResolvedSessionTab(tabId, visibleStep);
          if (chrome?.tabs?.update) {
            await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
          }
          await addStepLog(
            visibleStep,
            `正在读取当前账号 ChatGPT session，用于 UPI 试用资格检测：标签页 ${tab.id}（${tab.url || 'unknown'}）。`,
            'info'
          );
          const sessionState = await readCurrentChatGptSession(tab.id, visibleStep);
          throwIfStopped();
          const sessionEmail = resolveCurrentRedeemEmail(runtimeState, sessionState);
          await addStepLog(
            visibleStep,
            `已读取 ChatGPT session：${sessionEmail || 'unknown'} -> session字段 ${getChatGptSessionFieldCount(sessionState)}。`,
            'ok'
          );
          const eligibility = await checkRegistrationUpiTrialEligibility({
            state: {
              ...runtimeState,
              email: sessionEmail || runtimeState.email,
              visibleStep,
            },
            patch: {
              email: sessionEmail || runtimeState.email,
            },
            session: sessionState.session || sessionState,
            accessToken: sessionState.accessToken,
            email: sessionEmail || runtimeState.email,
            visibleStep,
          });
          const eligibilityForRedeem = {
            ...eligibility,
            freeResults: eligibility?.freeResults || null,
          };
          const autoRedeem = eligibility?.eligible === true
            ? await autoRedeemTrialEligibleFreeCredential({
                runtimeState: {
                  ...runtimeState,
                  email: eligibility?.email || sessionEmail || runtimeState.email,
                  visibleStep,
                },
                visibleStep,
                sessionState,
                email: eligibility?.email || sessionEmail || runtimeState.email,
                eligibility: eligibilityForRedeem,
              })
            : {
                status: 'skipped',
                reason: eligibility?.trialEligibilityStatus === 'ineligible'
                  ? (eligibility?.reason || '账号无试用资格，已在邮箱池标记，不写入 Free')
                  : (eligibility?.reason || 'UPI 资格检测未通过，账号未进入 Free 组'),
              };
          await addStepLog(
            visibleStep,
            eligibility?.eligible === true
              ? (autoRedeem?.status === 'submitted'
                  ? `主流程 UPI 资格检测完成，账号已进入 Free，并已自动提交 ${getRedeemChannelLabel(autoRedeem.channel)} 兑换：${eligibility?.email || sessionEmail || 'unknown'} -> ${autoRedeem.cdkey || 'unknown'}。`
                  : autoRedeem?.status === 'queue_submitted'
                    ? `主流程 UPI 资格检测完成，账号已进入 Free；本轮账号未直接兑换，已自动接力 ${getRedeemChannelLabel(autoRedeem.channel)} Free 队列：${autoRedeem.reason || '已处理队列候选'}。`
                  : `主流程 UPI 资格检测完成，账号已进入 Free；自动兑换未提交：${autoRedeem?.reason || '未满足自动兑换条件'}。`)
              : `主流程 UPI 资格检测未通过，账号未进入 Free；自动兑换未提交：${autoRedeem?.reason || '未满足自动兑换条件'}。`,
            (autoRedeem?.status === 'submitted' || autoRedeem?.status === 'queue_submitted') ? 'success' : 'warn'
          );
          await completeNodeFromBackground(state?.nodeId || 'upi-redeem', {
            email: eligibility?.email || sessionEmail || runtimeState.email || '',
            upiTrialEligible: eligibility?.eligible === true,
            upiTrialEligibilityReason: eligibility?.reason || '',
            upiTrialEligibilityCheckedAt: eligibility?.checkedAt || toIsoTimestamp(),
            upiAutoRedeemStatus: autoRedeem?.status || '',
            upiAutoRedeemChannel: autoRedeem?.channel || '',
            upiAutoRedeemCdkey: autoRedeem?.cdkey || '',
            upiAutoRedeemReason: autoRedeem?.reason || '',
          });
          return {
            ...eligibility,
            autoRedeem,
          };
          }

          const apiUrl = buildUpiRedeemApiUrl(runtimeState);
          const checkUrl = buildUPIAccessTokenCheckApiUrl(runtimeState);
          const externalApiKey = normalizeString(getUpiRedeemStateValue(runtimeState, 'upiRedeemExternalApiKey'));
          if (!externalApiKey) {
            throw new Error('UPI External API Key 未配置，请先在侧边栏填写 UPI 外部 API Key。');
          }
          const clientId = await resolveUpiRedeemClientId(runtimeState);
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, 'upi'));
          const cdkeys = getAvailableCdkeysForChannel(runtimeState, 'upi');
          const cdkey = pickFirstUnusedCdkey(cdkeys, usage);
          if (!cdkey) {
            throw new Error('没有可用的 CDK，请在侧边栏导入可用 CDK。');
          }
          const selectedUsage = usage?.[cdkey] || {};

          await addStepLog(visibleStep, '正在读取当前 ChatGPT session，用于 CDK 兑换...', 'info');
          if (isRetryableRemoteStatus(selectedUsage.remoteStatus)) {
            await addStepLog(
              visibleStep,
              `CDK ${cdkey} 上次状态为 ${normalizeUpiRedeemRemoteStatus(selectedUsage.remoteStatus)}，但未标记已用，将继续重试。`,
              'warn'
            );
          }
          const tabId = await resolveSessionTabId(runtimeState);
          const tab = await getResolvedSessionTab(tabId, visibleStep);
          if (chrome?.tabs?.update) {
            await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
          }
          await addStepLog(visibleStep, `UPI 兑换步骤读取当前账号 ChatGPT session：已选中标签页 ${tab.id}（${tab.url || 'unknown'}），session API：${CHATGPT_SESSION_API_URL}`, 'info');
          let sessionState = await readCurrentChatGptSession(tab.id, visibleStep);
          throwIfStopped();
          const sessionEmailForLog = resolveCurrentRedeemEmail({}, sessionState) || 'unknown';
          await addStepLog(
            visibleStep,
            `已读取 UPI 兑换 ChatGPT session：${sessionEmailForLog} -> session字段 ${getChatGptSessionFieldCount(sessionState)}。`,
            'ok'
          );

          const attemptAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          const latestForSubscription = await getMergedState({});
          let duplicateCdkeyPending = false;
          let redeemBackendAccepted = false;
          let currentEmail = resolveCurrentRedeemEmail({
            ...runtimeState,
            ...latestForSubscription,
          }, sessionState);
          const recordTrialEligibleFreeCredential = async (eligibility = {}) => {
            await addStepLog(visibleStep, `UPI 资格检查通过，正在写入 Free 分组：${currentEmail || 'unknown'} -> ${cdkey}`, 'ok');
            if (typeof upsertTrialEligibleFreeCredential === 'function') {
              try {
                await upsertTrialEligibleFreeCredential({
                  source: 'registration-upi-eligibility',
                  email: currentEmail,
                  credential: buildCurrentUpiCredentialForMembership({
                    ...runtimeState,
                    ...latestForSubscription,
                  }, currentEmail),
                  cdkey,
                  accessToken: sessionState.accessToken,
                  accessTokenMasked: maskAccessToken(sessionState.accessToken),
                  reason: normalizeString(eligibility?.item?.message || eligibility?.item?.reason) || '账号有试用资格，可进行 CDK 兑换',
                  checkedAt: toIsoTimestamp(attemptAt),
                });
                await addStepLog(visibleStep, `已加入 Free 分组并标记“有试用资格”：${currentEmail || 'unknown'}`, 'ok');
              } catch (freeGroupError) {
                await addStepLog(visibleStep, `资格已通过，但写入 Free 分组失败：${getErrorMessage(freeGroupError) || freeGroupError}`, 'warn');
              }
            }
          };
          await addStepLog(visibleStep, `正在检查 UPI ChatGPT session 资格：${cdkey} -> ${checkUrl}`, 'info');
          try {
            const eligibility = await checkUPIAccessTokenEligibility({
              checkUrl,
              externalApiKey,
              clientId,
              cdkey,
              session: sessionState,
              accessToken: sessionState.accessToken,
              expectedEmail: currentEmail,
            });
            await recordTrialEligibleFreeCredential(eligibility);
          } catch (error) {
            const message = getErrorMessage(error) || 'UPI 资格检查失败。';
            if (isUpiAccessTokenExpiredError(error)) {
              sessionState = await refreshCurrentChatGptSessionAndReadToken(tab.id, visibleStep, message);
              currentEmail = resolveCurrentRedeemEmail({
                ...runtimeState,
                ...latestForSubscription,
              }, sessionState);
              await addStepLog(visibleStep, `正在使用刷新后的 UPI ChatGPT session 重试资格检查：${cdkey} -> ${checkUrl}`, 'info');
              try {
                const retryEligibility = await checkUPIAccessTokenEligibility({
                  checkUrl,
                  externalApiKey,
                  clientId,
                  cdkey,
                  session: sessionState,
                  accessToken: sessionState.accessToken,
                  expectedEmail: currentEmail,
                });
                await recordTrialEligibleFreeCredential(retryEligibility);
                await addStepLog(visibleStep, 'UPI ChatGPT session 刷新后资格检查通过，继续兑换。', 'ok');
              } catch (retryError) {
                const retryMessage = getErrorMessage(retryError) || 'UPI 资格检查失败。';
                if (isApproveBlockedError(retryError)) {
                  await releaseCdkeyForApproveBlocked({
                    cdkey,
                    email: currentEmail,
                    reason: retryMessage,
                    attemptAt,
                    visibleStep,
                    state: {
                      ...runtimeState,
                      ...latestForSubscription,
                      email: currentEmail || latestForSubscription.email || runtimeState.email,
                    },
                  });
                  throw retryError;
                }
                await updateCdkeyUsage(cdkey, (entry) => ({
                  ...entry,
                  email: currentEmail,
                  accessToken: sessionState.accessToken,
                  accessTokenMasked: maskAccessToken(sessionState.accessToken),
                  accessTokenUpdatedAt: attemptAt,
                  lastAttemptAt: attemptAt,
                  lastError: retryMessage,
                }));
                if (isUpiAccountIneligibleError(retryError)) {
                  await addStepLog(visibleStep, `刷新 ChatGPT 页面后 UPI 资格检查确认账号无资格，账号未进入 Free 组，未提交到兑换后端 ${apiUrl}：${retryMessage}`, 'error');
                  throw retryError;
                }
                if (isUpiAccessTokenExpiredError(retryError)) {
                  await recordAccessTokenExpiredCdkeyAttempt({
                    cdkey,
                    email: currentEmail,
                    attemptAt,
                    message: retryMessage,
                  });
                  await addStepLog(visibleStep, `刷新 ChatGPT 页面后优惠资格验证仍提示 token/session 失效，将按完整 session 继续提交兑换后端 ${apiUrl}：${retryMessage}`, 'warn');
                } else {
                  await addStepLog(visibleStep, `刷新 ChatGPT 页面后 UPI 资格检查仍失败，将继续提交兑换后端 ${apiUrl} 留痕：${retryMessage}`, 'warn');
                }
              }
            } else {
              if (isApproveBlockedError(error)) {
                await releaseCdkeyForApproveBlocked({
                  cdkey,
                  email: currentEmail,
                  reason: message,
                  attemptAt,
                  visibleStep,
                  state: {
                    ...runtimeState,
                    ...latestForSubscription,
                    email: currentEmail || latestForSubscription.email || runtimeState.email,
                  },
                });
                throw error;
              }
              await addStepLog(visibleStep, `UPI 资格检查失败，将继续提交兑换后端 ${apiUrl} 留痕：${message}`, 'warn');
              await updateCdkeyUsage(cdkey, (entry) => ({
                ...entry,
                email: currentEmail,
                accessToken: sessionState.accessToken,
                accessTokenMasked: maskAccessToken(sessionState.accessToken),
                accessTokenUpdatedAt: attemptAt,
                lastAttemptAt: attemptAt,
                lastError: message,
              }));
              if (isUpiAccountIneligibleError(error)) {
                await addStepLog(visibleStep, `UPI 资格检查确认账号无资格，账号未进入 Free 组，未提交到兑换后端 ${apiUrl}：${message}`, 'error');
                throw error;
              }
              await addStepLog(visibleStep, `UPI 资格检查接口失败，将继续提交兑换后端 ${apiUrl} 留痕：${message}`, 'warn');
            }
          }

          await addStepLog(visibleStep, `正在提交 ChatGPT session+CDK 到 UPI 兑换接口：${currentEmail || 'unknown'} -> session字段 ${getChatGptSessionFieldCount(sessionState)} -> ${cdkey} -> ${apiUrl}`, 'info');
          await reserveCdkeyForRedeemSubmission({
            cdkey,
            email: currentEmail,
            accessToken: sessionState.accessToken,
            attemptAt,
            message: `正在提交兑换：${currentEmail || 'unknown'}`,
          });
          try {
            await postUpiRedeem({
              apiUrl,
              externalApiKey,
              clientId,
              cdkey,
              session: sessionState,
              accessToken: sessionState.accessToken,
              state: runtimeState,
            });
            redeemBackendAccepted = true;
            await addStepLog(visibleStep, `UPI 兑换接口已接收 ChatGPT session+CDK：${currentEmail || 'unknown'} -> ${cdkey}`, 'ok');
            await updateCdkeyUsage(cdkey, (entry) => ({
              ...entry,
              email: currentEmail,
              accessToken: sessionState.accessToken,
              accessTokenMasked: maskAccessToken(sessionState.accessToken),
              accessTokenUpdatedAt: attemptAt,
              usedAt: 0,
              lastAttemptAt: attemptAt,
              lastError: '',
              remoteStatus: 'submitted',
              remoteMessage: '已提交到兑换后端，等待确认会员',
              remoteCheckedAt: attemptAt,
              retrying: false,
              retryError: '',
            }));
            await addStepLog(visibleStep, `CDK 已提交到兑换后端，暂不从本地 CDK 池移除，等待确认会员成功后再清理：${cdkey}`, 'info');
            const subscriptionResult = await confirmCurrentRedeemPaidSubscription({
              state: latestForSubscription,
              email: currentEmail,
              cdkey,
              accessToken: sessionState.accessToken,
            });
            const subscriptionPlanType = normalizeSubscriptionPlanType(subscriptionResult.planType);
            const subscriptionReason = await recordCdkeySubscriptionConfirmation({
              cdkey,
              email: currentEmail,
              attemptAt,
              subscriptionResult,
              subscriptionPlanType,
            });
            const subscriptionUpdates = {
              upiRedeemSubscriptionActive: Boolean(subscriptionResult.active),
              upiRedeemSubscriptionPlanType: subscriptionPlanType,
              upiRedeemSubscriptionCheckedAt: toIsoTimestamp(subscriptionResult.checkedAt),
              upiRedeemSubscriptionReason: subscriptionReason,
            };
            const successStateUpdates = {
              upiRedeemSuccess: true,
              upiRedeemCdkey: cdkey,
              upiRedeemAccessToken: sessionState.accessToken,
              ...subscriptionUpdates,
            };
            try {
              await setState(successStateUpdates);
            } catch (stateError) {
              await addStepLog(
                visibleStep,
                `CDK 已兑换成功，但记录兑换成功标志失败：${getErrorMessage(stateError) || stateError}`,
                'warn'
              );
            }
            if (subscriptionResult.active) {
              const planLabel = getPaidSubscriptionPlanLabel(subscriptionPlanType);
              try {
                const cleanupState = await getMergedState({
                  ...successStateUpdates,
                  email: currentEmail || latestForSubscription.email,
                });
                const cleanupUpdates = await applyPaidSubscriptionCleanup({
                  state: cleanupState,
                  cdkey,
                  email: currentEmail,
                  visibleStep,
                });
                const cleanupParts = [];
                if (cleanupUpdates.upiRedeemCdkeyPoolText !== undefined) {
                  cleanupParts.push('CDK 列表');
                }
                if (
                  cleanupUpdates.customMailProviderPool !== undefined
                  || cleanupUpdates.customEmailPoolEntries !== undefined
                  || cleanupUpdates.customEmailPool !== undefined
                ) {
                  cleanupParts.push('邮箱列表');
                }
                await addStepLog(
                  visibleStep,
                  cleanupParts.length
                    ? `已确认账号开通 ${planLabel} 会员，已清理可用池：${cleanupParts.join('、')}。`
                    : `已确认账号开通 ${planLabel} 会员。`,
                  'success'
                );
              } catch (cleanupError) {
                await addStepLog(
                  visibleStep,
                  `已确认账号开通 ${planLabel} 会员，但清理邮箱/CDK 列表失败：${getErrorMessage(cleanupError) || cleanupError}`,
                  'warn'
                );
              }
            } else {
              await addStepLog(
                visibleStep,
                `CDK 已提交成功，但会员状态待确认，暂不删除邮箱和 CDK：${subscriptionReason}`,
                'warn'
              );
            }
            if (
              !shouldMarkRegistrationAccountUsedAfterRedeem(runtimeState)
              && typeof appendAccountRunRecord === 'function'
            ) {
              try {
                const latestState = await getMergedState(successStateUpdates);
                await appendAccountRunRecord('success', {
                  ...latestState,
                  ...successStateUpdates,
                }, 'CDK 兑换成功');
              } catch (recordError) {
                await addStepLog(
                  visibleStep,
                  `CDK 已兑换成功，但记录兑换成功邮箱失败：${getErrorMessage(recordError) || recordError}`,
                  'warn'
                );
              }
            }
          } catch (error) {
            const message = getErrorMessage(error) || 'CDK 兑换失败。';
            if (isUpiAccessTokenExpiredError(error)) {
              await addStepLog(
                visibleStep,
                `UPI 兑换后端提示 ChatGPT session 失效，已停止当前兑换步骤，CDK 不记失败：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await recordAccessTokenExpiredCdkeyAttempt({
                cdkey,
                email: currentEmail,
                attemptAt,
                message,
              });
              throw error;
            }
            if (isApproveBlockedError(error)) {
              await addStepLog(
                visibleStep,
                `UPI 后端返回 approve-blocked，立即释放 CDK 并保留账号：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await releaseCdkeyForApproveBlocked({
                cdkey,
                email: currentEmail,
                reason: message,
                attemptAt,
                visibleStep,
                state: {
                  ...runtimeState,
                  ...latestForSubscription,
                  email: currentEmail || latestForSubscription.email || runtimeState.email,
                },
              });
              throw error;
            }
            if (isUpiRedeemNotAcceptedError(error)) {
              await addStepLog(
                visibleStep,
                `UPI 兑换接口未确认接收，后端没有兑换记录，已释放 CDK：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await releaseCdkeyForUnacceptedSubmission({
                cdkey,
                reason: message,
                attemptAt,
              });
              await setState({
                upiRedeemSuccess: false,
                upiRedeemCdkey: '',
                upiRedeemAccessToken: '',
                upiRedeemSubscriptionActive: false,
                upiRedeemSubscriptionPlanType: '',
                upiRedeemSubscriptionCheckedAt: '',
                upiRedeemSubscriptionReason: message,
              }).catch(() => {});
              throw error;
            }
            if (isUpiRedeemDuplicateCdkeyError(error)) {
              const pendingReason = `${message || '后端提示 CDK 已提交过'}；这张 CDK 已被占用，当前账号未提交成功，本账号本轮结束。`;
              await addStepLog(
                visibleStep,
                `UPI 后端提示 CDK 重复提交，当前账号未提交成功，本账号本轮结束：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await updateCdkeyUsage(cdkey, (entry) => ({
                ...entry,
                email: '',
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: 0,
                usedAt: 0,
                lastAttemptAt: attemptAt,
                lastError: '',
                remoteStatus: 'submitted',
                remoteMessage: pendingReason,
                remoteCheckedAt: attemptAt,
                retrying: false,
                retryError: '',
              }));
              await setState({
                upiRedeemSuccess: false,
                upiRedeemCdkey: '',
                upiRedeemAccessToken: '',
                upiRedeemSubscriptionActive: false,
                upiRedeemSubscriptionPlanType: '',
                upiRedeemSubscriptionCheckedAt: '',
                upiRedeemSubscriptionReason: pendingReason,
              }).catch(() => {});
              throw new Error(`${UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX}${pendingReason}`);
            } else if (redeemBackendAccepted) {
              duplicateCdkeyPending = true;
              const pendingReason = `CDK 已提交到兑换后端，但本地会员确认失败：${message}；已保持处理中，等待远端状态刷新`;
              await addStepLog(
                visibleStep,
                `CDK 已被兑换接口接收，本地确认会员失败，已按处理中记录：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await updateCdkeyUsage(cdkey, (entry) => ({
                ...entry,
                email: currentEmail,
                accessToken: sessionState.accessToken,
                accessTokenMasked: maskAccessToken(sessionState.accessToken),
                accessTokenUpdatedAt: attemptAt,
                usedAt: 0,
                lastAttemptAt: attemptAt,
                lastError: '',
                remoteStatus: 'submitted',
                remoteMessage: pendingReason,
                remoteCheckedAt: attemptAt,
                retrying: false,
                retryError: '',
              }));
              await setState({
                upiRedeemSuccess: false,
                upiRedeemCdkey: cdkey,
                upiRedeemAccessToken: sessionState.accessToken,
                upiRedeemSubscriptionActive: false,
                upiRedeemSubscriptionPlanType: '',
                upiRedeemSubscriptionCheckedAt: '',
                upiRedeemSubscriptionReason: pendingReason,
              }).catch(() => {});
            } else {
              await addStepLog(
                visibleStep,
                `UPI ChatGPT session+CDK 提交失败：${currentEmail || 'unknown'} -> ${cdkey}：${message}`,
                'error'
              );
              await addStepLog(visibleStep, `CDK 兑换失败：${message}`, 'error');
              await updateCdkeyUsage(cdkey, (entry) => ({
                ...entry,
                email: '',
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: 0,
                usedAt: 0,
                lastAttemptAt: attemptAt,
                lastError: message,
                lastFailedEmail: currentEmail,
                lastFailedAt: attemptAt,
                lastFailedReason: message,
                remoteStatus: 'failed',
                remoteMessage: `${message}；CDK 已回到可用池，等待其他账号匹配`,
                remoteCheckedAt: attemptAt,
                retrying: false,
                retryError: message,
              }));
              throw error;
            }
          }

          if (
            !duplicateCdkeyPending
            &&
            shouldMarkRegistrationAccountUsedAfterRedeem(runtimeState)
            && typeof markCurrentRegistrationAccountUsed === 'function'
          ) {
            try {
              const latestState = await getMergedState({
                upiRedeemSuccess: true,
                upiRedeemCdkey: cdkey,
                upiRedeemAccessToken: sessionState.accessToken,
              });
              await markCurrentRegistrationAccountUsed(latestState, {
                logPrefix: 'CDK 兑换成功',
                level: 'ok',
              });
            } catch (error) {
              await addStepLog(
                visibleStep,
                `CDK 已兑换成功，但标记当前账号已用失败：${getErrorMessage(error) || error}`,
                'warn'
              );
            }
          }

          const successMessage = duplicateCdkeyPending
            ? 'CDK 已提交到兑换后端，已等待远端状态刷新，暂不判定账号成功或失败。'
            : shouldMarkRegistrationAccountUsedAfterRedeem(runtimeState)
            ? 'CDK 兑换成功，已停止后续 OAuth 后链。'
            : 'CDK 兑换成功，继续 OAuth 后链。';
          await addStepLog(visibleStep, successMessage, duplicateCdkeyPending ? 'warn' : 'success');
          const completionLatestState = await getMergedState({});
          await completeNodeFromBackground(state?.nodeId || 'upi-redeem', {
            cdkey,
            accessToken: sessionState.accessToken,
            upiRedeemAccessToken: sessionState.accessToken,
            upiRedeemSubscriptionActive: Boolean(completionLatestState?.upiRedeemSubscriptionActive),
            upiRedeemSubscriptionPlanType: normalizeSubscriptionPlanType(completionLatestState?.upiRedeemSubscriptionPlanType),
            upiRedeemSubscriptionCheckedAt: normalizeString(completionLatestState?.upiRedeemSubscriptionCheckedAt),
          });
        }


    return {
      isAutoRedeemResultInFlight,
      buildQueuedFreeAutoRedeemCandidates,
      autoRedeemQueuedFreeCredentialsForChannel,
      attemptAutoRedeemTrialEligibleFreeCredentialChannel,
      autoRedeemTrialEligibleFreeCredential,
      executeUpiRedeem,
    };
  }

  return {
    createUpiRedeemFinalize,
  };
});
